"use client";

// Note: Replace these imports with your project's button component and utility function
// import { Button } from "@/components/ui/button";
// import { cn } from "@/lib/utils";

// Temporary implementations for standalone usage
interface ButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  [key: string]: unknown;
}

const Button = ({
  children,
  className,
  onClick,
  disabled,
  ...props
}: ButtonProps) => (
  <button
    className={`px-3 py-1.5 text-sm font-medium rounded-md border transition-colors ${
      disabled
        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
    } ${className ?? ""}`}
    onClick={onClick}
    disabled={disabled}
    {...props}
  >
    {children}
  </button>
);

const cn = (...classes: (string | undefined)[]) =>
  classes.filter(Boolean).join(" ");
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

export interface SelectionControllerRef extends HTMLDivElement {
  intents: SelectionIntents;
}

const SelectionControllerComponent = React.forwardRef<
  SelectionControllerRef,
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
    const safeSelectedIds = selectedIds ?? [];

    const controllerRef = useRef<HTMLDivElement>(null);
    const selectAllRef = useRef<HTMLButtonElement>(null);
    const clearRef = useRef<HTMLButtonElement>(null);

    // Memoized selection state calculations
    const selectionState = useMemo(() => {
      const safeDisabledIds = disabledIds ?? [];
      const enabledCount = totalCount - safeDisabledIds.length;
      const selectedCount = safeSelectedIds.length;
      const enabledSelectedCount = safeSelectedIds.filter(
        (id) => !safeDisabledIds.includes(id),
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
          const safeDisabledIds = disabledIds ?? [];
          const validIds = ids.filter((id) => !safeDisabledIds.includes(id));
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

          // For large datasets, we don't enumerate all IDs
          // Instead, we use a special state to indicate "all selected"
          const safeDisabledIds = disabledIds ?? [];
          const enabledIds = Array.from({ length: totalCount }, (_, i) =>
            i.toString(),
          ).filter((id) => !safeDisabledIds.includes(id));

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
          const safeDisabledIds = disabledIds ?? [];
          if (safeDisabledIds.includes(id)) return;

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
    React.useImperativeHandle(ref, () => {
      const element = controllerRef.current;
      return {
        ...element,
        intents,
      } as SelectionControllerRef;
    }, [intents]);

    const _checkboxState = selectionState.isAllSelected
      ? "checked"
      : selectionState.isPartiallySelected
        ? "indeterminate"
        : "unchecked";

    return (
      <div
        ref={controllerRef}
        className={cn(
          "flex items-center gap-3 p-3 border rounded-lg bg-background",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          className,
        )}
        role="toolbar"
        aria-label={label ?? "Selection controller"}
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
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
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
