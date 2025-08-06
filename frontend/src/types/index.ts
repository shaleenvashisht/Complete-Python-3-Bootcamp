export interface LogEntry {
  timestamp: string;
  service_name: string;
  log_level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  message: string;
  request_id?: string;
  external_order_id?: string;
  event_name?: string;
  source?: string;
  metadata: Record<string, any>;
  line_number: number;
  raw_line: string;
}

export interface RequestLifecycle {
  request_id?: string;
  external_order_id?: string;
  source: 'API_GATEWAY' | 'BATCH_JOB' | 'SCHEDULER' | 'CRON' | 'USER_INTERFACE' | 'WEBHOOK' | 'INTERNAL' | 'UNKNOWN';
  start_time: string;
  end_time?: string;
  duration_ms?: number;
  services: string[];
  events: LogEntry[];
  status: 'COMPLETE' | 'INCOMPLETE' | 'ERROR';
  error_count: number;
  has_errors: boolean;
}

export interface ParsedLogsResponse {
  total_lines: number;
  parsed_lines: number;
  skipped_lines: number;
  unique_requests: number;
  lifecycles: RequestLifecycle[];
  services: string[];
  time_range: {
    start?: string;
    end?: string;
  };
  processing_time_ms: number;
}

export interface FileUploadResponse {
  filename: string;
  size: number;
  content_type: string;
  processing_time_ms: number;
  result: ParsedLogsResponse;
}

export interface SearchFilters {
  requestId?: string;
  externalOrderId?: string;
  serviceName?: string;
  status?: string;
  source?: string;
  hasErrors?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface AppState {
  data: ParsedLogsResponse | null;
  loading: boolean;
  error: string | null;
  filters: SearchFilters;
  darkMode: boolean;
  selectedLifecycle: RequestLifecycle | null;
}

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
export type RequestSource = 'API_GATEWAY' | 'BATCH_JOB' | 'SCHEDULER' | 'CRON' | 'USER_INTERFACE' | 'WEBHOOK' | 'INTERNAL' | 'UNKNOWN';
export type RequestStatus = 'COMPLETE' | 'INCOMPLETE' | 'ERROR';