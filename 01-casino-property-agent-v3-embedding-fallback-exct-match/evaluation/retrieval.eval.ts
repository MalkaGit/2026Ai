import { searchPropertyContent } from "../src/tools/property.search.js"; //the method we check
import { retrievalDataset } from "./retrieval.dataset.js"; //examples of questions and expected sections
import fs from "fs";

const propertyContent = fs.readFileSync(
  "./src/knowledge/property.md",
  "utf-8"
);

/**
 * Run the evaluation (from package root):
 *   cd c:\dev\repos\node\2026Ai\01-casino-property-agent-v2-embedding
 *   npx tsx evaluation/retrieval.eval.ts
 * for each testin the dataset,
 * -run the searchPropertyContent method
 * -extract the citations that search has found
 * -calculate the accuracy of the search
 *  (at least one of the expected sections should be found in the retrieved citations)
 */
async function runEvaluation() {
  let correct = 0;
  for (const test of retrievalDataset) {
    const result = await searchPropertyContent(
      test.question,
      propertyContent
    );
   const retrieved: string[] = result.citations;
   const success = test.expectedSections.some((section) =>
      retrieved.includes(section)
    );
    if (success) {
      correct++;
    }
    console.log("----");
    console.log("Q:", test.question);
    console.log("Expected:", test.expectedSections);
    console.log("Retrieved:", retrieved);
    console.log(success ? "✅ PASS" : "❌ FAIL");
  }

  const accuracy = (correct / retrievalDataset.length) * 100;
  console.log("==== RESULT ====");
  console.log(`Accuracy: ${accuracy.toFixed(2)}%`);
}
runEvaluation();