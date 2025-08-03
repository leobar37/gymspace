const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

// Find the project root (where pnpm-workspace.yaml is)
const projectRoot = path.resolve(__dirname, "../..");
const workspaceRoot = path.resolve(projectRoot);

const config = getDefaultConfig(__dirname);

// 1. Watch all files in the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages from
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(__dirname, "node_modules"),
];

// 3. Force Metro to resolve workspace packages correctly
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith("@gymspace/")) {
    const packageName = moduleName.replace("@gymspace/", "");
    const packagePath = path.resolve(projectRoot, "packages", packageName);
    
    // Try to resolve the package
    try {
      const packageJson = require(path.join(packagePath, "package.json"));
      const main = packageJson.main || "index.js";
      return {
        type: "sourceFile",
        filePath: path.resolve(packagePath, main),
      };
    } catch (e) {
      // Fall back to default resolution
    }
  }
  
  // Default resolution
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });