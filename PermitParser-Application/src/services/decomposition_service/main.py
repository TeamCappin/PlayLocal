import logging
import json
from uuid import UUID
from src.models.CloudTask.task_models import DocumentProcessingTask
from src.models.RawDocument.raw_document import RawDocument
from src.models.StructureRoot.structure_root import StructureRoot
from src.models.StructureNode.structure_node import StructureNode
from src.models.WorkUnit.work_unit import WorkUnit
from src.models.WorkUnit.events import WorkUnitCreatedEvent
from src.models.WorkUnit.enums import ContentType
from google.cloud import firestore
from google.cloud import storage
from google.cloud import pubsub_v1
from fastapi import FastAPI, HTTPException
from .config import settings
from .relevance_filter import get_relevance_filter, FilterConfigError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Google Cloud clients
firestore_client = firestore.Client(project=settings.gcp_project_id)
gcs_client = storage.Client(project=settings.gcp_project_id)
publisher = pubsub_v1.PublisherClient()

# GCS bucket names based on Terraform infrastructure
ENVIRONMENT = settings.environment  # This should come from environment variable in production
RAW_DOCUMENTS_BUCKET = f"{settings.gcp_project_id}-{ENVIRONMENT}-raw-documents"
RAW_WORK_UNITS_BUCKET = f"{settings.gcp_project_id}-{ENVIRONMENT}-raw-work-units"

# Pub/Sub topic name based on Terraform infrastructure
WORKUNIT_CREATED_TOPIC = f"projects/{settings.gcp_project_id}/topics/workunit-created-events"

app = FastAPI(
    title="Decomposition Service",
    description="Receives document processing tasks and begins decomposition.",
    version="0.1.0"
)

# Initialize relevance filter (loads configuration once)
try:
    relevance_filter = get_relevance_filter()
    logger.info("Relevance filter initialized successfully")
except FilterConfigError as e:
    logger.error(f"Failed to initialize relevance filter: {e}")
    raise  # Fail fast if configuration is invalid

# --- Endpoints ---

