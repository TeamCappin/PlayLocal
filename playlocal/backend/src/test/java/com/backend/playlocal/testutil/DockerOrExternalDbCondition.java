package com.backend.playlocal.testutil;

import org.junit.jupiter.api.extension.ConditionEvaluationResult;
import org.junit.jupiter.api.extension.ExecutionCondition;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.testcontainers.DockerClientFactory;

/**
 * Enables tests only when Docker is available or an external DB is configured.
 */
public class DockerOrExternalDbCondition implements ExecutionCondition {

    @Override
    public ConditionEvaluationResult evaluateExecutionCondition(ExtensionContext context) {
        if (System.getenv("SPRING_DATASOURCE_URL") != null) {
            return ConditionEvaluationResult.enabled("SPRING_DATASOURCE_URL is configured");
        }

        boolean dockerAvailable;
        try {
            dockerAvailable = DockerClientFactory.instance().isDockerAvailable();
        } catch (Exception e) {
            dockerAvailable = false;
        }

        if (dockerAvailable) {
            return ConditionEvaluationResult.enabled("Docker is available");
        }

        return ConditionEvaluationResult.disabled("Docker not available and no external DB configured");
    }
}
