export type PageType = "LISTING" | "DETAIL";

export interface ScrapeRequestPayload {
  url: string;
  schema: string;
  name?: string;
  pageType?: PageType;
}

export interface PaginatedScrapeRequestPayload {
  urls: string[];
  schema: string;
  name?: string;
  pageType?: PageType;
  paginated: true;
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
  url?: string;
  status?: string;
  data?: unknown[];
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
