import re
import time
from datetime import datetime
from typing import List, Dict, Optional, Tuple
from dateutil import parser as date_parser
from app.models.log_models import LogEntry, LogLevel, RequestLifecycle, RequestSource, ParsedLogsResponse
from collections import defaultdict

class LogParser:
    """Advanced log parser for distributed microservice logs"""
    
    def __init__(self):
        # Regex patterns for different log formats
        self.patterns = {
            # ISO timestamp pattern
            'timestamp_iso': r'(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d{3,6})?(?:Z|[+-]\d{2}:?\d{2})?)',
            
            # Common log levels
            'log_level': r'\b(DEBUG|INFO|WARN|WARNING|ERROR|FATAL|TRACE)\b',
            
            # Service name patterns
            'service_name': r'(?:service[_-]?name[=:]?\s*([a-zA-Z0-9_-]+)|(\w+[-_]service|\w+[-_]api|\w+[-_]worker))',
            
            # Request ID patterns
            'request_id': r'(?:request[_-]?id[=:]?\s*([a-fA-F0-9-]{8,})|req[_-]?id[=:]?\s*([a-fA-F0-9-]{8,})|correlation[_-]?id[=:]?\s*([a-fA-F0-9-]{8,}))',
            
            # External Order ID patterns
            'external_order_id': r'(?:external[_-]?order[_-]?id[=:]?\s*([a-zA-Z0-9_-]{8,})|order[_-]?id[=:]?\s*([a-zA-Z0-9_-]{8,})|transaction[_-]?id[=:]?\s*([a-zA-Z0-9_-]{8,}))',
            
            # Event name patterns
            'event_name': r'(?:event[=:]?\s*([a-zA-Z_][a-zA-Z0-9_]*)|action[=:]?\s*([a-zA-Z_][a-zA-Z0-9_]*))',
            
            # Source detection patterns
            'api_gateway': r'\b(api[-_]?gateway|gateway|nginx|envoy|kong)\b',
            'batch_job': r'\b(batch|job|worker|processor)\b',
            'scheduler': r'\b(scheduler|cron|timer|scheduled)\b',
            'webhook': r'\b(webhook|callback|notification)\b',
            'ui': r'\b(ui|frontend|web|browser|client)\b',
        }
        
        # Compile patterns for better performance
        self.compiled_patterns = {k: re.compile(v, re.IGNORECASE) for k, v in self.patterns.items()}
    
    async def parse_logs(self, content: str) -> ParsedLogsResponse:
        """Parse log content and return structured data"""
        start_time = time.time()
        
        lines = content.split('\n')
        total_lines = len(lines)
        parsed_entries = []
        skipped_lines = 0
        
        for line_num, line in enumerate(lines, 1):
            if not line.strip():
                skipped_lines += 1
                continue
                
            try:
                entry = self._parse_log_line(line, line_num)
                if entry:
                    parsed_entries.append(entry)
                else:
                    skipped_lines += 1
            except Exception:
                skipped_lines += 1
                continue
        
        # Reconstruct request lifecycles
        lifecycles = self._reconstruct_lifecycles(parsed_entries)
        
        # Calculate statistics
        services = list(set(entry.service_name for entry in parsed_entries if entry.service_name))
        time_range = self._calculate_time_range(parsed_entries)
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return ParsedLogsResponse(
            total_lines=total_lines,
            parsed_lines=len(parsed_entries),
            skipped_lines=skipped_lines,
            unique_requests=len(lifecycles),
            lifecycles=lifecycles,
            services=services,
            time_range=time_range,
            processing_time_ms=processing_time
        )
    
    def _parse_log_line(self, line: str, line_num: int) -> Optional[LogEntry]:
        """Parse a single log line into structured data"""
        # Extract timestamp
        timestamp = self._extract_timestamp(line)
        if not timestamp:
            return None
        
        # Extract log level
        log_level = self._extract_log_level(line)
        
        # Extract service name
        service_name = self._extract_service_name(line)
        
        # Extract IDs
        request_id = self._extract_request_id(line)
        external_order_id = self._extract_external_order_id(line)
        
        # Extract event name
        event_name = self._extract_event_name(line)
        
        # Detect source
        source = self._detect_source(line)
        
        return LogEntry(
            timestamp=timestamp,
            service_name=service_name or "unknown",
            log_level=log_level,
            message=line.strip(),
            request_id=request_id,
            external_order_id=external_order_id,
            event_name=event_name,
            source=source,
            line_number=line_num,
            raw_line=line
        )
    
    def _extract_timestamp(self, line: str) -> Optional[datetime]:
        """Extract timestamp from log line"""
        match = self.compiled_patterns['timestamp_iso'].search(line)
        if match:
            try:
                return date_parser.parse(match.group(1))
            except:
                pass
        return None
    
    def _extract_log_level(self, line: str) -> LogLevel:
        """Extract log level from line"""
        match = self.compiled_patterns['log_level'].search(line)
        if match:
            level = match.group(1).upper()
            if level == "WARNING":
                level = "WARN"
            try:
                return LogLevel(level)
            except ValueError:
                pass
        return LogLevel.INFO
    
    def _extract_service_name(self, line: str) -> Optional[str]:
        """Extract service name from line"""
        match = self.compiled_patterns['service_name'].search(line)
        if match:
            for group in match.groups():
                if group:
                    return group.lower().replace('-', '_')
        return None
    
    def _extract_request_id(self, line: str) -> Optional[str]:
        """Extract request ID from line"""
        match = self.compiled_patterns['request_id'].search(line)
        if match:
            for group in match.groups():
                if group:
                    return group
        return None
    
    def _extract_external_order_id(self, line: str) -> Optional[str]:
        """Extract external order ID from line"""
        match = self.compiled_patterns['external_order_id'].search(line)
        if match:
            for group in match.groups():
                if group:
                    return group
        return None
    
    def _extract_event_name(self, line: str) -> Optional[str]:
        """Extract event name from line"""
        match = self.compiled_patterns['event_name'].search(line)
        if match:
            for group in match.groups():
                if group:
                    return group
        return None
    
    def _detect_source(self, line: str) -> str:
        """Detect request source from line content"""
        line_lower = line.lower()
        
        if self.compiled_patterns['api_gateway'].search(line_lower):
            return RequestSource.API_GATEWAY
        elif self.compiled_patterns['batch_job'].search(line_lower):
            return RequestSource.BATCH_JOB
        elif self.compiled_patterns['scheduler'].search(line_lower):
            return RequestSource.SCHEDULER
        elif self.compiled_patterns['webhook'].search(line_lower):
            return RequestSource.WEBHOOK
        elif self.compiled_patterns['ui'].search(line_lower):
            return RequestSource.USER_INTERFACE
        
        return RequestSource.UNKNOWN
    
    def _reconstruct_lifecycles(self, entries: List[LogEntry]) -> List[RequestLifecycle]:
        """Reconstruct request lifecycles from log entries"""
        # Group entries by request ID or external order ID
        grouped_entries = defaultdict(list)
        
        for entry in entries:
            key = entry.request_id or entry.external_order_id
            if key:
                grouped_entries[key].append(entry)
        
        lifecycles = []
        
        for identifier, entry_list in grouped_entries.items():
            # Sort entries by timestamp
            entry_list.sort(key=lambda x: x.timestamp)
            
            # Determine primary identifier type
            request_id = None
            external_order_id = None
            
            for entry in entry_list:
                if entry.request_id:
                    request_id = entry.request_id
                if entry.external_order_id:
                    external_order_id = entry.external_order_id
            
            # Calculate lifecycle properties
            start_time = entry_list[0].timestamp
            end_time = entry_list[-1].timestamp if len(entry_list) > 1 else None
            duration_ms = None
            
            if end_time:
                duration_ms = int((end_time - start_time).total_seconds() * 1000)
            
            # Gather services
            services = list(set(entry.service_name for entry in entry_list if entry.service_name))
            
            # Determine source
            sources = [entry.source for entry in entry_list if entry.source and entry.source != RequestSource.UNKNOWN]
            source = sources[0] if sources else RequestSource.UNKNOWN
            
            # Check for errors
            error_count = sum(1 for entry in entry_list if entry.log_level in [LogLevel.ERROR, LogLevel.FATAL])
            has_errors = error_count > 0
            
            # Determine status
            status = "ERROR" if has_errors else ("COMPLETE" if end_time else "INCOMPLETE")
            
            lifecycle = RequestLifecycle(
                request_id=request_id,
                external_order_id=external_order_id,
                source=source,
                start_time=start_time,
                end_time=end_time,
                duration_ms=duration_ms,
                services=services,
                events=entry_list,
                status=status,
                error_count=error_count,
                has_errors=has_errors
            )
            
            lifecycles.append(lifecycle)
        
        # Sort lifecycles by start time
        lifecycles.sort(key=lambda x: x.start_time)
        
        return lifecycles
    
    def _calculate_time_range(self, entries: List[LogEntry]) -> Dict[str, Optional[datetime]]:
        """Calculate the time range of all log entries"""
        if not entries:
            return {"start": None, "end": None}
        
        timestamps = [entry.timestamp for entry in entries]
        return {
            "start": min(timestamps),
            "end": max(timestamps)
        }