@app.post("/process-document")
async def process_document(task: DocumentProcessingTask):
    """
    Endpoint to receive a DocumentProcessingTask from Cloud Tasks.
    This triggers the document decomposition process.
    """
    # Create structured logging context
    log_context = {
        "service": "decomposition_service",
        "operation": "process_document",
        "document_id": str(task.document_id),
        "municipality": task.municipality,
        "task_id": task.task_id,
        "gcp_project": settings.gcp_project_id
    }
    
    try:
        logger.info("DECOMPOSITION TASK RECEIVED", extra=log_context)
        logger.info(f"Processing document {task.document_id} in {task.municipality}")
        logger.info(f"Task details: {task.model_dump_json(by_alias=True)}")

        # Check document relevance before expensive operations
        logger.info(f"Checking document relevance for {task.document_id}")
        
        try:
            # Run relevance filter
            filter_result = relevance_filter.check_relevance(
                document_id=task.document_id,
                municipality=task.municipality,
                firestore_client=firestore_client
            )
            
            # Log filter decision
            filter_log_context = {
                **log_context,
                "filter_result": filter_result.to_dict()
            }
            
            if not filter_result.is_relevant:
                # Document is not relevant - skip processing
                logger.info(
                    f"DOCUMENT SKIPPED - {filter_result.reason}",
                    extra=filter_log_context
                )
                
                # Return skipped response (HTTP 200 to prevent Cloud Tasks retry)
                return {
                    "status": "skipped",
                    "message": f"Document skipped due to: {filter_result.reason}",
                    "reason": filter_result.reason,
                    "document_id": str(task.document_id),
                    "project_id": task.project_id,
                    "municipality": task.municipality,
                    "matched_keywords": filter_result.matched_keywords,
                    "exclusion_matches": filter_result.exclusion_matches,
                    "construction_matches": filter_result.construction_matches
                }
            
            # Document is relevant - proceed with processing
            logger.info(
                f"DOCUMENT PASSED FILTER - {filter_result.reason}",
                extra=filter_log_context
            )
        
        except ValueError as e:
            # RawDocument not found (404 case)
            logger.error(f"RawDocument not found: {e}", extra=log_context)
            raise HTTPException(status_code=404, detail=str(e))
        
        except Exception as e:
            # Filter execution error - fail open (process document anyway)
            logger.error(
                f"Relevance filter error (failing open): {e}",
                extra=log_context,
                exc_info=True
            )
            # Continue processing despite filter error
        
        # Step 1: Read RawDocument from Firestore and download original document from GCS
        logger.info(f"Step 1: Reading RawDocument from Firestore and downloading original document from GCS for document {task.document_id}")
        
        try:
            # Get RawDocument from Firestore
            raw_doc_ref = firestore_client.collection('raw_documents').document(str(task.document_id))
            raw_doc_snapshot = raw_doc_ref.get()
            
            if not raw_doc_snapshot.exists:
                raise HTTPException(status_code=404, detail=f"RawDocument {task.document_id} not found in Firestore")
            
            raw_document_data = raw_doc_snapshot.to_dict()
            raw_document = RawDocument(**raw_document_data)
            
            # Download document content from GCS
            bucket = gcs_client.bucket(RAW_DOCUMENTS_BUCKET)
            blob = bucket.blob(raw_document.rawDataGcsUri.replace(f"gs://{RAW_DOCUMENTS_BUCKET}/", ""))
            document_content = blob.download_as_bytes()
            
            logger.info(f"Successfully downloaded document from GCS: {len(document_content)} bytes")
            
        except Exception as e:
            logger.error(f"Failed to read RawDocument or download from GCS: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to access document: {str(e)}")
        
        # Step 2: Analyze document structure and create StructureNodes
        logger.info(f"Step 2: Analyzing document structure and creating StructureNodes")
        
        # Simple document analysis - split into sections (this would be more sophisticated in real implementation)
        structure_nodes = []
        # During analysis, we'll determine which projects this document relates to
        sections, discovered_project_ids = _analyze_document_structure(document_content, task.document_id)
        
        # Define primary_project_id once before the loop, so it is always available
        primary_project_id = discovered_project_ids[0] if discovered_project_ids else "unknown-project"
        
        for section in sections:
            # Use the first discovered project ID for the StructureNode
            # In a real implementation, this might be more sophisticated
            node = StructureNode(
                documentId=str(task.document_id),
                projectId=primary_project_id,
                sectionType=section["type"],
                parentId=section.get("parent_id"),
                contentBounds=section["bounds"],
                municipality=task.municipality
            )
            structure_nodes.append(node)
            
            # Save StructureNode to Firestore
            firestore_client.collection('structure_nodes').document(str(node.id)).set(node.model_dump(by_alias=True))
        
        logger.info(f"Created {len(structure_nodes)} structure nodes")
        
        # Step 3: Extract content chunks and save to GCS raw work units bucket
        logger.info(f"Step 3: Extracting content chunks and saving to GCS")
        
        work_unit_chunks = []
        bucket = gcs_client.bucket(RAW_WORK_UNITS_BUCKET)
        
        for i, node in enumerate(structure_nodes):
            # Extract content chunk based on bounds
            chunk_content = _extract_content_chunk(document_content, node.contentBounds)
            
            # Create GCS path for the chunk using the primary project ID
            chunk_path = f"{primary_project_id}/{task.document_id}/chunk_{i+1}_{node.id}.txt"
            
            # Upload chunk to GCS
            blob = bucket.blob(chunk_path)
            blob.upload_from_string(chunk_content, content_type='text/plain')
            
            chunk_gcs_uri = f"gs://{RAW_WORK_UNITS_BUCKET}/{chunk_path}"
            work_unit_chunks.append((node, chunk_gcs_uri))
        
        logger.info(f"Uploaded {len(work_unit_chunks)} content chunks to GCS")
        
        # Step 4: Create WorkUnit documents in Firestore for each chunk
        logger.info(f"Step 4: Creating WorkUnit documents in Firestore")
        
        work_units = []
        for node, chunk_gcs_uri in work_unit_chunks:
            work_unit = WorkUnit(
                documentId=str(task.document_id),
                projectId=primary_project_id,
                structureNodeId=str(node.id),
                contentType=_determine_content_type(node.sectionType),
                rawContentGcsUri=chunk_gcs_uri,
                municipality=task.municipality
            )
            work_units.append(work_unit)
            
            # Save WorkUnit to Firestore
            firestore_client.collection('work_units').document(str(work_unit.id)).set(work_unit.model_dump(by_alias=True))
        
        logger.info(f"Created {len(work_units)} work units in Firestore")
        
        # Step 5: Create StructureRoot metadata document with workUnitCount
        logger.info(f"Step 5: Creating StructureRoot with total work unit count")
        
        structure_root = StructureRoot(
            document_id=str(task.document_id),
            project_ids=discovered_project_ids,
            root_node_id=str(structure_nodes[0].id) if structure_nodes else "root-node-1",
            work_unit_count=len(work_units),
            completed_work_units=0,
            municipality=task.municipality
        )
        
        # Save StructureRoot to Firestore
        firestore_client.collection('structure_roots').document(str(task.document_id)).set(structure_root.model_dump(by_alias=True))
        
        logger.info(f"Created StructureRoot with {len(work_units)} work units")
        
        # Step 6: Publish WorkUnitCreatedEvent messages to Pub/Sub
        logger.info(f"Step 6: Publishing WorkUnitCreatedEvent messages for parallel processing")
        
        events_published = 0
        for work_unit in work_units:
            event = WorkUnitCreatedEvent(
                documentId=str(task.document_id),
                projectId=primary_project_id,
                workUnitId=str(work_unit.id),
                contentType=work_unit.contentType,
                municipality=task.municipality
            )
            
            # Publish to Pub/Sub
            message_data = json.dumps(event.to_pubsub_dict()).encode('utf-8')
            future = publisher.publish(WORKUNIT_CREATED_TOPIC, message_data)
            future.result()  # Wait for publish to complete
            events_published += 1
        
        logger.info(f"Published {events_published} WorkUnitCreatedEvent messages to Pub/Sub")
        
        # Set actual results
        total_sections_found = len(sections)
        work_units_created = len(work_units)
        structure_nodes_created = len(structure_nodes)
        structure_root_created = True   
        
        logger.info(f"Decomposition results: {total_sections_found} sections analyzed, {structure_nodes_created} structure nodes created")
        logger.info(f"Created {work_units_created} work units and published {events_published} WorkUnitCreatedEvent messages")
        logger.info(f"StructureRoot document created with workUnitCount: {work_units_created}")
        logger.info(f"DECOMPOSITION COMPLETED - Document {task.document_id} ready for parsing")
        
        return {
            "status": "success",
            "message": "Document decomposition task completed",
            "document_id": str(task.document_id),
            "project_ids": discovered_project_ids,
            "municipality": task.municipality,
            "sections_found": total_sections_found,
            "work_units_created": work_units_created,
            "structure_nodes_created": structure_nodes_created,
            "events_published": events_published,
            "structure_root_created": structure_root_created
        }
    except Exception as e:
        logger.error(f"Error processing task for document {task.document_id}: {str(e)}",
            extra={**log_context, "error": str(e)}, 
            exc_info=True
            )    
        raise HTTPException(
            status_code=500, 
            detail=f"Internal server error while processing the task for document {task.document_id}."
            )

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}

