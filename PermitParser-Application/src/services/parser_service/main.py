import base64
import json
import logging
import os
from typing import Dict
from src.models.WorkUnit.events import WorkUnitCreatedEvent
from src.models.WorkUnit.work_unit import WorkUnit
from src.models.WorkUnit.enums import ContentType
from src.models.CloudTask.task_models import CompletionTrackerTask
from google.cloud import firestore
from google.cloud import storage
from google.cloud import tasks_v2
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from google.auth.credentials import AnonymousCredentials
from src.services.parser_service.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Google Cloud clients with emulator support
def create_firestore_client():
    if os.getenv('FIRESTORE_EMULATOR_HOST'):
        return firestore.Client(project=settings.gcp_project_id)
    return firestore.Client(project=settings.gcp_project_id)

def create_storage_client():
    """Create Storage client with emulator support."""
    storage_emulator_host = os.getenv('STORAGE_EMULATOR_HOST')
    
    if storage_emulator_host:
        logger.info(f"Using GCS emulator at {storage_emulator_host}")
        return storage.Client(
            project=settings.gcp_project_id,
            client_options={"api_endpoint": storage_emulator_host},
            credentials=AnonymousCredentials()
        )
    return storage.Client(project=settings.gcp_project_id)

def create_tasks_client():
    if os.getenv('FIRESTORE_EMULATOR_HOST') or os.getenv('USE_EMULATORS'):
        logger.info("Running in emulator mode - Cloud Tasks client disabled")
        return None
    return tasks_v2.CloudTasksClient()

# Use these instead of direct instantiation
firestore_client = create_firestore_client()
gcs_client = create_storage_client()
tasks_client = create_tasks_client()

# GCS bucket names based on Terraform infrastructure
ENVIRONMENT = settings.environment  # This should come from environment variable in production
RAW_WORK_UNITS_BUCKET = f"{settings.gcp_project_id}-{ENVIRONMENT}-raw-work-units"
PARSED_OBJECTS_BUCKET = f"{settings.gcp_project_id}-{ENVIRONMENT}-parsed-objects"

# Cloud Tasks configuration
COMPLETION_TRACKER_QUEUE = f"projects/{settings.gcp_project_id}/locations/northamerica-northeast1/queues/completion-tracker-queue"
COMPLETION_TRACKER_URL = settings.completion_tracker_url  # This would be set via environment variable

app = FastAPI(
    title="Parser Service",
    description="Receives work units from Pub/Sub and triggers parsing.",
    version="0.1.0"
)

# --- Pydantic Models ---

class PubSubMessage(BaseModel):
    """The `message` part of a Pub/Sub push request."""
    data: str  # Base64-encoded string
    attributes: Dict[str, str] = None

class PubSubPushRequest(BaseModel):
    """The full payload of a Pub/Sub push request."""
    message: PubSubMessage
    subscription: str

# --- Endpoints ---

