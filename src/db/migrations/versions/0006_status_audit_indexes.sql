-- RepairFlow migration 0006: status/audit history and query indexes.

CREATE TABLE status_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    repair_order_id uuid NOT NULL,
    from_status varchar(32),
    to_status varchar(32) NOT NULL,
    changed_by uuid,
    reason text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_status_history_order
        FOREIGN KEY (repair_order_id) REFERENCES repair_orders (id) ON DELETE RESTRICT,
    CONSTRAINT fk_status_history_changed_by
        FOREIGN KEY (changed_by) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT ck_status_history_to_status CHECK (
        to_status IN (
            'received', 'diagnosing', 'waiting_for_approval', 'approved',
            'repairing', 'quality_check', 'ready_for_pickup', 'handed_over',
            'warranty_active', 'rejected', 'cancelled'
        )
    )
);

CREATE TABLE audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL,
    user_id uuid,
    actor_type varchar(16) NOT NULL,
    entity_type varchar(64) NOT NULL,
    entity_id uuid NOT NULL,
    action varchar(64) NOT NULL,
    metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
    ip_hash varchar(128),
    user_agent text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_audit_logs_workspace
        FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE RESTRICT,
    CONSTRAINT fk_audit_logs_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT ck_audit_logs_actor_type
        CHECK (actor_type IN ('employee', 'customer', 'system')),
    CONSTRAINT ck_audit_logs_entity_type_not_blank
        CHECK (char_length(trim(entity_type)) > 0),
    CONSTRAINT ck_audit_logs_action_not_blank
        CHECK (char_length(trim(action)) > 0)
);

CREATE UNIQUE INDEX uq_repair_orders_workspace_order_code
    ON repair_orders (workspace_id, order_code);
CREATE UNIQUE INDEX uq_devices_workspace_serial_number
    ON devices (workspace_id, serial_number)
    WHERE serial_number IS NOT NULL;
CREATE UNIQUE INDEX uq_repair_order_staff_primary_responsibility
    ON repair_order_staff (repair_order_id, responsibility)
    WHERE is_primary = true;
CREATE UNIQUE INDEX uq_quotes_repair_order_version
    ON quotes (repair_order_id, version);
CREATE UNIQUE INDEX uq_quotes_current_draft_or_sent
    ON quotes (repair_order_id)
    WHERE status IN ('draft', 'sent');
CREATE UNIQUE INDEX uq_customer_decisions_quote
    ON customer_decisions (quote_id);
CREATE UNIQUE INDEX uq_handover_records_repair_order
    ON handover_records (repair_order_id);
CREATE UNIQUE INDEX uq_warranties_repair_order
    ON warranties (repair_order_id);

CREATE INDEX ix_repair_orders_workspace_status
    ON repair_orders (workspace_id, status);
CREATE INDEX ix_repair_orders_workspace_expected_completed
    ON repair_orders (workspace_id, expected_completed_at);
CREATE INDEX ix_repair_orders_customer ON repair_orders (customer_id);
CREATE INDEX ix_repair_orders_device ON repair_orders (device_id);
CREATE INDEX ix_customers_workspace_phone ON customers (workspace_id, phone);
CREATE INDEX ix_repair_order_staff_user_order
    ON repair_order_staff (user_id, repair_order_id);
CREATE INDEX ix_repair_order_staff_order_responsibility
    ON repair_order_staff (repair_order_id, responsibility);
CREATE INDEX ix_repair_evidence_order_stage_captured
    ON repair_evidence (repair_order_id, stage, captured_at);
CREATE INDEX ix_diagnoses_order_created
    ON diagnoses (repair_order_id, created_at);
CREATE INDEX ix_quote_items_quote_sort
    ON quote_items (quote_id, sort_order);
CREATE INDEX ix_customer_decisions_quote_decided
    ON customer_decisions (quote_id, decided_at);
CREATE INDEX ix_customer_links_token_hash ON customer_links (token_hash);
CREATE INDEX ix_customer_links_order_expiry
    ON customer_links (repair_order_id, expires_at);
CREATE INDEX ix_repair_work_logs_order_started
    ON repair_work_logs (repair_order_id, started_at);
CREATE INDEX ix_checklists_order_type
    ON checklists (repair_order_id, checklist_type);
CREATE INDEX ix_status_history_order_created
    ON status_history (repair_order_id, created_at);
CREATE INDEX ix_warranties_end_status
    ON warranties (end_date, status);
CREATE INDEX ix_audit_logs_workspace_entity_created
    ON audit_logs (workspace_id, entity_type, entity_id, created_at);
