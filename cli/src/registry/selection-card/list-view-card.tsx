"use client";

// Note: Replace this import with your project's utility function
// import { cn } from "@/lib/utils";

// Temporary implementation for standalone usage
const cn = (...inputs: (string | Record<string, boolean> | undefined)[]) => {
  const classes: string[] = [];

  inputs.forEach((input) => {
    if (typeof input === "string") {
      classes.push(input);
    } else if (typeof input === "object" && input !== null) {
      Object.entries(input).forEach(([key, value]) => {
        if (value) classes.push(key);
      });
    }
  });

  return classes.join(" ");
};
import { useTamboComponentState } from "@tambo-ai/react";
import React, { useCallback, useMemo, useRef } from "react";
import { z } from "zod";

// Zod schema for ListViewCard props
export const ListViewCardPropsSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().describe("Unique identifier for the item"),
        title: z.string().describe("Primary title text"),
        subtitle: z.string().optional().describe("Secondary subtitle text"),
        description: z.string().optional().describe("Detailed description"),
        imageUrl: z.string().optional().describe("URL for item image"),
        badge: z.string().optional().describe("Badge text to display"),
        metadata: z
          .object({})
          .passthrough()
          .optional()
          .describe("Additional metadata"),
      }),
    )
    .describe("Array of items to display"),
  selectedIds: z
    .array(z.string())
    .optional()
    .default([])
    .describe("Array of selected item IDs"),
  disabledIds: z
    .array(z.string())
    .optional()
    .default([])
    .describe("Array of disabled item IDs"),
  selectionMode: z
    .enum(["none", "single", "multi"])
    .optional()
    .default("none")
    .describe("Selection behavior"),
  onSelectionChange: z
    .function(
      z.tuple([
        z.object({
          selectedIds: z.array(z.string()),
          action: z.enum(["select", "deselect", "toggle"]),
          targetId: z.string(),
        }),
      ]),
      z.void(),
    )
    .optional()
    .describe("Callback when selection changes"),
  onItemClick: z
    .function(z.tuple([z.string(), z.unknown()]), z.void())
    .optional()
    .describe("Callback when item is clicked"),
  variant: z
    .enum(["default", "compact", "detailed"])
    .optional()
    .default("default")
    .describe("Visual variant"),
  layout: z
    .enum(["list", "grid", "carousel"])
    .optional()
    .default("list")
    .describe("Layout mode"),
  showImages: z
    .boolean()
    .optional()
    .default(true)
    .describe("Whether to show item images"),
  showBadges: z
    .boolean()
    .optional()
    .default(true)
    .describe("Whether to show badges"),
  className: z.string().optional().describe("Additional CSS classes"),
  itemClassName: z
    .string()
    .optional()
    .describe("CSS classes for individual items"),
  emptyMessage: z
    .string()
    .optional()
    .default("No items to display")
    .describe("Message when no items"),
  loading: z.boolean().optional().default(false).describe("Loading state"),
  loadingCount: z
    .number()
    .optional()
    .default(3)
    .describe("Number of skeleton items when loading"),
});

export type ListViewCardProps = z.infer<typeof ListViewCardPropsSchema>;

export interface ListViewCardItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  badge?: string;
  metadata?: Record<string, unknown>;
}

export interface SelectionChangeEvent {
  selectedIds: string[];
  action: "select" | "deselect" | "toggle";
  targetId: string;
}

const ListViewCardComponent = React.forwardRef<
  HTMLDivElement,
  ListViewCardProps