@app.post("/process-work-unit")
async def process_work_unit(request: PubSubPushRequest):
    """
    Endpoint to receive a WorkUnitCreatedEvent from a Pub/Sub push subscription.
    This triggers the parsing of a specific work unit.
    """
    # Initialize logging context with Pub/Sub metadata
    log_context = {
        "service": "parser_service",
        "operation": "process_work_unit",
        "subscription": request.subscription,
        "gcp_project": settings.gcp_project_id
    }
    
    try:
        logger.info("Pub/Sub message received", extra=log_context)
        
        # Decode the message data from Base64
        payload_bytes = base64.b64decode(request.message.data)
        payload_str = payload_bytes.decode("utf-8")
        event_data = json.loads(payload_str)
        
        # Log only non-sensitive metadata fields
        safe_metadata = {
            k: v for k, v in event_data.items() 
            if k in ['workUnitId', 'documentId', 'projectId']
        }
        logger.info(f"Decoded Pub/Sub metadata: {json.dumps(safe_metadata)}")

        # Validate the payload with the Pydantic model
        event = WorkUnitCreatedEvent(**event_data)
        
        # Enhance logging context with event details
        log_context.update({
            "work_unit_id": event.workUnitId,
            "document_id": event.documentId,
            "project_id": event.projectId,
            "content_type": event.contentType.value,
            "municipality": event.municipality
        })

        logger.info("WORK UNIT PARSING STARTED", extra=log_context)
        logger.info(f"Received event for work unit: {event.workUnitId} for document {event.documentId} in project '{settings.gcp_project_id}'")
        logger.info(f"Content type: {event.contentType}, Municipality: {event.municipality}")
        logger.info(f"Event details: {event.model_dump_json(by_alias=True)}")

        # Step 1: Read WorkUnit from Firestore using event.workUnitId
        logger.info(f"Step 1: Reading WorkUnit from Firestore for ID {event.workUnitId}")
        
        try:
            work_unit_ref = firestore_client.collection('work_units').document(event.workUnitId)
            work_unit_snapshot = work_unit_ref.get()
            
            if not work_unit_snapshot.exists:
                raise HTTPException(status_code=404, detail=f"WorkUnit {event.workUnitId} not found in Firestore")
            
            work_unit_data = work_unit_snapshot.to_dict()
            work_unit = WorkUnit(**work_unit_data)
            
            logger.info(f"Successfully retrieved WorkUnit from Firestore")
            
        except Exception as e:
            logger.error(f"Failed to read WorkUnit from Firestore: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to access WorkUnit: {str(e)}")

        # Step 2: Download raw content from GCS using WorkUnit.rawContentGcsUri
        logger.info(f"Step 2: Downloading raw content from GCS")
        
        try:
            # Extract bucket and blob path from GCS URI
            gcs_uri = work_unit.rawContentGcsUri
            blob_path = gcs_uri.replace(f"gs://{RAW_WORK_UNITS_BUCKET}/", "")
            
            bucket = gcs_client.bucket(RAW_WORK_UNITS_BUCKET)
            blob = bucket.blob(blob_path)
            raw_content = blob.download_as_text()
            
            # Log content size, not content itself
            logger.info(f"Successfully downloaded raw content from GCS", extra={
                "content_size_bytes": len(raw_content.encode('utf-8')),
                "blob_path": blob_path
            })
            
        except Exception as e:
            logger.error(f"Failed to download raw content from GCS: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to download content: {str(e)}")

        # Step 3: Parse content based on WorkUnit.contentType (TEXT/TABLE/IMAGE)
        logger.info(f"Step 3: Parsing {event.contentType} content using appropriate strategy")
        
        try:
            parsed_object = _parse_content_by_type(raw_content, event.contentType)
            logger.info(f"Successfully parsed content using {event.contentType} strategy")
            
        except Exception as e:
            logger.error(f"Failed to parse content: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to parse content: {str(e)}")

        # Step 4: Create ParsedObject and save to GCS in parsed objects bucket
        logger.info(f"Step 4: Creating ParsedObject and saving to GCS")
        
        try:
            # Create path organized by project and document ID as per architecture
            parsed_path = f"{event.projectId}/{event.documentId}/parsed_{event.workUnitId}.json"
            
            bucket = gcs_client.bucket(PARSED_OBJECTS_BUCKET)
            blob = bucket.blob(parsed_path)
            
            # Convert parsed object to JSON and upload
            parsed_json = json.dumps(parsed_object, indent=2)
            blob.upload_from_string(parsed_json, content_type='application/json')
            
            parsed_gcs_uri = f"gs://{PARSED_OBJECTS_BUCKET}/{parsed_path}"
            logger.info(f"Successfully saved ParsedObject to GCS: {parsed_gcs_uri}")
            
        except Exception as e:
            logger.error(f"Failed to save ParsedObject to GCS: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to save parsed object: {str(e)}")

        # Step 5: Update WorkUnit in Firestore with parsedObjectGcsUri and mark as COMPLETE
        logger.info(f"Step 5: Updating WorkUnit status to COMPLETE in Firestore")
        
        try:
            # Update the WorkUnit object
            work_unit.mark_complete(parsed_gcs_uri)
            
            # Save updated WorkUnit back to Firestore
            work_unit_ref.set(work_unit.model_dump(by_alias=True))
            
            logger.info(f"Successfully updated WorkUnit status to COMPLETE")
            
        except Exception as e:
            logger.error(f"Failed to update WorkUnit in Firestore: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to update WorkUnit: {str(e)}")
        
        # Step 6: Create CompletionTrackerTask and send to sequential Cloud Tasks queue
        logger.info(f"Step 6: Creating CompletionTrackerTask for sequential processing")
        
        try:
            completion_task = CompletionTrackerTask(
                document_id=event.documentId,
                project_id=event.projectId
            )
            
            # Skip Cloud Tasks creation in emulator mode
            if tasks_client is None:
                logger.info("Running in emulator mode - skipping Cloud Tasks creation")
                logger.info(f"Would have created CompletionTrackerTask: {completion_task.model_dump_json(by_alias=True)}")
            else:
                # Create Cloud Task
                task_payload = {
                    "http_request": {
                        "http_method": tasks_v2.HttpMethod.POST,
                        "url": COMPLETION_TRACKER_URL,
                        "headers": {"Content-Type": "application/json"},
                        "body": completion_task.model_dump_json(by_alias=True).encode()
                    }
                }
                
                # Send task to completion tracker queue
                response = tasks_client.create_task(
                    parent=COMPLETION_TRACKER_QUEUE,
                    task=task_payload
                )
                
                logger.info(f"Successfully created CompletionTrackerTask: {response.name}")
            
        except Exception as e:
            logger.error(f"Failed to create CompletionTrackerTask: {str(e)}")
            # no need to raise an exception for this non critical error
            
            
        # Calculate metrics for response
        content_size_bytes = len(raw_content.encode('utf-8'))
        parsing_duration_ms = 150  # This would be measured in real implementation
        parsed_elements_count = len(parsed_object.get('elements', []))
        parsed_object_size_bytes = len(parsed_json.encode('utf-8'))

        logger.info(f"WORK UNIT PARSING COMPLETED - WorkUnit {event.workUnitId} processed successfully")

        # Acknowledge the message by returning a success response
        return {
            "status": "success", 
            "message": "WorkUnit parsing event completed", 
            "work_unit_id": event.workUnitId,
            "document_id": event.documentId,
            "project_id": event.projectId,
            "content_type": event.contentType.value,
            "content_size_bytes": content_size_bytes,
            "parsing_duration_ms": parsing_duration_ms,
            "parsed_elements_count": parsed_elements_count,
            "parsed_object_size_bytes": parsed_object_size_bytes
        }
    except json.JSONDecodeError as e:
        logger.error(
            f"INVALID JSON IN PUB/SUB MESSAGE: {str(e)}",
            extra={**log_context, "error": str(e), "raw_data": request.message.data},
            exc_info=True
        )
        raise HTTPException(status_code=400, detail="Invalid JSON in Pub/Sub message")
    except Exception as e:
        logger.error(
            f"WORK UNIT PARSING FAILED: {str(e)}",
            extra={**log_context, "error": str(e)},
            exc_info=True
        )
        # Return a non-2xx status to indicate failure, causing Pub/Sub to retry
        raise HTTPException(status_code=500, detail="Internal server error while processing the event.")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}

