# DivParser JavaScript SDK

A TypeScript client SDK for the [DivParser API](https://www.divparser.com/docs?p=API+Reference).

## Features

- Scrape web pages using the DivParser API
- Parse raw HTML content directly
- Poll job status and retrieve results
- Support for paginated multi-url scraping
- Easy TypeScript types and developer experience

## Installation

```bash
npm install divparser-js
```

## Build

```bash
npm run build
```

## Quick Start

```ts
import { DivParserClient } from "divparser-js";

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
```

## API

### `new DivParserClient(apiKey, baseUrl?)`

Create a new DivParser client.

- `apiKey` (string): your DivParser API key
- `baseUrl` (string, optional): defaults to `https://api.divparser.com/v1`

### `scrape(url, schema, options)`

Submit a scrape job for a webpage.

### `scrapePaginated(urls, schema, options)`

Submit a paginated scrape job for multiple URLs.

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

## Notes

- `scrapeAndWait` and `parseAndWait` convenience methods use the API's status polling internally.
- `cross-fetch` is used for broad runtime compatibility in browser and Node environments.
