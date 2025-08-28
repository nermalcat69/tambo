import {
  SelectionController,
  SelectionControllerPropsSchema,
} from "../ui/selection-controller";
import { ListViewCard, ListViewCardPropsSchema } from "../ui/list-view-card";
import {
  SelectionShowcase,
  SelectionShowcasePropsSchema,
} from "../ui/selection-showcase";
import { MessageThreadFull } from "@/components/ui/message-thread-full";
import { useUserContextKey } from "@/lib/useUserContextKey";
import { useTambo } from "@tambo-ai/react";
import { useEffect } from "react";

export const SelectionChatInterface = () => {
  const userContextKey = useUserContextKey("selection-thread");
  const { registerComponent, thread } = useTambo();

  useEffect(() => {
    registerComponent({
      name: "SelectionController",
      description: `A powerful selection management component that handles single and multi-select operations.
      Supports efficient selection state management for large datasets (100k+ items) with optimized select-all/clear operations.
      Features keyboard navigation, accessibility support, and indeterminate states for partial selections.
      Perfect for data tables, file managers, bulk operations, and any interface requiring item selection.
      
      Key Features:
      - Single and multi-select modes
      - Efficient handling of large datasets
      - Keyboard navigation (Space, Enter, Arrow keys)
      - Accessibility with proper ARIA attributes
      - Indeterminate state for partial selections
      - Disabled item support
      - Select all/clear operations
      
      Use cases:
      - Data table row selection
      - File/folder selection in file managers
      - Bulk operations on lists
      - Shopping cart item management
      - Email/message selection`,
      component: SelectionController,
      propsSchema: SelectionControllerPropsSchema,
    });

    registerComponent({
      name: "ListViewCard",
      description: `A flexible list view component that displays items in a card-based layout.
      Integrates seamlessly with SelectionController for selection management.
      Supports various content types, custom rendering, and responsive design.
      Perfect for displaying collections of data with rich content and interactive elements.
      
      Features:
      - Card-based item display
      - Selection integration
      - Custom item rendering
      - Responsive grid layout
      - Loading states
      - Empty state handling
      - Keyboard navigation support
      
      Use cases:
      - Product catalogs
      - User directories
      - File galleries
      - Content libraries
      - Search results`,
      component: ListViewCard,
      propsSchema: ListViewCardPropsSchema,
    });

    registerComponent({
      name: "SelectionShowcase",
      description: `A demonstration component that showcases the SelectionController and ListViewCard working together.
      Provides a complete example of selection management with sample data and interactive features.
      Perfect for understanding how to implement selection patterns in your application.
      
      Features:
      - Pre-configured sample data
      - Selection mode toggle
      - Bulk operations demo
      - Real-time selection feedback
      - Best practices implementation
      
      Use cases:
      - Learning selection patterns
      - Prototyping selection interfaces
      - Testing selection behavior
      - Component integration examples`,
      component: SelectionShowcase,
      propsSchema: SelectionShowcasePropsSchema,
    });
  }, [registerComponent, thread.id]);

  return (
    <div className="relative h-full w-full flex flex-col">
      <MessageThreadFull
        contextKey={userContextKey}
        className="rounded-lg flex-1"
      />
    </div>
  );
};
