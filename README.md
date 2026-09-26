# DivParser JavaScript SDK

A TypeScript client SDK for the [DivParser API](https://www.divparser.com/docs?p=API+Reference).

## Features

- Scrape web pages using the DivParser API
- Fetch a page first, attach extraction later (fetch → extractFetch)
- Parse raw HTML content directly
- Create and manage recurring schedules (cron or interval)
- Poll job status and retrieve results
- Support for paginated multi-url scraping
- Save results to disk as JSON, CSV, or XLSX, and fetched HTML as-is or converted to Markdown
- Deliver results directly to a connected S3/Google Drive/Dropbox Storage
- Easy TypeScript types and developer experience

## Installation

```bash
npm install @divparser/client
```

## Build

```bash
npm run build
```

## Quick Start

```ts
import { DivParserClient } from "@divparser/client";
import { saveScrapeAs, saveFetchAs } from "@divparser/client/node"; // Node only

const client = new DivParserClient("YOUR_API_KEY");

const scrapeResult = await client.scrapeAndWait(
  "https://example.com/products",
  "Extract product name, price, and availability from each item",
  {
    name: "Product Scrape",
    pageType: "LISTING"
  }
);

console.log(scrapeResult);

const html = "<html><body><article><h1>Widget</h1><p>$49.99</p></article></body></html>";
const parseResult = await client.parseAndWait(html, "Extract product name and price", {
  name: "HTML Parse"
});

console.log(parseResult);

// Fetch a page now, decide on the extraction schema later.
const { scrapeId, jobId } = await client.fetch("https://example.com/products");
await client.waitForCompletion(jobId!);
const extracted = await client.extractFetch(scrapeId!, "Extract product name and price");

console.log(extracted);

// Recurring schedules: run the same scrape on a cadence.
const schedule = await client.createSchedule({
  name: "Daily product check",
  projectId: "YOUR_PROJECT_ID",
  schedule: { type: "cron", pattern: "0 9 * * *" },
  scrape: {
    url: "https://example.com/products",
    schema: "Extract product name, price, and availability"
  }
});

console.log(schedule);
console.log(await client.listScheduleRuns(schedule.scheduleId));

// Save results to disk.
const scrape = await client.getScrape(scrapeId!);
saveScrapeAs(scrape.results ?? [], "csv", "./products.csv");

const { html } = await client.getFetchHtml(scrapeId!);
saveFetchAs(html, "markdown", "./page.md");
```

## API

### `new DivParserClient(apiKey, baseUrl?)`

Create a new DivParser client.

- `apiKey` (string): your DivParser API key
- `baseUrl` (string, optional): defaults to `https://api.divparser.com/v1`

### `scrape(url, schema, options)`

Submit a scrape job for a webpage. `options.deliveryConfig` delivers the result to a Storage
you've already connected via the dashboard — see [Delivering results](#delivering-results-to-a-storage) below.

### `scrapePaginated(urls, schema, options)`

Submit a paginated scrape job for multiple URLs. Also accepts `options.deliveryConfig`.

### `parse(html, schema, options)`

Submit raw HTML for AI-powered extraction.

### `checkStatus(jobId)`

Poll the live status of a scrape or parse job.

### `waitForCompletion(jobId, timeoutMs?, pollIntervalMs?)`

Wait until a job completes or a timeout is reached.

### `getScrape(scrapeId)`

Retrieve scrape results by ID.

### `getParse(parseId)`

Retrieve parse results by ID.

### `fetch(url, options)`

Fetch a URL only, with no extraction — returns once the page lands in `FETCHED` state. Useful
when you want to decide on (or reuse) an extraction schema after the fetch, not before. Note: this
endpoint reports every failure as a 402, not just insufficient credits — check the error message,
not just the status code. Also accepts `options.deliveryConfig`.

### `extractFetch(scrapeId, schema, options)`

Attach a NestLang/prompt schema to a previously-fetched scrape and run instant (AI) extraction
against its already-stored HTML. Also accepts `options.deliveryConfig`.

### `createSchedule(payload)`

Create a recurring schedule. `payload.schedule` is either `{ type: "cron", pattern }` or
`{ type: "interval", every }` (milliseconds); `payload.scrape` is the template scrape to repeat.
`payload.deliveryConfig` applies to every future run this schedule generates, not just the
template — see [Delivering results](#delivering-results-to-a-storage) below.

### `listSchedules()`

List all schedules for the authenticated user. Not paginated.

### `getSchedule(scheduleId)`

Retrieve a single schedule by ID.

### `pauseSchedule(scheduleId)` / `resumeSchedule(scheduleId)`

Pause or resume a schedule's recurring runs.

### `deleteSchedule(scheduleId)`

Stop and permanently delete a schedule.

### `listScheduleRuns(scheduleId, limit?, cursor?)`

List the scrapes a schedule has generated so far, cursor-paginated (same shape as `listScrapes`).

### `getFetchHtml(scrapeId)`

Retrieve the raw HTML for a fetched scrape. Only meaningful for a scrape created via `fetch()` —
`getScrape()` never includes this (it's not an extraction result).

## Delivering Results to a Storage

`scrape()`, `scrapePaginated()`, `fetch()`, `extractFetch()`, and `createSchedule()` all accept an
optional `deliveryConfig`, which uploads the completed run's data to a destination you've already
connected via the [dashboard's Storages page](https://www.divparser.com/dashboard) — the API can't
accept raw S3/Google Drive/Dropbox credentials inline, only reference an already-connected one. A
destination that isn't connected (or isn't active) is silently dropped, not an error.

```ts
await client.scrape(url, schema, {
  deliveryConfig: {
    destinations: ["S3", "GOOGLE_DRIVE"],
    format: "csv" // "json" (default) | "csv" | "xlsx"
  }
});

// createSchedule's deliveryConfig applies to every future run, not just the template.
await client.createSchedule({
  name: "Daily check",
  projectId,
  schedule: { type: "cron", pattern: "0 9 * * *" },
  scrape: { url, schema },
  deliveryConfig: { destinations: ["DROPBOX"] }
});
```

`fetch()`'s content is raw HTML/Markdown, never tabular — use `format: "html"` or `"markdown"`
instead.

## Saving results to disk

`saveScrapeAs()` and `saveFetchAs()` write directly to the filesystem, so they live at the
`"@divparser/client/node"` subpath rather than the main entry point — the main package stays safe to
bundle for the browser.

### `saveScrapeAs(results, format, filePath)` — from `"@divparser/client/node"`

Save a scrape/parse result to disk as `"json"`, `"csv"`, or `"xlsx"`. `results` is the `results`
array from `getScrape()`/`getParse()` — rows with usable data (`SUCCESS` and `REQUIRES_ATTENTION`)
are combined into one flat export; `FAILED` rows are skipped.

### `saveFetchAs(html, format, filePath)` — from `"@divparser/client/node"`

Save a fetch's raw HTML to disk, either `"html"` as-is or converted to `"markdown"`.

### `toJson(data)` / `toCsv(data)` / `toXlsx(data, sheetName?)` / `htmlToMarkdown(html)`

Lower-level, isomorphic (safe in browser or Node) conversion primitives — exported from the main
`"@divparser/client"` entry point. Use these directly if you want the converted string/`Buffer` instead
of a file (e.g. to stream it, upload it, or use a custom dataset instead of a full `results` array).

## Notes

- `scrapeAndWait` and `parseAndWait` convenience methods use the API's status polling internally.
- `cross-fetch` is used for broad runtime compatibility in browser and Node environments.
- Error responses aren't perfectly uniform across the API (status codes and body shape vary by
  endpoint) — every method throws an `Error` with the best available message, so catching `Error`
  is always safe even where the exact status code isn't.
