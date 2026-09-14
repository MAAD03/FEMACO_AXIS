export interface ApiErrorResponse {
  status: number;
  error: string;
  message?: string;
  messages?: string[];
  timestamp?: string;
  path?: string;
}

export interface NormalizedApiError extends ApiErrorResponse {
  userMessage: string;
  details: string[];
  friendlyTitle: string;
}
