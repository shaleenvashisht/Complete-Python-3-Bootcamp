from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import JSONResponse
from typing import Optional, List
import time
import io
from app.models.log_models import FileUploadResponse, ParsedLogsResponse
from app.services.log_parser import LogParser
from app.core.config import settings

router = APIRouter()
log_parser = LogParser()

@router.post("/upload", response_model=FileUploadResponse)
async def upload_log_file(file: UploadFile = File(...)):
    """Upload and parse a log file"""
    
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Check file extension
    file_ext = "." + file.filename.split(".")[-1].lower()
    if file_ext not in settings.ALLOWED_FILE_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"File type not supported. Allowed types: {', '.join(settings.ALLOWED_FILE_EXTENSIONS)}"
        )
    
    # Check file size
    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413, 
            detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    try:
        # Parse the content
        start_time = time.time()
        content_str = content.decode('utf-8')
        
        # Process the logs
        parsed_result = await log_parser.parse_logs(content_str)
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return FileUploadResponse(
            filename=file.filename,
            size=len(content),
            content_type=file.content_type or "text/plain",
            processing_time_ms=processing_time,
            result=parsed_result
        )
    
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File encoding not supported. Please use UTF-8.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "log-parser"}

@router.post("/parse-text", response_model=ParsedLogsResponse)
async def parse_log_text(content: dict):
    """Parse log content directly from text"""
    
    if "content" not in content:
        raise HTTPException(status_code=400, detail="Missing 'content' field")
    
    log_content = content["content"]
    
    if not isinstance(log_content, str):
        raise HTTPException(status_code=400, detail="Content must be a string")
    
    if len(log_content) > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413, 
            detail=f"Content too large. Maximum size: {settings.MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    try:
        # Process the logs
        parsed_result = await log_parser.parse_logs(log_content)
        return parsed_result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing content: {str(e)}")

@router.get("/export/{format}")
async def export_data(
    format: str,
    data: dict,
    filename: Optional[str] = Query(None, description="Custom filename")
):
    """Export parsed data in different formats"""
    
    if format not in ["json", "csv"]:
        raise HTTPException(status_code=400, detail="Format must be 'json' or 'csv'")
    
    try:
        if format == "json":
            import json
            content = json.dumps(data, indent=2, default=str)
            media_type = "application/json"
            file_ext = "json"
        
        elif format == "csv":
            # Convert to CSV format
            import csv
            import io
            
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Write headers
            if "lifecycles" in data:
                writer.writerow([
                    "Request ID", "External Order ID", "Source", "Start Time", 
                    "End Time", "Duration (ms)", "Services", "Status", "Error Count"
                ])
                
                # Write data rows
                for lifecycle in data["lifecycles"]:
                    writer.writerow([
                        lifecycle.get("request_id", ""),
                        lifecycle.get("external_order_id", ""),
                        lifecycle.get("source", ""),
                        lifecycle.get("start_time", ""),
                        lifecycle.get("end_time", ""),
                        lifecycle.get("duration_ms", ""),
                        ", ".join(lifecycle.get("services", [])),
                        lifecycle.get("status", ""),
                        lifecycle.get("error_count", 0)
                    ])
            
            content = output.getvalue()
            media_type = "text/csv"
            file_ext = "csv"
        
        # Generate filename
        if not filename:
            timestamp = int(time.time())
            filename = f"microtrace_export_{timestamp}.{file_ext}"
        elif not filename.endswith(f".{file_ext}"):
            filename = f"{filename}.{file_ext}"
        
        return JSONResponse(
            content={"content": content, "filename": filename},
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting data: {str(e)}")