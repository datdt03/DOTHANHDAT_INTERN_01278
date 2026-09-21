-- migration_id: 20260921_0007
-- spec: docs/v0/05-database-requirements.md
-- section: 5.8, 5.18
-- purpose: Create private before-repair evidence metadata and per-item lock state
-- depends_on: 20260921_0006

ALTER TABLE repair_order_items
    ADD COLUMN IF NOT EXISTS evidence_locked_at timestamptz;

ALTER TABLE repair_order_items
    ADD COLUMN IF NOT EXISTS evidence_locked_by uuid REFERENCES users(id) ON DELETE RESTRICT;

CREATE TABLE IF NOT EXISTS repair_evidence (
    id uuid PRIMARY KEY,
    workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
    repair_order_item_id uuid NOT NULL REFERENCES repair_order_items(id) ON DELETE RESTRICT,
    stage varchar(32) NOT NULL,
    object_key text NOT NULL,
    original_filename varchar(255) NOT NULL,
    mime_type varchar(64) NOT NULL,
    size_bytes bigint NOT NULL,
    checksum varchar(64) NOT NULL,
    idempotency_key varchar(128) NOT NULL,
    created_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    deleted_by uuid REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT repair_evidence_stage_check
        CHECK (stage = 'before_repair'),
    CONSTRAINT repair_evidence_size_check
        CHECK (size_bytes > 0 AND size_bytes <= 1048576),
    CONSTRAINT repair_evidence_checksum_check
        CHECK (checksum ~ '^[0-9a-f]{64}$'),
    CONSTRAINT repair_evidence_deleted_fields_check
        CHECK ((deleted_at IS NULL AND deleted_by IS NULL) OR deleted_at IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS repair_evidence_active_checksum_unique
    ON repair_evidence (repair_order_item_id, stage, checksum)
    WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS repair_evidence_active_idempotency_unique
    ON repair_evidence (workspace_id, repair_order_item_id, stage, idempotency_key)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS repair_evidence_item_created_idx
    ON repair_evidence (workspace_id, repair_order_item_id, created_at, id)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS repair_evidence_object_cleanup_idx
    ON repair_evidence (deleted_at, id)
    WHERE deleted_at IS NOT NULL;
