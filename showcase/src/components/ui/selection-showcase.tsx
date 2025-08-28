"use client";

import { Button } from "@/components/ui/button";
import {
  ListViewCard,
  type ListViewCardItem,
  type SelectionChangeEvent,
} from "@/components/ui/list-view-card";
import {
  SelectionController,
  type SelectionState,
} from "@/components/ui/selection-controller";
import { cn } from "@/lib/utils";
import { useTamboComponentState } from "@tambo-ai/react";
import React, { useCallback, useMemo } from "react";
import { z } from "zod";

// Zod schema for SelectionShowcase props
export const SelectionShowcasePropsSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        subtitle: z.string().optional(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        badge: z.string().optional(),
        metadata: z.object({}).passthrough().optional(),
      }),
    )
    .describe("Array of items to display"),
  initialMode: z
    .enum(["single", "multi"])
    .optional()
    .default("multi")
    .describe("Initial selection mode"),
  allowModeToggle: z
    .boolean()
    .optional()
    .default(true)
    .describe("Allow switching between single/multi mode"),
  initialLayout: z
    .enum(["list", "grid", "carousel"])
    .optional()
    .default("list")
    .describe("Initial layout mode"),
  allowLayoutToggle: z
    .boolean()
    .optional()
    .default(true)
    .describe("Allow switching between layouts"),
  initialVariant: z
    .enum(["default", "compact", "detailed"])
    .optional()
    .default("default")
    .describe("Initial variant"),
  allowVariantToggle: z
    .boolean()
    .optional()
    .default(true)
    .describe("Allow switching between variants"),
  disabledIds: z
    .array(z.string())
    .optional()
    .default([])
    .describe("Array of disabled item IDs"),
  onSelectionChange: z
    .function(
      z.tuple([
        z.object({
          selectedIds: z.array(z.string()),
          mode: z.enum(["single", "multi"]),
          totalCount: z.number(),
          action: z.string(),
        }),
      ]),
      z.void(),
    )
    .optional()
    .describe("Callback when selection changes"),
  className: z.string().optional().describe("Additional CSS classes"),
  showControls: z
    .boolean()
    .optional()
    .default(true)
    .describe("Show control panel"),
  showStats: z
    .boolean()
    .optional()
    .default(true)
    .describe("Show selection statistics"),
  title: z.string().optional().describe("Showcase title"),
  description: z.string().optional().describe("Showcase description"),
});

export type SelectionShowcaseProps = z.infer<
  typeof SelectionShowcasePropsSchema
>;

const SelectionShowcaseComponent = React.forwardRef<
  HTMLDivElement,
  SelectionShowcaseProps
