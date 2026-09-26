export type PageType = "LISTING" | "DETAIL";

// Delivers a completed run's data to a destination you've already connected
// via the dashboard (Storages) — the API can't accept raw S3/Drive/Dropbox
// credentials inline, only reference an already-ACTIVE connection. Any
// destination that isn't connected (or isn't ACTIVE) is silently dropped
// server-side rather than erroring.
export type DestinationType = "S3" | "GOOGLE_DRIVE" | "DROPBOX";
export type DeliveryFormat = "json" | "csv" | "xlsx" | "html" | "markdown";

export interface DeliveryConfig {
  destinations: DestinationType[];
  // Defaults to "json" server-side if omitted. Fetch-mode delivery is raw
  // HTML/Markdown, never tabular — use "html" or "markdown" for fetch().
  format?: DeliveryFormat;
}

export interface ScrapeRequestPayload {
  url: string;
  schema: string;
  name?: string;
  pageType?: PageType;
  deliveryConfig?: DeliveryConfig;
}

export interface PaginatedScrapeRequestPayload {
  urls: string[];
  schema: string;
  name?: string;
  pageType?: PageType;
  paginated: true;
  deliveryConfig?: DeliveryConfig;
}

export interface ParseRequestPayload {
  html: string;
  schema: string;
  name?: string;
}

export interface StatusResponse {
  completed: boolean;
  state: string;
}

export interface JobResult {
  id: string;
  // Present on scrape results, absent on parse results (parse operates on
  // HTML you supplied directly, not a URL DivParser fetched).
  url?: string;
  // "SUCCESS" | "FAILED" | "REQUIRES_ATTENTION" — the third status means
  // the long-term parser's self-healing selectors came back under-confident,
  // not that extraction failed; `data` is still populated for that row.
  status?: string;
  // Usually an array (one entry per matched item), but a DETAIL-pageType
  // extraction can return a single object instead — never assume the array
  // shape without checking.
  data?: unknown;
  createdAt?: string;
}

export interface ScrapeDetails {
  id: string;
  name?: string;
  url?: string;
  status?: string;
  mode?: string;
  pageType?: PageType;
  createdAt?: string;
  results?: JobResult[];
}

export interface ParseDetails extends ScrapeDetails {}

export interface ScrapeListResponse {
  data: ScrapeDetails[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface JobResponse {
  message?: string;
  scrapeId?: string;
  jobId?: string;
}

export type ProxyMode = "residential" | "unblocker" | "http";

export interface FetchRequestPayload {
  url: string;
  name?: string;
  projectId?: string;
  proxyMode?: ProxyMode;
  deliveryConfig?: DeliveryConfig;
}

export interface ExtractRequestPayload {
  schema: string;
  deliveryConfig?: DeliveryConfig;
}

export interface FetchHtmlResponse {
  id: string;
  html: string;
}

export type ScheduleCadence =
  | { type: "cron"; pattern: string }
  | { type: "interval"; every: number };

export interface ScheduleCreatePayload {
  name: string;
  projectId: string;
  schedule: ScheduleCadence;
  iterations?: number;
  scrape: {
    url: string;
    schema: string;
    name?: string;
    pageType?: PageType;
  };
  // Applies to every future run this schedule generates.
  deliveryConfig?: DeliveryConfig;
}

export interface ScheduleCreateResponse {
  message: string;
  scheduleId: string;
  templateScrapeId: string;
  status: string;
}

export interface ScheduleDetails {
  id: string;
  name: string;
  repeatPattern: string | null;
  repeatEvery: number | null;
  iterations: number | null;
  status: string;
  createdAt: string;
  projectId: string;
  _count: { scrapes: number };
}

export interface ScheduleListResponse {
  data: ScheduleDetails[];
}

export interface ScheduleActionResponse {
  message: string;
  scheduleId: string;
}

export interface ScheduleRun {
  id: string;
  name?: string;
  url?: string;
  status?: string;
  createdAt: string;
  _count: { scrapeData: number };
}

export interface ScheduleRunsResponse {
  scheduleId: string;
  data: ScheduleRun[];
  nextCursor: string | null;
  hasMore: boolean;
}
