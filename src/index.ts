import fetch from "cross-fetch";
import {
  JobResponse,
  ParseDetails,
  ParseRequestPayload,
  PageType,
  ScrapeDetails,
  ScrapeListResponse,
  ScrapeRequestPayload,
  StatusResponse,
  PaginatedScrapeRequestPayload
} from "./types.js";

const DEFAULT_BASE_URL = "https://api.divparser.com/v1";
const DEFAULT_TIMEOUT_MS = 300_000;
const DEFAULT_POLL_INTERVAL_MS = 1_000;

function buildHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json"
  };
}

function assertResponse(response: Response, body: unknown) {
  if (!response.ok) {
    const message = typeof body === "object" && body !== null && "message" in body
      ? (body as { message: string }).message
      : response.statusText;
    throw new Error(`DivParser API error: ${response.status} ${message}`);
  }
}

export class DivParserClient {
  private readonly headers: Record<string, string>;

  constructor(public apiKey: string, public baseUrl: string = DEFAULT_BASE_URL) {
    this.headers = buildHeaders(apiKey);
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, init);
    const body = await response.json().catch(() => ({}));
    assertResponse(response, body);
    return body as T;
  }

  async scrape(
    url: string,
    schema: string,
    options: {
      name?: string;
      pageType?: PageType;
      wait?: boolean;
      timeoutMs?: number;
    } = {}
  ): Promise<JobResponse & { results?: unknown[] }> {
    const payload: ScrapeRequestPayload = {
      url,
      schema,
      pageType: options.pageType ?? "LISTING"
    };

    if (options.name) {
      payload.name = options.name;
    }

    const result = await this.request<JobResponse>("/scrapes", {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(payload)
    });

    if (options.wait && result.jobId && result.scrapeId) {
      await this.waitForCompletion(result.jobId, options.timeoutMs);
      const scrape = await this.getScrape(result.scrapeId);
      return { ...result, results: scrape.results };
    }

    return result;
  }

  async scrapePaginated(
    urls: string[],
    schema: string,
    options: {
      name?: string;
      pageType?: PageType;
      wait?: boolean;
      timeoutMs?: number;
    } = {}
  ): Promise<JobResponse & { results?: unknown[] }> {
    const payload: PaginatedScrapeRequestPayload = {
      urls,
      schema,
      pageType: options.pageType ?? "LISTING",
      paginated: true
    };

    if (options.name) {
      payload.name = options.name;
    }

    const result = await this.request<JobResponse>("/scrapes", {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(payload)
    });

    if (options.wait && result.jobId && result.scrapeId) {
      await this.waitForCompletion(result.jobId, options.timeoutMs);
      const scrape = await this.getScrape(result.scrapeId);
      return { ...result, results: scrape.results };
    }

    return result;
  }

  async listScrapes(limit = 20, cursor?: string): Promise<ScrapeListResponse> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) {
      params.set("cursor", cursor);
    }

    return this.request<ScrapeListResponse>(`/scrapes?${params.toString()}`, {
      method: "GET",
      headers: this.headers
    });
  }

  async getScrape(scrapeId: string): Promise<ScrapeDetails> {
    return this.request<ScrapeDetails>(`/scrapes/${encodeURIComponent(scrapeId)}`, {
      method: "GET",
      headers: this.headers
    });
  }

  async parse(
    html: string,
    schema: string,
    options: {
      name?: string;
      wait?: boolean;
      timeoutMs?: number;
    } = {}
  ): Promise<JobResponse & { results?: unknown[] }> {
    const payload: ParseRequestPayload = {
      html,
      schema
    };

    if (options.name) {
      payload.name = options.name;
    }

    const result = await this.request<JobResponse>("/parse", {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(payload)
    });

    if (options.wait && result.jobId && result.scrapeId) {
      await this.waitForCompletion(result.jobId, options.timeoutMs);
      const parse = await this.getParse(result.scrapeId);
      return { ...result, results: parse.results };
    }

    return result;
  }

  async getParse(parseId: string): Promise<ParseDetails> {
    return this.request<ParseDetails>(`/parse/${encodeURIComponent(parseId)}`, {
      method: "GET",
      headers: this.headers
    });
  }

  async checkStatus(jobId: string): Promise<StatusResponse> {
    const params = new URLSearchParams({ jobId });
    return this.request<StatusResponse>(`/status?${params.toString()}`, {
      method: "GET",
      headers: this.headers
    });
  }

  async waitForCompletion(jobId: string, timeoutMs: number = DEFAULT_TIMEOUT_MS, pollIntervalMs: number = DEFAULT_POLL_INTERVAL_MS): Promise<StatusResponse> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const status = await this.checkStatus(jobId);
      if (status.completed) {
        return status;
      }
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
    throw new Error(`Job ${jobId} did not complete within ${timeoutMs}ms`);
  }

  async scrapeAndWait(
    url: string,
    schema: string,
    options: {
      name?: string;
      pageType?: PageType;
      timeoutMs?: number;
    } = {}
  ): Promise<JobResponse & { results?: unknown[] }> {
    return this.scrape(url, schema, {
      name: options.name,
      pageType: options.pageType,
      wait: true,
      timeoutMs: options.timeoutMs
    });
  }

  async parseAndWait(
    html: string,
    schema: string,
    options: {
      name?: string;
      timeoutMs?: number;
    } = {}
  ): Promise<JobResponse & { results?: unknown[] }> {
    return this.parse(html, schema, {
      name: options.name,
      wait: true,
      timeoutMs: options.timeoutMs
    });
  }
}
