// Bundles the extension into a single CommonJS file (out/extension.js) so the
// published .vsix ships one JS file instead of the full node_modules tree.
// `vscode` is provided by the host and must stay external; the web-tree-sitter
// runtime wasm is shipped separately in resources/ (see scripts/build-wasm.sh).
const esbuild = require("esbuild");

const watch = process.argv.includes("--watch");

const options = {
  entryPoints: ["src/extension.ts"],
  bundle: true,
  outfile: "out/extension.js",
  platform: "node",
  format: "cjs",
  target: "node18",
  external: ["vscode"],
  minify: !watch,
  sourcemap: false,
  logLevel: "info",
  // web-tree-sitter's Emscripten loader reads `import.meta.url` to locate the
  // runtime via createRequire. In a CJS bundle that would be undefined, so
  // point it at the bundle's own file URL.
  banner: {
    js: "const __import_meta_url=require('node:url').pathToFileURL(__filename).href;",
  },
  define: {
    "import.meta.url": "__import_meta_url",
  },
};

async function main() {
  if (watch) {
    const ctx = await esbuild.context(options);
    await ctx.watch();
  } else {
    await esbuild.build(options);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
