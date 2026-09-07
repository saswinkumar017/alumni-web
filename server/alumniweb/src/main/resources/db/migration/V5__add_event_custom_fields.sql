-- V5: event dynamic fields + admin import/search support
ALTER TABLE alumni_event ADD COLUMN custom_fields TEXT NULL;

-- composite index to speed admin directory filtering
CREATE INDEX idx_master_dept_batch ON master_alumni(department, batch);
