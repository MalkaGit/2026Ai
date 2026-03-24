import fs from "fs";
import path from "path";
export function loadPropertyMarkdown(): string {
  const filePath = path.join(process.cwd(), "src", "knowledge", "property.md");
  return fs.readFileSync(filePath, "utf-8");
}
