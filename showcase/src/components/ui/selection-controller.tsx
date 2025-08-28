"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTamboComponentState } from "@tambo-ai/react";
import React, { useCallback, useMemo, useRef } from "react";
import { z } from "zod";

// Zod schema for SelectionController props
export const SelectionControllerPropsSchema = z.object({
  mode: z
    .enum(["single", "multi"])
    .describe("Selection mode: single or multiple items"),
  selectedIds: z
    .array(z.string())
    .describe("Array of currently selected item IDs"),
  totalCount: z.number().min(0).describe("Total number of selectable items"),
  onChange: z
    .function(
      z.tuple([
        z.object({
          selectedIds: z.array(z.string()),
          action: z.enum(["select", "deselect", "selectAll", "clear"]),
          targetIds: z.array(z.string()).optional(),
        }),
      ]),
      z.void(),
    )
    .describe("Callback function when selection changes"),
  disabledIds: z
    .array(z.string())
    .optional()
    .describe("Array of disabled item IDs"),
  className: z.string().optional().describe("Additional CSS classes"),
  showSelectAll: z
    .boolean()
    .optional()
    .default(true)
    .describe("Show select all/clear buttons"),
  showCount: z
    .boolean()
    .optional()
    .default(true)
    .describe("Show selection count"),
  label: z.string().optional().describe("Accessible label for the controller"),
  "aria-describedby": z
    .string()
    .optional()
    .describe("ID of element describing the controller"),
  availableIds: z
    .array(z.string())
    .optional()
    .describe("Available item IDs for select all functionality"),
});

export type SelectionControllerProps = z.infer<
  typeof SelectionControllerPropsSchema
>;

export interface SelectionState {
  selectedIds: string[];
  action: "select" | "deselect" | "selectAll" | "clear";
  targetIds?: string[];
}

export interface SelectionIntents {
  select: (ids: string[]) => void;
  deselect: (ids: string[]) => void;
  selectAll: () => void;
  clear: () => void;
  toggle: (id: string) => void;
  isSelected: (id: string) => boolean;
  isDisabled: (id: string) => boolean;
  getSelectionState: () => {
    selectedCount: number;
    totalCount: number;
    isAllSelected: boolean;
    isPartiallySelected: boolean;
    isEmpty: boolean;
  };
}

const SelectionControllerComponent = React.forwardRef<
  HTMLDivElement,
  SelectionControllerProps
