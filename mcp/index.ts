import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fs from "fs";
import path from "path";
import { z } from "zod";
import { fileURLToPath } from "url";

// Types
interface ComponentMetadata {
  title: string;
  description: string;
}

interface ComponentsMetadataMap {
  [key: string]: ComponentMetadata;
}

interface ComponentDocsMap {
  [key: string]: string;
}

// Get the directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMPONENTS_DIR = path.join(__dirname, "src/components/");

const latestPrompt = `
You are a React and React Native expert. Generate COMPLETE and RUNNABLE code using only my design system 
components and tools sequentially: get_all_components_metadata, select_components, get_selected_components_docs.
 Requirements: no external component libraries, no HTML tags (<div>, <button>, <input>, etc), no StyleSheet,
  use TailwindCSS classes via className prop. Import all components individually. Prefer VStack/HStack
   over Box component. Ensure screens are scrollable, responsive, and mobile-friendly.`;

// Initialize MCP server
const server = new McpServer({
  name: "gymspace-gluestack",
  version: "1.0.0",
  systemPrompt: latestPrompt,
});

function getAvailableComponents(): string[] {
  try {
    // Get all markdown files in the components directory
    const componentFiles = fs
      .readdirSync(COMPONENTS_DIR)
      .filter((file) => file.endsWith(".md"))
      .map((file) => file.replace(".md", ""));

    return componentFiles;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error reading components directory: ${errorMessage}`);
    return [];
  }
}

function getComponentMetadata(componentName: string): ComponentMetadata {
  try {
    const docPath = path.join(
      COMPONENTS_DIR,
      `${componentName.toLowerCase()}.md`
    );

    if (!fs.existsSync(docPath)) {
      return { title: componentName, description: "Component not found" };
    }

    const docsContent = fs.readFileSync(docPath, "utf-8");
    const lines = docsContent.split("\n");

    // Check if file starts with frontmatter
    if (lines[0].trim() !== "---") {
      return { title: componentName, description: "No description available" };
    }

    // Extract only title and description
    const metadata: ComponentMetadata = {
      title: componentName,
      description: "No description available",
    };

    // Read until the closing frontmatter delimiter
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line === "---") break;

      if (line.startsWith("title:")) {
        metadata.title = line.split(":")[1].trim();
      } else if (line.startsWith("description:")) {
        metadata.description = line.split(":")[1].trim();
      }
    }

    return metadata;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `Error reading metadata for ${componentName}: ${errorMessage}`
    );

    return {
      title: componentName,
      description: "Error reading metadata",
    };
  }
}

function getAllComponentsMetadata() {
  const components = getAvailableComponents();
  const metadata: ComponentsMetadataMap = {};

  components.forEach((component) => {
    const meta = getComponentMetadata(component);
    if (meta) {
      metadata[component] = meta;
    }
  });

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(metadata, null, 2),
      },
    ],
  };
}

function getComponentDocs(componentName: string): string {
  try {
    const docPath = path.join(
      COMPONENTS_DIR,
      `${componentName.toLowerCase()}.md`
    );

    // Check if the file exists
    if (!fs.existsSync(docPath)) {
      return `Documentation not found for component: ${componentName}`;
    }

    // Read the markdown file
    const docsContent = fs.readFileSync(docPath, "utf-8");

    return (
      docsContent || `Empty documentation file for component: ${componentName}`
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return `Error retrieving documentation for ${componentName}: ${errorMessage}`;
  }
}

function getSelectedComponentsDocs(componentNames: string[]) {
  const docsObject: ComponentDocsMap = {};
  console.log(
    `✅ Getting documentation for components: ${componentNames.join(", ")}`
  );

  for (const componentName of componentNames) {
    docsObject[componentName] = getComponentDocs(componentName);
  }

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(docsObject, null, 2),
      },
    ],
  };
}

// Register tools
server.tool(
  "get_all_components_metadata",
  "Read and gives the metadata of all the components",
  {},
  () => getAllComponentsMetadata()
);

server.tool(
  "select_components",
  "Selects the components you need",
  {
    selectedComponents: z
      .array(z.string())
      .describe("The names of the components"),
  },
  (input) => {
    console.log(
      `✅ Selected components: ${input.selectedComponents.join(", ")}`
    );

    return {
      content: [
        {
          type: "text" as const,
          text: `You have selected: ${input.selectedComponents.join(
            ", "
          )}. Now proceed to get full documentation for ALL these components at once using get_selected_components_docs.`,
        },
      ],
    };
  }
);

server.tool(
  "get_selected_components_docs",
  "Read and gives the complete documentation of selected components",
  {
    component_names: z
      .array(z.string())
      .describe("The names of the components"),
  },
  (input) => getSelectedComponentsDocs(input.component_names)
);

// Set up the MCP server and establish communication channel with the client using stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("Use Gluestack Components MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});