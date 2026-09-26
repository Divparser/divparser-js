import Papa from "papaparse";
import * as XLSX from "xlsx";
import TurndownService from "turndown";

// Mirrors the DivParser platform's own conversion logic (see the main
// app's lib/formatConversion.ts) so an SDK-side export matches what a
// scheduled delivery would produce for the same data. Isomorphic — safe
// in both Node and the browser, unlike ./save.ts's fs-based helpers.

const turndownService = new TurndownService();

/**
 * Real scrape output is typically `{ <schemaFieldName>: [...] }` (nestlang's
 * one-named-array-field shape). When there's exactly one array-valued
 * top-level property, unwrap to it so CSV/XLSX get real rows instead of one
 * row with the whole object stuffed into a single stringified cell.
 */
function unwrapSingleArrayField(data: unknown): unknown {
  if (Array.isArray(data) || typeof data !== "object" || data === null) return data;

  const record = data as Record<string, unknown>;
  const arrayKeys = Object.keys(record).filter((k) => Array.isArray(record[k]));
  return arrayKeys.length === 1 ? record[arrayKeys[0]] : data;
}

function sanitizeForExport(data: unknown): unknown {
  if (!data) return data;

  const processItem = (item: unknown) => {
    if (typeof item !== "object" || item === null) return item;
    if (Array.isArray(item)) return JSON.stringify(item);

    const newItem: Record<string, unknown> = { ...(item as Record<string, unknown>) };
    for (const key in newItem) {
      if (typeof newItem[key] === "object" && newItem[key] !== null) {
        newItem[key] = JSON.stringify(newItem[key]);
      }
    }
    return newItem;
  };

  return Array.isArray(data) ? data.map(processItem) : processItem(data);
}

/** Arbitrary extracted `data` -> flat rows, ready for CSV/XLSX. */
export function flattenForTabular(data: unknown): Record<string, unknown>[] {
  const unwrapped = unwrapSingleArrayField(data);
  const processed = sanitizeForExport(unwrapped);
  return Array.isArray(processed) ? (processed as Record<string, unknown>[]) : [processed as Record<string, unknown>];
}

export function toJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

export function toCsv(data: unknown): string {
  return Papa.unparse(flattenForTabular(data));
}

export function toXlsx(data: unknown, sheetName = "ScrapedData"): Buffer {
  const worksheet = XLSX.utils.json_to_sheet(flattenForTabular(data));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer;
}

export function htmlToMarkdown(html: string): string {
  return turndownService.turndown(html);
}