>(
  (
    {
      items,
      selectedIds: initialSelectedIds = [],
      disabledIds = [],
      selectionMode = "none",
      onSelectionChange,
      onItemClick,
      variant = "default",
      layout = "list",
      showImages = true,
      showBadges = true,
      className,
      itemClassName,
      emptyMessage = "No items to display",
      loading = false,
      loadingCount = 3,
      ...props
    },
    ref,
  ) => {
    const [selectedIds, setSelectedIds] = useTamboComponentState(
      "listViewSelectedIds",
      initialSelectedIds,
    );

    const safeSelectedIds = selectedIds ?? [];
    const listRef = useRef<HTMLDivElement>(null);

    // Handle selection changes
    const handleSelectionChange = useCallback(
      (targetId: string, action: "select" | "deselect" | "toggle") => {
        if (selectionMode === "none" || (disabledIds ?? []).includes(targetId))
          return;

        let newSelectedIds: string[];
        let finalAction: "select" | "deselect" | "toggle" = action;

        if (action === "toggle") {
          if (safeSelectedIds.includes(targetId)) {
            newSelectedIds = safeSelectedIds.filter((id) => id !== targetId);
            finalAction = "deselect";
          } else {
            if (selectionMode === "single") {
              newSelectedIds = [targetId];
            } else {
              newSelectedIds = [...safeSelectedIds, targetId];
            }
            finalAction = "select";
          }
        } else if (action === "select") {
          if (selectionMode === "single") {
            newSelectedIds = [targetId];
          } else {
            newSelectedIds = [...new Set([...safeSelectedIds, targetId])];
          }
        } else {
          newSelectedIds = safeSelectedIds.filter((id) => id !== targetId);
        }

        setSelectedIds(newSelectedIds);
        onSelectionChange?.({
          selectedIds: newSelectedIds,
          action: finalAction,
          targetId,
        });
      },
      [
        selectionMode,
        disabledIds,
        safeSelectedIds,
        setSelectedIds,
        onSelectionChange,
      ],
    );

    // Handle item click
    const handleItemClick = useCallback(
      (item: ListViewCardItem, event: React.MouseEvent) => {
        // Handle selection if enabled
        if (selectionMode !== "none") {
          // Check if click was on checkbox or selection area
          const target = event.target as HTMLElement;
          const isCheckboxClick =
            (target.tagName === "INPUT" &&
              (target as HTMLInputElement).type === "checkbox") ||
            target.closest('[role="checkbox"]');

          if (isCheckboxClick || selectionMode === "single") {
            handleSelectionChange(item.id, "toggle");
          }
        }

        // Call custom click handler
        onItemClick?.(item.id, item);
      },
      [selectionMode, handleSelectionChange, onItemClick],
    );

    // Keyboard navigation
    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent, item: ListViewCardItem) => {
        switch (event.key) {
          case " ":
          case "Enter": {
            event.preventDefault();
            const target = event.target as HTMLElement;
            if (
              target.tagName !== "INPUT" ||
              (target as HTMLInputElement).type !== "checkbox"
            ) {
              if (selectionMode !== "none") {
                handleSelectionChange(item.id, "toggle");
              }
              onItemClick?.(item.id, item);
            }
            break;
          }
          default:
            break;
        }
      },
      [selectionMode, handleSelectionChange, onItemClick],
    );

    // Layout classes
    const layoutClasses = useMemo(() => {
      switch (layout) {
        case "grid":
          return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4";
        case "carousel":
          return "flex gap-4 overflow-x-auto pb-4";
        default:
          return "space-y-2";
      }
    }, [layout]);

    // Item classes
    const getItemClasses = useCallback(
      (item: ListViewCardItem) => {
        const isSelected = safeSelectedIds.includes(item.id);
        const isDisabled = (disabledIds ?? []).includes(item.id);

        const baseClasses = cn(
          "relative border rounded-lg transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          {
            // Variant styles
            "p-4": variant === "default",
            "p-2": variant === "compact",
            "p-6": variant === "detailed",

            // Selection styles
            "border-primary bg-primary/5": isSelected && !isDisabled,
            "border-border bg-background": !isSelected && !isDisabled,
            "border-muted bg-muted/50 opacity-60": isDisabled,

            // Interactive styles
            "cursor-pointer hover:border-primary/50 hover:bg-primary/2":
              !isDisabled && (selectionMode !== "none" || !!onItemClick),
            "cursor-not-allowed": isDisabled,

            // Layout specific
            "min-w-[280px]": layout === "carousel",
          },
          itemClassName,
        );

        return baseClasses;
      },
      [
        safeSelectedIds,
        disabledIds,
        variant,
        selectionMode,
        onItemClick,
        layout,
        itemClassName,
      ],
    );

    // Render skeleton loading items
    const renderSkeletonItems = () => {
      return Array.from({ length: loadingCount }, (_, index) => (
        <div
          key={`skeleton-${index}`}
          className={cn(
            "border rounded-lg animate-pulse",
            variant === "compact"
              ? "p-2"
              : variant === "detailed"
                ? "p-6"
                : "p-4",
          )}
        >
          <div className="flex items-start gap-3">
            {showImages && (
              <div className="w-12 h-12 bg-muted rounded-lg flex-shrink-0" />
            )}
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
              {variant === "detailed" && (
                <div className="h-3 bg-muted rounded w-full" />
              )}
            </div>
          </div>
        </div>
      ));
    };

    // Render individual item
    const renderItem = (item: ListViewCardItem) => {
      const isSelected = safeSelectedIds.includes(item.id);
      const isDisabled = (disabledIds ?? []).includes(item.id);

      return (
        <div
          key={item.id}
          ref={ref}
          className={getItemClasses(item)}
          onClick={(e) => handleItemClick(item, e)}
          onKeyDown={(e) => handleKeyDown(e, item)}
          tabIndex={isDisabled ? -1 : 0}
          role={selectionMode !== "none" ? "option" : "button"}
          aria-selected={selectionMode !== "none" ? isSelected : undefined}
          aria-disabled={isDisabled}
          {...props}
        >
          <div className="flex items-start gap-3">
            {/* Selection checkbox */}
            {selectionMode === "multi" && (
              <div className="flex items-center pt-1">
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={isDisabled}
                  onChange={() => handleSelectionChange(item.id, "toggle")}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  aria-label={`Select ${item.title}`}
                  tabIndex={-1}
                />
              </div>
            )}

            {/* Item image */}
            {showImages && item.imageUrl && (
              <div className="flex-shrink-0">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className={cn(
                    "rounded-lg object-cover",
                    variant === "compact" ? "w-10 h-10" : "w-12 h-12",
                  )}
                />
              </div>
            )}

            {/* Item content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3
                    className={cn(
                      "font-medium text-foreground truncate",
                      variant === "compact" ? "text-sm" : "text-base",
                    )}
                  >
                    {item.title}
                  </h3>

                  {item.subtitle && (
                    <p
                      className={cn(
                        "text-muted-foreground truncate",
                        variant === "compact" ? "text-xs" : "text-sm",
                      )}
                    >
                      {item.subtitle}
                    </p>
                  )}

                  {item.description && variant === "detailed" && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Badge */}
                {showBadges && item.badge && (
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                      "bg-primary/10 text-primary flex-shrink-0",
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            </div>

            {/* Selection indicator for single mode */}
            {selectionMode === "single" && isSelected && (
              <div className="flex-shrink-0 text-primary">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </div>
        </div>
      );
    };

    if (loading) {
      return (
        <div
          ref={listRef}
          className={cn(layoutClasses, className)}
          role={selectionMode !== "none" ? "listbox" : "list"}
          aria-multiselectable={selectionMode === "multi"}
        >
          {renderSkeletonItems()}
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div
          className={cn("text-center py-8 text-muted-foreground", className)}
        >
          {emptyMessage}
        </div>
      );
    }

    return (
      <div
        ref={listRef}
        className={cn(layoutClasses, className)}
        role={selectionMode !== "none" ? "listbox" : "list"}
        aria-multiselectable={selectionMode === "multi"}
      >
        {items.map((item) => renderItem(item))}
      </div>
    );
  },
);

ListViewCardComponent.displayName = "ListViewCard";

export const ListViewCard = ListViewCardComponent;
