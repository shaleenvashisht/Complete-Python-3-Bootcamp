from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class LogLevel(str, Enum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARN = "WARN"
    ERROR = "ERROR"
    FATAL = "FATAL"

class RequestSource(str, Enum):
    API_GATEWAY = "API_GATEWAY"
    BATCH_JOB = "BATCH_JOB"
    SCHEDULER = "SCHEDULER"
    CRON = "CRON"
    USER_INTERFACE = "USER_INTERFACE"
    WEBHOOK = "WEBHOOK"
    INTERNAL = "INTERNAL"
    UNKNOWN = "UNKNOWN"

class LogEntry(BaseModel):
    timestamp: datetime
    service_name: str
    log_level: LogLevel
    message: str
    request_id: Optional[str] = None
    external_order_id: Optional[str] = None
    event_name: Optional[str] = None
    source: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    line_number: int
    raw_line: str

class RequestLifecycle(BaseModel):
    request_id: Optional[str] = None
    external_order_id: Optional[str] = None
    source: RequestSource = RequestSource.UNKNOWN
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_ms: Optional[int] = None
    services: List[str] = Field(default_factory=list)
    events: List[LogEntry] = Field(default_factory=list)
    status: str = "INCOMPLETE"  # COMPLETE, INCOMPLETE, ERROR
    error_count: int = 0
    has_errors: bool = False

class ParsedLogsResponse(BaseModel):
    total_lines: int
    parsed_lines: int
    skipped_lines: int
    unique_requests: int
    lifecycles: List[RequestLifecycle]
    services: List[str]
    time_range: Dict[str, Optional[datetime]]
    processing_time_ms: int

class FileUploadResponse(BaseModel):
    filename: str
    size: int
    content_type: str
    processing_time_ms: int
    result: ParsedLogsResponse