# --- Helper Functions ---

def _analyze_document_structure(document_content: bytes, document_id: UUID) -> tuple[list, list[str]]:
    """
    Analyze document structure and return sections and discovered project IDs.
    This is a simplified implementation - in production, this would use
    sophisticated document analysis libraries and ML models to identify projects.
    """
    try:
        # Convert bytes to string for analysis
        content_str = document_content.decode('utf-8', errors='ignore')
        
        # Simple section detection based on content length
        # In production, this would use ML models, OCR, or document parsing libraries
        content_length = len(content_str)
        sections = []
        
        if content_length > 0:
            # Create sections based on content size
            chunk_size = max(1000, content_length // 5)  # Aim for ~5 sections
            
            for i in range(0, content_length, chunk_size):
                end_pos = min(i + chunk_size, content_length)
                section = {
                    "type": "text_section",
                    "bounds": {"start": i, "end": end_pos},
                    "parent_id": None
                }
                sections.append(section)
        
        # Ensure we have at least one section
        if not sections:
            sections = [{
                "type": "text_section", 
                "bounds": {"start": 0, "end": content_length},
                "parent_id": None
            }]
        
        # Placeholder project discovery logic
        # In production, this would use ML models to identify project references in the document
        discovered_project_ids = [f"project-{document_id}-1"]  # Placeholder: single project for now
        
        # TODO: Implement actual project discovery logic that can identify multiple projects
        # This might involve:
        # - OCR text analysis for project numbers/references
        # - Pattern matching for permit numbers
        # - ML classification models
        
        logger.info(f"Analyzed document structure: {len(sections)} sections found, {len(discovered_project_ids)} projects discovered")
        return sections, discovered_project_ids
        
    except Exception as e:
        logger.error(f"Error analyzing document structure: {str(e)}")
        # Return a default section and project if analysis fails
        default_sections = [{
            "type": "text_section",
            "bounds": {"start": 0, "end": len(document_content)},
            "parent_id": None
        }]
        default_project_ids = [f"project-{document_id}-fallback"]
        return default_sections, default_project_ids

def _extract_content_chunk(document_content: bytes, bounds: dict) -> str:
    """
    Extract content chunk based on bounds.
    """
    try:
        content_str = document_content.decode('utf-8', errors='ignore')
        start = bounds.get("start", 0)
        end = bounds.get("end", len(content_str))
        
        chunk = content_str[start:end]
        return chunk
        
    except Exception as e:
        logger.error(f"Error extracting content chunk: {str(e)}")
        return document_content.decode('utf-8', errors='ignore')

def _determine_content_type(section_type: str) -> ContentType:
    """
    Determine ContentType based on section type.
    This is a simplified mapping - in production, this would be more sophisticated.
    """
    type_mapping = {
        "text_section": ContentType.TEXT,
        "table_section": ContentType.TABLE,
        "image_section": ContentType.IMAGE,
        "diagram": ContentType.IMAGE
    }
    
    return type_mapping.get(section_type, ContentType.TEXT)