const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const serverRoot = __dirname;
const ignoredDirectories = new Set(["node_modules", ".git"]);
const files = [];

function collectJavaScriptFiles(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        collectJavaScriptFiles(path.join(directory, entry.name));
      }
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(path.join(directory, entry.name));
    }
  }
}

collectJavaScriptFiles(serverRoot);
files.sort();

let failed = false;
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  const relativePath = path.relative(path.resolve(serverRoot, ".."), file);
  if (result.status === 0) {
    console.log(`PASS ${relativePath}`);
  } else {
    failed = true;
    console.error(`FAIL ${relativePath}`);
    if (result.stderr) console.error(result.stderr.trim());
    if (result.stdout) console.error(result.stdout.trim());
  }
}

if (failed) process.exitCode = 1;
else console.log(`All ${files.length} server JavaScript files passed syntax checks.`);
