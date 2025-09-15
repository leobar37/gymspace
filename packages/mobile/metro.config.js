const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

// Find the project root (where pnpm-workspace.yaml is)
const projectRoot = path.resolve(__dirname, "../..");
const workspaceRoot = path.resolve(projectRoot);

const config = getDefaultConfig(__dirname);

// 1. Watch all files in the monorepo including node_modules
// Merge with default watchFolders to avoid overriding Expo defaults
config.watchFolders = [
  ...config.watchFolders || [],
  workspaceRoot,
  path.resolve(projectRoot, 'node_modules'),
];

// 2. Let Metro know where to resolve packages from
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(__dirname, "node_modules"),
];

// Remove the problematic blockList for now
config.resolver.blockList = [
  /.*\/\.tsbuildinfo$/,
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
      const mainPath = path.resolve(packagePath, main);
      
      // Check if the main file exists
      const fs = require("fs");
      if (fs.existsSync(mainPath)) {
        return {
          type: "sourceFile",
          filePath: mainPath,
        };
      } else {
        console.warn(`⚠️  Package ${moduleName} main file not found: ${mainPath}`);
        console.warn(`   Make sure to build the package with: cd ${packagePath} && pnpm build`);
      }
    } catch (e) {
      console.warn(`⚠️  Could not resolve workspace package ${moduleName}:`, e.message);
    }
  }
  
  // Default resolution
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });