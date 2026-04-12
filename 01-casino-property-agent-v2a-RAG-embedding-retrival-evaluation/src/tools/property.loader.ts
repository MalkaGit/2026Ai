import fs from "fs";
import path from "path";

/**
 * loads the property markdown file (src/knowledge/property.md)
 * @returns the content of the property file
 */
export function loadPropertyMarkdown(): string {
  const filePath = path.join(process.cwd(), "src", "knowledge", "property.md");
  return fs.readFileSync(filePath, "utf-8");
}
