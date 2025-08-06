import pytest
from datetime import datetime
from app.services.log_parser import LogParser
from app.models.log_models import LogLevel, RequestSource

@pytest.fixture
def log_parser():
    return LogParser()

@pytest.fixture
def sample_log_content():
    return """
2024-01-15T10:30:15.123Z INFO api-gateway request_id=abc123 external_order_id=order456 event=request_received message="API Gateway received request"
2024-01-15T10:30:15.456Z INFO payment-service request_id=abc123 event=payment_processing message="Processing payment for order"
2024-01-15T10:30:16.789Z ERROR payment-service request_id=abc123 event=payment_failed message="Payment failed: insufficient funds"
2024-01-15T10:30:17.012Z INFO notification-service request_id=abc123 event=notification_sent message="Payment failure notification sent"
2024-01-15T10:31:00.000Z INFO scheduler cron_job=daily_batch event=batch_started message="Starting daily batch job"
"""

@pytest.mark.asyncio
async def test_parse_logs_basic(log_parser, sample_log_content):
    """Test basic log parsing functionality"""
    result = await log_parser.parse_logs(sample_log_content)
    
    assert result.total_lines == 6  # Including empty lines
    assert result.parsed_lines > 0
    assert result.unique_requests > 0
    assert len(result.lifecycles) > 0
    assert len(result.services) > 0
    assert result.processing_time_ms > 0

@pytest.mark.asyncio
async def test_lifecycle_reconstruction(log_parser, sample_log_content):
    """Test request lifecycle reconstruction"""
    result = await log_parser.parse_logs(sample_log_content)
    
    # Should have at least one lifecycle for request abc123
    abc123_lifecycle = None
    for lifecycle in result.lifecycles:
        if lifecycle.request_id == "abc123":
            abc123_lifecycle = lifecycle
            break
    
    assert abc123_lifecycle is not None
    assert abc123_lifecycle.has_errors == True
    assert abc123_lifecycle.error_count > 0
    assert len(abc123_lifecycle.events) >= 3
    assert len(abc123_lifecycle.services) >= 2

def test_timestamp_extraction(log_parser):
    """Test timestamp extraction from various formats"""
    test_cases = [
        "2024-01-15T10:30:15.123Z",
        "2024-01-15 10:30:15.123",
        "2024-01-15T10:30:15+00:00",
    ]
    
    for timestamp in test_cases:
        extracted = log_parser._extract_timestamp(f"{timestamp} INFO test message")
        assert extracted is not None
        assert isinstance(extracted, datetime)

def test_log_level_extraction(log_parser):
    """Test log level extraction"""
    test_cases = [
        ("INFO some message", LogLevel.INFO),
        ("ERROR failed operation", LogLevel.ERROR),
        ("DEBUG debug info", LogLevel.DEBUG),
        ("WARN warning message", LogLevel.WARN),
        ("WARNING warning message", LogLevel.WARN),
    ]
    
    for log_line, expected_level in test_cases:
        level = log_parser._extract_log_level(log_line)
        assert level == expected_level

def test_service_name_extraction(log_parser):
    """Test service name extraction"""
    test_cases = [
        ("service_name=api-gateway", "api_gateway"),
        ("payment-service INFO", "payment_service"),
        ("user-api DEBUG", "user_api"),
        ("notification_worker WARN", "notification_worker"),
    ]
    
    for log_line, expected_service in test_cases:
        service = log_parser._extract_service_name(log_line)
        assert service == expected_service

def test_request_id_extraction(log_parser):
    """Test request ID extraction"""
    test_cases = [
        "request_id=abc123def456",
        "req_id=abc123def456", 
        "correlation_id=abc123def456",
        "request-id: abc123def456",
    ]
    
    for log_line in test_cases:
        request_id = log_parser._extract_request_id(log_line)
        assert request_id == "abc123def456"

def test_source_detection(log_parser):
    """Test request source detection"""
    test_cases = [
        ("api-gateway request received", RequestSource.API_GATEWAY),
        ("batch job started", RequestSource.BATCH_JOB),
        ("scheduler triggered", RequestSource.SCHEDULER),
        ("webhook callback", RequestSource.WEBHOOK),
        ("ui frontend request", RequestSource.USER_INTERFACE),
    ]
    
    for log_line, expected_source in test_cases:
        source = log_parser._detect_source(log_line)
        assert source == expected_source

@pytest.mark.asyncio
async def test_empty_content(log_parser):
    """Test handling of empty content"""
    result = await log_parser.parse_logs("")
    
    assert result.total_lines == 1  # Empty string creates one empty line
    assert result.parsed_lines == 0
    assert result.unique_requests == 0
    assert len(result.lifecycles) == 0

@pytest.mark.asyncio
async def test_malformed_logs(log_parser):
    """Test handling of malformed logs"""
    malformed_content = """
    This is not a proper log line
    Another random text without structure
    2024-01-15T10:30:15.123Z INFO properly-formatted log line
    """
    
    result = await log_parser.parse_logs(malformed_content)
    
    assert result.total_lines > 0
    assert result.skipped_lines > 0
    # Should still parse the properly formatted line
    assert result.parsed_lines >= 1

@pytest.mark.asyncio
async def test_large_log_processing(log_parser):
    """Test processing of larger log files"""
    # Generate a larger log content
    large_content = ""
    for i in range(1000):
        large_content += f"2024-01-15T10:30:{i % 60:02d}.{i % 1000:03d}Z INFO service-{i % 5} request_id=req{i} message='Request {i}'\n"
    
    result = await log_parser.parse_logs(large_content)
    
    assert result.total_lines == 1000
    assert result.parsed_lines > 0
    assert len(result.lifecycles) > 0
    assert result.processing_time_ms > 0