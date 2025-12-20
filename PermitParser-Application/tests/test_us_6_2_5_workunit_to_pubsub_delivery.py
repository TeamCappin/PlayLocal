"""
Integration Test: WorkUnit Event Pub/Sub to Cloud Run Delivery

Tests end-to-end delivery of WorkUnitCreatedEvent messages from Pub/Sub
to Cloud Run. Publishes a test message and verifies it reaches the
parser-service.

Prerequisites:
- pip install google-cloud-pubsub
- Service account key: ../terraform/iam-service-account.json

Verification:
1. Run script — note the workUnitId "wu-test-001"
2. Check Cloud Run logs in GCP Console
3. Search for "wu-test-001" in the logs
4. Verify message content was received

Expected: Message published to Pub/Sub → delivered to Cloud Run →
appears in logs
"""

import os
import json
import pytest

# Safely import pubsub - skip if not available (e.g., in CI)
try:
    from google.cloud import pubsub_v1

    PUBSUB_AVAILABLE = True
except ImportError:
    PUBSUB_AVAILABLE = False
    pubsub_v1 = None


# Skip this test in CI - it requires GCP credentials and infrastructure
@pytest.mark.integration
@pytest.mark.skipif(
    not PUBSUB_AVAILABLE,
    reason="google-cloud-pubsub not installed (skipped in CI)",
)
@pytest.mark.skipif(
    not os.path.exists("../terraform/iam-service-account.json"),
    reason="Requires GCP service account credentials",
)
def test_publish_workunit_event_to_pubsub():
    """Integration test that publishes a message to Pub/Sub."""

    # Set up credentials
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = (
        "../terraform/iam-service-account.json"
    )

    publisher = pubsub_v1.PublisherClient()
    topic_name = (
        "projects/concordia-capstone2026/topics/workunit-created-events"
    )

    # Create a realistic WorkUnitCreatedEvent message
    # Note:
    # - contentType must be TEXT, TABLE, or IMAGE
    # - municipality and timestamp fields are required by models/workunit/events.py
    #   implementation but are not present in the parsing domain model
    workunit_event = {
        "documentId": "doc-test-456",
        "projectId": "proj-test-789",
        "workUnitId": "wu-test-001",
        "contentType": "TEXT",
        "municipality": "Montreal",
        "timestamp": "2025-01-15T17:00:00Z",
    }

    print("Publishing WorkUnitCreatedEvent to Pub/Sub...")
    print(f"Message: {json.dumps(workunit_event, indent=2)}")

    # Convert to JSON and publish
    message_data = json.dumps(workunit_event).encode(
        "utf-8"
    )  # pub/sub requires the message to be in UTF-8 format
    future = publisher.publish(
        topic_name, message_data
    )  # publish the message to the topic
    result = future.result()  # wait for the message to be published

    print(
        f"\nSUCCESS: Published message ID: {result}"
    )  # confirm the message was published
    print("Message sent to workunit-created-events topic")

    # Assert that message was published successfully
    assert result is not None, "Message should have been published successfully"

    # Check Cloud Run logs to see if ParserService received the message
    # If ParserService fails, check the dead letter topic for failed messages