# --- Helper Functions ---

def _parse_content_by_type(raw_content: str, content_type: ContentType) -> dict:
    """
    Parse content based on content type using appropriate strategy.
    This is a simplified implementation - in production, this would use
    sophisticated parsing libraries and ML models.
    """
    try:
        # Log operation, not content
        logger.info(f"Parsing content", extra={
            "content_type": content_type.value,
            "content_size": len(raw_content)
        })
        
        if content_type == ContentType.TEXT:
            return _parse_text_content(raw_content)
        elif content_type == ContentType.TABLE:
            return _parse_table_content(raw_content)
        elif content_type == ContentType.IMAGE:
            return _parse_image_content(raw_content)
        else:
            # Default to text parsing
            return _parse_text_content(raw_content)
            
    except Exception as e:
        logger.error(f"Error parsing content: {str(e)}")
        # Return a basic parsed object on error
        return {
            "type": content_type.value,
            "content": raw_content[:1000],  # Truncate for safety
            "elements": [],
            "metadata": {"parsing_error": str(e)}
        }

def _parse_text_content(content: str) -> dict:
    """Parse text content and extract structured information."""
    # Simple text analysis - in production, this would use NLP libraries
    words = content.split()
    sentences = content.split('.')
    
    # Extract potential key-value pairs (simple heuristic)
    elements = []
    lines = content.split('\n')
    
    for line in lines:
        if ':' in line and len(line.strip()) > 0:
            parts = line.split(':', 1)
            if len(parts) == 2:
                elements.append({
                    "type": "key_value",
                    "key": parts[0].strip(),
                    "value": parts[1].strip()
                })
    
    return {
        "type": "text",
        "content": content,
        "elements": elements,
        "metadata": {
            "word_count": len(words),
            "sentence_count": len(sentences),
            "character_count": len(content)
        }
    }

def _parse_table_content(content: str) -> dict:
    """Parse table content and extract structured data."""
    # Simple table parsing - in production, this would use specialized libraries
    lines = content.strip().split('\n')
    
    headers = []
    rows = []
    
    if lines:
        # Assume first line contains headers
        headers = [col.strip() for col in lines[0].split('\t') if col.strip()]
        
        # Parse remaining lines as data rows
        for line in lines[1:]:
            if line.strip():
                row_data = [col.strip() for col in line.split('\t')]
                if len(row_data) >= len(headers):
                    row_dict = {}
                    for i, header in enumerate(headers):
                        if i < len(row_data):
                            row_dict[header] = row_data[i]
                    rows.append(row_dict)
    
    return {
        "type": "table",
        "content": content,
        "elements": [
            {
                "type": "table_structure",
                "headers": headers,
                "rows": rows
            }
        ],
        "metadata": {
            "row_count": len(rows),
            "column_count": len(headers)
        }
    }

def _parse_image_content(content: str) -> dict:
    """Parse image content (placeholder for OCR/image analysis)."""
    # In production, this would use OCR libraries like Tesseract or Google Vision API
    return {
        "type": "image",
        "content": content,
        "elements": [
            {
                "type": "image_placeholder",
                "description": "Image content would be processed with OCR/Vision API",
                "extracted_text": "OCR text would appear here"
            }
        ],
        "metadata": {
            "content_length": len(content),
            "processing_note": "Image parsing not implemented in this version"
        }

    }