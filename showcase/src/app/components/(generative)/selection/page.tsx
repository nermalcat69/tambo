"use client";

import { CLI } from "@/components/cli";
import { SelectionChatInterface } from "@/components/generative/SelectionChatInterface";
import { CopyablePrompt, Section } from "@/components/ui/doc-components";
import { ShowcaseThemeProvider } from "@/providers/showcase-theme-provider";
import { TamboProvider } from "@tambo-ai/react";
import { DemoWrapper } from "../../demo-wrapper";

export default function SelectionPage() {
  const installCommand = "npx tambo add selection-card";

  const examplePrompt = `Create a file manager interface with multi-select capability:
- Show a list of files and folders
- Enable multi-select mode with checkboxes
- Add "Select All" and "Clear Selection" buttons
- Display selected count in the controller
- Include bulk actions like delete, move, copy
- Use the detailed variant with large size`;

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

          <Section title="Example Prompt">
            <CopyablePrompt prompt={examplePrompt} />
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
