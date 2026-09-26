import { writeFileSync } from "fs";
import { toJson, toCsv, toXlsx, htmlToMarkdown } from "./convert.js";
import type { JobResult } from "./types.js";

// Node-only: writes to disk via `fs`, so this lives at the "divparser-js/node"
// subpath rather than the main entry point, which stays safe to bundle for
// the browser (see convert.ts for the isomorphic conversion primitives this
// builds on).

export type ScrapeExportFormat = "json" | "csv" | "xlsx";
export type FetchExportFormat = "html" | "markdown";

// A result carries usable data at "SUCCESS" and "REQUIRES_ATTENTION" (the
// long-term parser's self-healing selectors came back under-confident, but
// data still came back) — only "FAILED" rows have nothing to export. Mirrors
// divparser-py's utils.flatten_results().
function extractUsableData(results: JobResult[]): unknown[] {
  const items: unknown[] = [];
  for (const result of results) {
    if ((result.status === "SUCCESS" || result.status === "REQUIRES_ATTENTION") && result.data) {
      if (Array.isArray(result.data)) items.push(...result.data);
      else items.push(result.data);
    }
  }
  return items;
}

/**
 * Save a scrape/parse result to disk as JSON, CSV, or XLSX.
 *
 * @param results The `results` array from getScrape()/getParse() — every
 *   usable row's data (SUCCESS + REQUIRES_ATTENTION) is combined into one
 *   flat export; FAILED rows are skipped. To export a custom dataset
 *   instead, use toJson()/toCsv()/toXlsx() from "divparser-js" directly.
 */
export function saveScrapeAs(results: JobResult[], format: ScrapeExportFormat, filePath: string): void {
  const items = extractUsableData(results);
  if (format === "json") return writeFileSync(filePath, toJson(items), "utf8");
  if (format === "csv") return writeFileSync(filePath, toCsv(items), "utf8");
  writeFileSync(filePath, toXlsx(items));
}

/**
 * Save a fetch's raw HTML to disk, either as-is or converted to Markdown.
 *
 * @param html Raw HTML, e.g. from `(await client.getFetchHtml(scrapeId)).html`.
 */
export function saveFetchAs(html: string, format: FetchExportFormat, filePath: string): void {
  if (format === "html") return writeFileSync(filePath, html, "utf8");
  writeFileSync(filePath, htmlToMarkdown(html), "utf8");
}