>(
  (
    {
      mode,
      selectedIds: initialSelectedIds = [],
      totalCount,
      onChange,
      disabledIds = [],
      className,
      showSelectAll = true,
      showCount = true,
      label,
      availableIds,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) => {
    const [selectedIds, setSelectedIds] = useTamboComponentState(
      "selectedIds",
      initialSelectedIds,
    );

    // Ensure selectedIds is always an array
    const safeSelectedIds = selectedIds || [];

    const controllerRef = useRef<HTMLDivElement>(null);
    const selectAllRef = useRef<HTMLButtonElement>(null);
    const clearRef = useRef<HTMLButtonElement>(null);

    // Memoized selection state calculations
    const selectionState = useMemo(() => {
      const enabledCount = totalCount - (disabledIds ?? []).length;
      const selectedCount = safeSelectedIds.length;
      const enabledSelectedCount = safeSelectedIds.filter(
        (id) => !(disabledIds ?? []).includes(id),
      ).length;

      return {
        selectedCount,
        totalCount,
        enabledCount,
        enabledSelectedCount,
        isAllSelected:
          enabledCount > 0 && enabledSelectedCount === enabledCount,
        isPartiallySelected:
          enabledSelectedCount > 0 && enabledSelectedCount < enabledCount,
        isEmpty: selectedCount === 0,
      };
    }, [safeSelectedIds, totalCount, disabledIds]);

    // Selection intents implementation
    const intents: SelectionIntents = useMemo(
      () => ({
        select: (ids: string[]) => {
          const validIds = ids.filter(
            (id) => !(disabledIds ?? []).includes(id),
          );
          if (validIds.length === 0) return;

          let newSelectedIds: string[];
          if (mode === "single") {
            newSelectedIds = [validIds[0]];
          } else {
            newSelectedIds = [...new Set([...safeSelectedIds, ...validIds])];
          }

          setSelectedIds(newSelectedIds);
          onChange({
            selectedIds: newSelectedIds,
            action: "select",
            targetIds: validIds,
          });
        },

        deselect: (ids: string[]) => {
          const newSelectedIds = safeSelectedIds.filter(
            (id) => !ids.includes(id),
          );
          setSelectedIds(newSelectedIds);
          onChange({
            selectedIds: newSelectedIds,
            action: "deselect",
            targetIds: ids,
          });
        },

        selectAll: () => {
          if (mode === "single") return;

          // Use availableIds if provided, otherwise generate from totalCount
          const allIds =
            availableIds ??
            Array.from({ length: totalCount }, (_, i) => i.toString());
          const enabledIds = allIds.filter(
            (id: string) => !(disabledIds ?? []).includes(id),
          );

          setSelectedIds(enabledIds);
          onChange({
            selectedIds: enabledIds,
            action: "selectAll",
          });
        },

        clear: () => {
          setSelectedIds([]);
          onChange({
            selectedIds: [],
            action: "clear",
          });
        },

        toggle: (id: string) => {
          if ((disabledIds ?? []).includes(id)) return;

          if (safeSelectedIds.includes(id)) {
            intents.deselect([id]);
          } else {
            intents.select([id]);
          }
        },

        isSelected: (id: string) => safeSelectedIds.includes(id),

        isDisabled: (id: string) => (disabledIds ?? []).includes(id),

        getSelectionState: () => selectionState,
      }),
      [
        safeSelectedIds,
        setSelectedIds,
        onChange,
        mode,
        totalCount,
        disabledIds,
        selectionState,
      ],
    );

    // Keyboard navigation
    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent) => {
        switch (event.key) {
          case "a":
          case "A":
            if ((event.ctrlKey || event.metaKey) && mode === "multi") {
              event.preventDefault();
              if (selectionState.isAllSelected) {
                intents.clear();
              } else {
                intents.selectAll();
              }
            }
            break;
          case "Escape":
            event.preventDefault();
            intents.clear();
            break;
          case "Tab":
            // Allow normal tab navigation
            break;
          default:
            break;
        }
      },
      [intents, mode, selectionState.isAllSelected],
    );

    // Expose intents to parent components via ref
    React.useImperativeHandle(
      ref,
      () =>
        ({
          ...(controllerRef.current || {}),
          intents,
        }) as HTMLDivElement & { intents: SelectionIntents },
      [intents],
    );

    return (
      <div
        ref={controllerRef}
        className={cn(
          "flex items-center gap-3 p-3 border rounded-lg bg-background",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          className,
        )}
        role="toolbar"
        aria-label={label || "Selection controller"}
        aria-describedby={ariaDescribedBy}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
        {...props}
      >
        {/* Master checkbox for multi-select */}
        {mode === "multi" && (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selectionState.isAllSelected}
              ref={(input) => {
                if (input) {
                  input.indeterminate = selectionState.isPartiallySelected;
                }
              }}
              onChange={() => {
                if (selectionState.isAllSelected) {
                  intents.clear();
                } else {
                  intents.selectAll();
                }
              }}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 accent-blue-600"
              aria-label="Select all items"
              disabled={totalCount === 0}
            />
          </div>
        )}

        {/* Selection count */}
        {showCount && (
          <span className="text-sm text-muted-foreground" aria-live="polite">
            {mode === "single"
              ? selectionState.selectedCount > 0
                ? "1 selected"
                : "None selected"
              : `${selectionState.selectedCount} of ${selectionState.enabledCount} selected`}
          </span>
        )}

        {/* Action buttons */}
        {showSelectAll && mode === "multi" && (
          <div className="flex gap-2 ml-auto">
            <Button
              ref={selectAllRef}
              variant="outline"
              size="sm"
              onClick={intents.selectAll}
              disabled={selectionState.isAllSelected || totalCount === 0}
              aria-label="Select all items"
            >
              Select All
            </Button>
            <Button
              ref={clearRef}
              variant="outline"
              size="sm"
              onClick={intents.clear}
              disabled={selectionState.isEmpty}
              aria-label="Clear selection"
            >
              Clear
            </Button>
          </div>
        )}

        {mode === "single" && !selectionState.isEmpty && (
          <Button
            variant="outline"
            size="sm"
            onClick={intents.clear}
            className="ml-auto"
            aria-label="Clear selection"
          >
            Clear
          </Button>
        )}
      </div>
    );
  },
);

SelectionControllerComponent.displayName = "SelectionController";

export const SelectionController = SelectionControllerComponent;
