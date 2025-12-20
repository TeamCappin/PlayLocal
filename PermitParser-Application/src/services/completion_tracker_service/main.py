import logging
import json
from fastapi import FastAPI, HTTPException
from src.models.CloudTask.task_models import CompletionTrackerTask
from src.models.StructureRoot.structure_root import StructureRoot
from src.models.Events.document_events import DocumentCompleteEvent
from google.cloud import firestore
from google.cloud import pubsub_v1
from .config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Google Cloud clients
firestore_client = firestore.Client(project=settings.gcp_project_id)
publisher = pubsub_v1.PublisherClient()

# Pub/Sub topic for DocumentCompleteEvent
DOCUMENT_COMPLETE_TOPIC = f"projects/{settings.gcp_project_id}/topics/document-complete-events"

app = FastAPI(
    title="Completion Tracker Service",
    description="Tracks the completion of work units for a document.",
    version="0.1.0"
)

# --- Endpoints ---

@app.post("/track-completion")
async def track_completion(task: CompletionTrackerTask):
    """
    Endpoint to receive a CompletionTrackerTask from a sequential Cloud Tasks queue.
    This atomically updates the document's completion status.
    """
    # Create structured logging context
    log_context = {
        "service": "completion_tracker_service",
        "operation": "track_completion",
        "document_id": str(task.document_id),
        "project_id": task.project_id,
        "gcp_project": settings.gcp_project_id
    }
    
    try:
        logger.info("COMPLETION TRACKING TASK RECEIVED", extra=log_context)
        logger.info(f"Received completion task for document: {task.document_id} in project '{settings.gcp_project_id}'")
        logger.info(f"Task details: {task.model_dump_json(by_alias=True)}")
        # Step 1: Read StructureRoot document from Firestore
        logger.info(f"Step 1: Reading StructureRoot from Firestore for document {task.document_id}")
        
        try:
            structure_root_ref = firestore_client.collection('structure_roots').document(str(task.document_id))
            structure_root_snapshot = structure_root_ref.get()
            
            if not structure_root_snapshot.exists:
                raise HTTPException(status_code=404, detail=f"StructureRoot {task.document_id} not found in Firestore")
            
            logger.info(f"Successfully retrieved StructureRoot from Firestore")
            
        except Exception as e:
            logger.error(f"Failed to read StructureRoot from Firestore: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to access StructureRoot: {str(e)}")

        # Step 2: Atomically increment completedWorkUnits counter
        logger.info(f"Step 2: Performing atomic increment of completedWorkUnits counter")
        
        try:
            # Use Firestore's atomic increment operation to safely update the counter
            structure_root_ref.update({
                'completedWorkUnits': firestore.Increment(1)
            })
            
            logger.info(f"Successfully incremented completedWorkUnits counter")
            
        except Exception as e:
            logger.error(f"Failed to increment completedWorkUnits: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to update completion counter: {str(e)}")

        # Step 3: Check if document processing is complete
        logger.info(f"Step 3: Checking completion status after increment")
        
        try:
            # Get updated StructureRoot to check completion status
            updated_snapshot = structure_root_ref.get()
            updated_data = updated_snapshot.to_dict()
            updated_structure_root = StructureRoot(**updated_data)
            
            completed_work_units = updated_structure_root.completedWorkUnits
            total_work_units = updated_structure_root.workUnitCount
            
            logger.info(f"Completion status: {completed_work_units}/{total_work_units} work units completed")
            
            # Check if all work units are completed
            if completed_work_units >= total_work_units:
                logger.info("DOCUMENT PROCESSING COMPLETE - All work units finished")
                
                # Step 4: Publish DocumentCompleteEvent to Pub/Sub
                logger.info(f"Step 4: Publishing DocumentCompleteEvent for project {task.project_id}")
                
                try:
                    # Create DocumentCompleteEvent
                    complete_event = DocumentCompleteEvent(
                        document_id=task.document_id,
                        project_id=task.project_id,
                        municipality=updated_structure_root.municipality,
                        work_unit_count=total_work_units
                    )
                    
                    # Publish to Pub/Sub
                    message_data = json.dumps(complete_event.model_dump(by_alias=True)).encode('utf-8')
                    future = publisher.publish(DOCUMENT_COMPLETE_TOPIC, message_data)
                    future.result()  # Wait for publish to complete
                    
                    logger.info(f"Successfully published DocumentCompleteEvent for document {task.document_id}")
                    
                except Exception as e:
                    logger.error(f"Failed to publish DocumentCompleteEvent: {str(e)}")
                    # Don't raise exception as the completion tracking was successful
                    
            else:
                logger.info(f"Document processing in progress - {completed_work_units}/{total_work_units} work units completed")
                
        except Exception as e:
            logger.error(f"Failed to check completion status: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to check completion status: {str(e)}")

        logger.info(f"COMPLETION TRACKING COMPLETED - Document {task.document_id} status updated")

        return {
            "status": "success", 
            "message": "Completion tracking task processed", 
            "document_id": str(task.document_id),
            "project_id": task.project_id,
            "completed_units": completed_work_units,
            "total_units": total_work_units,
            "is_complete": completed_work_units >= total_work_units
        }
    except Exception as e:
        logger.error(
            f"Error processing completion task for document {task.document_id}: {str(e)}",
            extra={**log_context, "error": str(e)},
            exc_info=True
        )
        raise HTTPException(
            status_code=500, 
            detail=f"Internal server error while processing completion task for document {task.document_id}"
        )

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}