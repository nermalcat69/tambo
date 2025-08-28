"use client";

import { CLI } from "@/components/cli";
import { SelectionChatInterface } from "@/components/generative/SelectionChatInterface";
import { CopyablePrompt, Section } from "@/components/ui/doc-components";
import { ShowcaseThemeProvider } from "@/providers/showcase-theme-provider";
import { TamboProvider } from "@tambo-ai/react";
import { DemoWrapper } from "../../demo-wrapper";

export default function SelectionPage() {
  const installCommand = "npx tambo add selection-card";

  const examplePrompt1 = `Create a file manager interface with multi-select capability:
- Show a list of files and folders
- Enable multi-select mode with checkboxes
- Add "Select All" and "Clear Selection" buttons
- Display selected count in the controller
- Include bulk actions like delete, move, copy
- Use the detailed variant with large size`;

  const examplePrompt2 = `Build a product catalog with selection features:
- Display products in a grid layout with images and prices
- Allow customers to select multiple items for comparison
- Show a floating comparison panel when items are selected
- Include filters for category, price range, and ratings
- Add "Add to Cart" button for selected products
- Use compact variant for better grid density`;

  const examplePrompt3 = `Create a team member selection interface:
- Show employee profiles with photos and roles
- Enable single-select mode for project assignment
- Display member availability status (available, busy, offline)
- Include search and filter by department or skills
- Show selected member details in a sidebar
- Use list layout with detailed information`;

  return (
    <div className="container mx-auto pt-6 px-6 max-w-4xl">
      <ShowcaseThemeProvider defaultTheme="light">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-bold mb-4">Selection</h1>
            <p className="text-lg text-secondary">
              Powerful selection management components for handling single and
              multi-select operations with support for large datasets, keyboard
              navigation, and accessibility.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Installation</h2>
            <div className="rounded-md">
              <CLI command={installCommand} />
            </div>
          </div>

          <Section title="Example Prompts">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">
                  File Manager Interface
                </h3>
                <CopyablePrompt prompt={examplePrompt1} />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">Product Catalog</h3>
                <CopyablePrompt prompt={examplePrompt2} />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">
                  Team Member Selection
                </h3>
                <CopyablePrompt prompt={examplePrompt3} />
              </div>
            </div>
          </Section>

          <DemoWrapper title="Selection" height={800}>
            <TamboProvider
              apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY ?? ""}
              tamboUrl={process.env.NEXT_PUBLIC_TAMBO_API_URL ?? ""}
            >
              <SelectionChatInterface />
            </TamboProvider>
          </DemoWrapper>
        </div>
      </ShowcaseThemeProvider>
    </div>
  );
}
