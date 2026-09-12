-- RepairFlow migration 0005: work logs, checklists, handover and warranty.

CREATE TABLE repair_work_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    repair_order_id uuid NOT NULL,
    technician_id uuid NOT NULL,
    summary text NOT NULL,
    started_at timestamptz,
    ended_at timestamptz,
    note text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_repair_work_logs_order
        FOREIGN KEY (repair_order_id) REFERENCES repair_orders (id) ON DELETE RESTRICT,
    CONSTRAINT fk_repair_work_logs_technician
        FOREIGN KEY (technician_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT ck_repair_work_logs_summary_not_blank
        CHECK (char_length(trim(summary)) > 0),
    CONSTRAINT ck_repair_work_logs_time_order
        CHECK (ended_at IS NULL OR started_at IS NULL OR ended_at >= started_at)
);

CREATE TABLE checklists (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    repair_order_id uuid NOT NULL,
    checklist_type varchar(24) NOT NULL,
    content_json jsonb NOT NULL DEFAULT '{}'::jsonb,
    completed_by uuid,
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_checklists_order
        FOREIGN KEY (repair_order_id) REFERENCES repair_orders (id) ON DELETE RESTRICT,
    CONSTRAINT fk_checklists_completed_by
        FOREIGN KEY (completed_by) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT ck_checklists_type
        CHECK (checklist_type IN ('intake', 'repair', 'quality_check', 'handover'))
);

CREATE TABLE handover_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    repair_order_id uuid NOT NULL,
    recipient_name varchar(160) NOT NULL,
    returned_accessories jsonb NOT NULL DEFAULT '[]'::jsonb,
    final_condition_note text NOT NULL,
    confirmed_at timestamptz NOT NULL DEFAULT now(),
    handed_over_by uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_handover_records_order
        FOREIGN KEY (repair_order_id) REFERENCES repair_orders (id) ON DELETE RESTRICT,
    CONSTRAINT fk_handover_records_handed_over_by
        FOREIGN KEY (handed_over_by) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT ck_handover_recipient_not_blank
        CHECK (char_length(trim(recipient_name)) > 0),
    CONSTRAINT ck_handover_condition_not_blank
        CHECK (char_length(trim(final_condition_note)) > 0)
);

CREATE TABLE warranties (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    repair_order_id uuid NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    warranty_terms text NOT NULL,
    status varchar(16) NOT NULL DEFAULT 'active',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_warranties_order
        FOREIGN KEY (repair_order_id) REFERENCES repair_orders (id) ON DELETE RESTRICT,
    CONSTRAINT ck_warranties_date_order CHECK (end_date >= start_date),
    CONSTRAINT ck_warranties_status CHECK (status IN ('active', 'expired', 'void')),
    CONSTRAINT ck_warranties_terms_not_blank
        CHECK (char_length(trim(warranty_terms)) > 0)
);
