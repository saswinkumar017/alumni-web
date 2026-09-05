#!/usr/bin/env node

/**
 * Hygiene verification script for Stage 9 Shared Component Layer.
 * Checks:
 * 1. All component files have JSDoc lifecycle tags (@stable or @alpha)
 * 2. No component imports from forbidden layers (features/, app/, hooks/, stores/)
 * 3. All future categories have barrel index.ts files
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const COMPONENTS_DIR = join(__dirname, "..", "src", "components");

const REQUIRED_CATEGORIES = [
  "ui", "form", "layout", "navigation", "data-display",
  "feedback", "skeletons", "tables", "dialogs",
  "search", "selection", "upload", "timeline", "empty-states",
];

const FORBIDDEN_IMPORT_PATTERNS = [
  "@/features/",
  "@/app/",
  "@/hooks/",
  "@/stores/",
];

let errors = 0;
let warnings = 0;

function findTsxFiles(dir) {
  const files = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findTsxFiles(full));
    } else if (entry.name.endsWith(".tsx") && !entry.name.endsWith(".stories.tsx") && !entry.name.endsWith(".test.tsx")) {
      files.push(full);
    }
  }
  return files;
}

function hasLifecycleTag(content) {
  return /@stable|@alpha/.test(content);
}

function hasJSDoc(content) {
  return /\/\*\*[\s\S]*?\*\//.test(content);
}

// Check 1: All component files have JSDoc with lifecycle tags
console.log("\n=== Check 1: JSDoc Lifecycle Tags ===");
const tsxFiles = findTsxFiles(COMPONENTS_DIR);
for (const file of tsxFiles) {
  const content = readFileSync(file, "utf-8");
  const relative = file.replace(COMPONENTS_DIR, "src/components");

  const validDefaultExport = /export default function/.test(content) || /export \{[^}]+\}/.test(content);
  const hasSlotExport = /export function/.test(content);
  const isValidComponent = validDefaultExport || hasSlotExport || content.includes("// Future:");

  if (!isValidComponent) {
    warnings++;
    console.warn(`  ⚠ [WARN] ${relative}: no recognized component export pattern`);
    continue;
  }

  if (content.includes("// Future:")) continue;

  if (!hasJSDoc(content)) {
    errors++;
    console.error(`  ❌ [ERR] ${relative}: missing JSDoc comment`);
    continue;
  }

  if (!hasLifecycleTag(content)) {
    errors++;
    console.error(`  ❌ [ERR] ${relative}: JSDoc found but missing @stable or @alpha tag`);
    continue;
  }

  console.log(`  ✅ ${relative}`);
}

// Check 2: No component imports from forbidden layers
console.log("\n🔍 Check 2: Forbidden Imports ===");
for (const file of tsxFiles) {
  const content = readFileSync(file, "utf-8");
  const relative = file.replace(COMPONENTS_DIR, "src/components");

  if (content.includes("// Future:")) continue;

  for (const pattern of FORBIDDEN_IMPORT_PATTERNS) {
    if (content.includes(`from "${pattern}`) || content.includes(`from '${pattern}`)) {
      errors++;
      console.error(`  ❌ [ERR] ${relative}: imports from forbidden layer "${pattern}"`);
    }
  }
}

// Check 3: All future categories have barrel files
console.log("\n🔍 Check 3: Barrel Files ===");
for (const cat of REQUIRED_CATEGORIES) {
  const indexPath = join(COMPONENTS_DIR, cat, "index.ts");
  try {
    readFileSync(indexPath, "utf-8");
    console.log(`  ✅ components/${cat}/index.ts`);
  } catch {
    errors++;
    console.error(`  ❌ [ERR] components/${cat}/index.ts missing`);
  }
}

// Summary
console.log("\n═════════════════════════════════");
console.log(`Total: ${errors} errors, ${warnings} warnings`);
console.log("═════════════════════════════════\n");

process.exit(errors > 0 ? 1 : 0);