>(
  (
    {
      items,
      initialMode = "multi",
      allowModeToggle = true,
      initialLayout = "list",
      allowLayoutToggle = true,
      initialVariant = "default",
      allowVariantToggle = true,
      disabledIds = [],
      onSelectionChange,
      className,
      showControls = true,
      showStats = true,
      title,
      description,
      ...props
    },
    ref,
  ) => {
    // State management with Tambo
    const [selectedIds, setSelectedIds] = useTamboComponentState(
      "showcaseSelectedIds",
      [] as string[],
    );
    const [mode, setMode] = useTamboComponentState("showcaseMode", initialMode);
    const [layout, setLayout] = useTamboComponentState(
      "showcaseLayout",
      initialLayout,
    );
    const [variant, setVariant] = useTamboComponentState(
      "showcaseVariant",
      initialVariant,
    );

    const safeSelectedIds = selectedIds || [];
    const safeMode = mode || initialMode;
    const safeLayout = layout || initialLayout;
    const safeVariant = variant || initialVariant;

    // Generate sample data if none provided
    const sampleItems: ListViewCardItem[] = useMemo(() => {
      if (items && items.length > 0) return items;

      return Array.from({ length: 12 }, (_, i) => ({
        id: `item-${i + 1}`,
        title: `Item ${i + 1}`,
        subtitle: `Subtitle for item ${i + 1}`,
        description: `This is a detailed description for item ${i + 1}. It provides more context about what this item represents and its purpose in the selection showcase.`,
        imageUrl: `https://picsum.photos/seed/${i + 1}/100/100`,
        badge: i % 3 === 0 ? "Featured" : i % 5 === 0 ? "New" : undefined,
        metadata: {
          category: ["Technology", "Design", "Business", "Science"][i % 4],
          priority: ["High", "Medium", "Low"][i % 3],
          created: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        },
      }));
    }, [items]);

    // Selection statistics
    const stats = useMemo(() => {
      const totalCount = sampleItems.length;
      const enabledCount = totalCount - (disabledIds ?? []).length;
      const selectedCount = safeSelectedIds.length;
      const disabledSelectedCount = safeSelectedIds.filter((id) =>
        (disabledIds ?? []).includes(id),
      ).length;
      const enabledSelectedCount = selectedCount - disabledSelectedCount;

      return {
        totalCount,
        enabledCount,
        selectedCount,
        enabledSelectedCount,
        disabledSelectedCount,
        selectionPercentage:
          enabledCount > 0
            ? Math.round((enabledSelectedCount / enabledCount) * 100)
            : 0,
      };
    }, [sampleItems.length, disabledIds, safeSelectedIds]);

    // Handle selection changes from SelectionController
    const handleControllerSelectionChange = useCallback(
      (selectionState: SelectionState) => {
        setSelectedIds(selectionState.selectedIds);

        onSelectionChange?.({
          selectedIds: selectionState.selectedIds,
          mode: safeMode,
          totalCount: stats.totalCount,
          action: selectionState.action,
        });
      },
      [setSelectedIds, onSelectionChange, safeMode, stats.totalCount],
    );

    // Handle selection changes from ListViewCard
    const handleListSelectionChange = useCallback(
      (event: SelectionChangeEvent) => {
        setSelectedIds(event.selectedIds);

        onSelectionChange?.({
          selectedIds: event.selectedIds,
          mode: safeMode,
          totalCount: stats.totalCount,
          action: event.action,
        });
      },
      [setSelectedIds, onSelectionChange, safeMode, stats.totalCount],
    );

    // Handle mode change
    const handleModeChange = useCallback(
      (newMode: "single" | "multi") => {
        setMode(newMode);

        // Clear selection when switching to single mode if multiple items selected
        if (newMode === "single" && safeSelectedIds.length > 1) {
          setSelectedIds([safeSelectedIds[0]]);
        }
      },
      [setMode, safeSelectedIds, setSelectedIds],
    );

    return (
      <div ref={ref} className={cn("space-y-6", className)} {...props}>
        {/* Header */}
        {(title || description) && (
          <div className="space-y-2">
            {title && (
              <h2 className="text-2xl font-bold text-foreground">{title}</h2>
            )}
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
          </div>
        )}

        {/* Control Panel */}
        {showControls && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <h3 className="text-lg font-semibold">Controls</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Mode Toggle */}
              {allowModeToggle && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Selection Mode</label>
                  <div className="flex gap-2">
                    <Button
                      variant={safeMode === "single" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleModeChange("single")}
                    >
                      Single
                    </Button>
                    <Button
                      variant={safeMode === "multi" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleModeChange("multi")}
                    >
                      Multi
                    </Button>
                  </div>
                </div>
              )}

              {/* Layout Toggle */}
              {allowLayoutToggle && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Layout</label>
                  <div className="flex gap-2">
                    {["list", "grid", "carousel"].map((layoutOption) => (
                      <Button
                        key={layoutOption}
                        variant={
                          safeLayout === layoutOption ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          setLayout(
                            layoutOption as "list" | "grid" | "carousel",
                          )
                        }
                      >
                        {layoutOption.charAt(0).toUpperCase() +
                          layoutOption.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Variant Toggle */}
              {allowVariantToggle && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Variant</label>
                  <div className="flex gap-2">
                    {["default", "compact", "detailed"].map((variantOption) => (
                      <Button
                        key={variantOption}
                        variant={
                          safeVariant === variantOption ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          setVariant(
                            variantOption as "default" | "compact" | "detailed",
                          )
                        }
                      >
                        {variantOption.charAt(0).toUpperCase() +
                          variantOption.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selection Controller */}
        <SelectionController
          mode={safeMode}
          selectedIds={safeSelectedIds}
          totalCount={stats.totalCount}
          onChange={handleControllerSelectionChange}
          disabledIds={disabledIds}
          showSelectAll={safeMode === "multi"}
          showCount={true}
          label="Item selection controller"
          availableIds={sampleItems.map((item) => item.id)}
        />

        {/* Statistics */}
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {stats.selectedCount}
              </div>
              <div className="text-sm text-muted-foreground">Selected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {stats.enabledCount}
              </div>
              <div className="text-sm text-muted-foreground">Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-muted-foreground">
                {(disabledIds ?? []).length}
              </div>
              <div className="text-sm text-muted-foreground">Disabled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.selectionPercentage}%
              </div>
              <div className="text-sm text-muted-foreground">Coverage</div>
            </div>
          </div>
        )}

        {/* List View */}
        <ListViewCard
          items={sampleItems}
          selectedIds={safeSelectedIds}
          disabledIds={disabledIds}
          selectionMode={safeMode}
          onSelectionChange={handleListSelectionChange}
          variant={safeVariant}
          layout={safeLayout}
          showImages={true}
          showBadges={true}
          emptyMessage="No items available for selection"
          className="min-h-[400px]"
          loading={false}
          loadingCount={0}
        />

        {/* Debug Info (only in development) */}
        {process.env.NODE_ENV === "development" && (
          <details className="p-4 border rounded-lg bg-muted/30">
            <summary className="cursor-pointer font-medium">
              Debug Information
            </summary>
            <pre className="mt-2 text-xs overflow-auto">
              {JSON.stringify(
                {
                  selectedIds: safeSelectedIds,
                  mode: safeMode,
                  layout: safeLayout,
                  variant: safeVariant,
                  stats,
                  disabledIds,
                },
                null,
                2,
              )}
            </pre>
          </details>
        )}
      </div>
    );
  },
);

SelectionShowcaseComponent.displayName = "SelectionShowcase";

export const SelectionShowcase = SelectionShowcaseComponent;
