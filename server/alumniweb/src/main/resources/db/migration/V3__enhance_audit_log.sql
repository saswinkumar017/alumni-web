-- V3: Enhance audit_log with category, log level, HTTP details, and performance tracking

ALTER TABLE audit_log
    ADD COLUMN category VARCHAR(20) NULL DEFAULT 'SYSTEM' AFTER request_id,
    ADD COLUMN log_level VARCHAR(20) NULL DEFAULT 'INFO' AFTER category,
    ADD COLUMN method VARCHAR(10) NULL AFTER log_level,
    ADD COLUMN endpoint VARCHAR(500) NULL AFTER method,
    ADD COLUMN status_code INT NULL AFTER endpoint,
    ADD COLUMN duration_ms BIGINT NULL AFTER status_code,
    ADD COLUMN request_params TEXT NULL AFTER duration_ms,
    ADD COLUMN response_summary VARCHAR(500) NULL AFTER request_params;

CREATE INDEX idx_audit_category ON audit_log(category);
CREATE INDEX idx_audit_log_level ON audit_log(log_level);
CREATE INDEX idx_audit_method ON audit_log(method);
CREATE INDEX idx_audit_status_code ON audit_log(status_code);
