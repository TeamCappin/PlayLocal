package com.backend.playlocal.testutil;

import org.junit.jupiter.api.extension.ConditionEvaluationResult;
import org.junit.jupiter.api.extension.ExecutionCondition;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.testcontainers.DockerClientFactory;

/**
 * Enables tests only when Docker is available or an external DB is configured.
 */
public class DockerOrExternalDbCondition implements ExecutionCondition {

    private static boolean hasExternalDb() {
        String springDatasourceUrl = System.getenv("SPRING_DATASOURCE_URL");
        String databaseUrl = System.getenv("DATABASE_URL");
        return (springDatasourceUrl != null && !springDatasourceUrl.isBlank())
                || (databaseUrl != null && !databaseUrl.isBlank());
    }

    @Override
    public ConditionEvaluationResult evaluateExecutionCondition(ExtensionContext context) {
        if (hasExternalDb()) {
            return ConditionEvaluationResult.enabled("External datasource is configured");
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
