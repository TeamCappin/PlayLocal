-- V13: Add endorsement_id to report table and update single target constraint
ALTER TABLE report
ADD COLUMN endorsement_id UUID,
ADD CONSTRAINT fk_report_endorsement FOREIGN KEY (endorsement_id) REFERENCES endorsement(endorsement_id);

ALTER TABLE report
DROP CONSTRAINT ck_report_single_target;

ALTER TABLE report
ADD CONSTRAINT ck_report_single_target CHECK (
    (
        CASE WHEN reported_user_id IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN game_id IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN media_id IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN match_record_id IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN match_record_revision_id IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN endorsement_id IS NOT NULL THEN 1 ELSE 0 END
    ) = 1
);
