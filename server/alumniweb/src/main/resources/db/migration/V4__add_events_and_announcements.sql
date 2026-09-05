-- V4: Add events and announcements (public content) tables
-- "event" is a MySQL reserved word, so the table is named alumni_event.

-- 1. alumni_event
CREATE TABLE alumni_event (
    id BIGINT NOT NULL AUTO_INCREMENT,
    slug VARCHAR(150) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    venue VARCHAR(255) NULL,
    event_date DATETIME(6) NOT NULL,
    cover_image_url VARCHAR(500) NULL,
    status ENUM('DRAFT','PUBLISHED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
    max_attendees INT NULL,
    created_by BIGINT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE INDEX uq_event_slug (slug),
    INDEX idx_event_status_date (status, event_date),
    CONSTRAINT fk_event_creator FOREIGN KEY (created_by) REFERENCES user_account(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. announcement
CREATE TABLE announcement (
    id BIGINT NOT NULL AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    author_name VARCHAR(200) NOT NULL,
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    tags VARCHAR(500) NULL,
    created_by BIGINT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_announcement_active_created (is_active, created_at),
    CONSTRAINT fk_announcement_creator FOREIGN KEY (created_by) REFERENCES user_account(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
