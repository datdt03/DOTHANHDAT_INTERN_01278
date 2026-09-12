-- RepairFlow migration 0003: evidence, diagnosis and immutable quote data.

CREATE TABLE repair_evidence (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    repair_order_id uuid NOT NULL,
    stage varchar(24) NOT NULL,
    object_key varchar(512) NOT NULL,
    file_url text,
    file_name varchar(255) NOT NULL,
    mime_type varchar(120) NOT NULL,
    file_size bigint NOT NULL,
    checksum varchar(128) NOT NULL,
    description text,
    captured_by uuid NOT NULL,
    captured_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_repair_evidence_order
        FOREIGN KEY (repair_order_id) REFERENCES repair_orders (id) ON DELETE RESTRICT,
    CONSTRAINT fk_repair_evidence_captured_by
        FOREIGN KEY (captured_by) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT ck_repair_evidence_stage
        CHECK (stage IN ('before_repair', 'diagnosis', 'after_repair', 'handover')),
    CONSTRAINT ck_repair_evidence_file_size_positive CHECK (file_size > 0)
);

CREATE TABLE diagnoses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    repair_order_id uuid NOT NULL,
    findings text NOT NULL,
    cause text,
    recommendation text NOT NULL,
    estimated_duration integer,
    diagnosed_by uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_diagnoses_order
        FOREIGN KEY (repair_order_id) REFERENCES repair_orders (id) ON DELETE RESTRICT,
    CONSTRAINT fk_diagnoses_diagnosed_by
        FOREIGN KEY (diagnosed_by) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT ck_diagnoses_findings_not_blank CHECK (char_length(trim(findings)) > 0),
    CONSTRAINT ck_diagnoses_recommendation_not_blank
        CHECK (char_length(trim(recommendation)) > 0),
    CONSTRAINT ck_diagnoses_duration_non_negative
        CHECK (estimated_duration IS NULL OR estimated_duration >= 0)
);

CREATE TABLE quotes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    repair_order_id uuid NOT NULL,
    version integer NOT NULL,
    status varchar(24) NOT NULL DEFAULT 'draft',
    currency char(3) NOT NULL DEFAULT 'VND',
    subtotal numeric(14, 2) NOT NULL DEFAULT 0,
    total numeric(14, 2) NOT NULL DEFAULT 0,
    note text,
    created_by uuid NOT NULL,
    sent_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_quotes_order
        FOREIGN KEY (repair_order_id) REFERENCES repair_orders (id) ON DELETE RESTRICT,
    CONSTRAINT fk_quotes_created_by
        FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT ck_quotes_version_positive CHECK (version >= 1),
    CONSTRAINT ck_quotes_status CHECK (
        status IN ('draft', 'sent', 'approved', 'rejected', 'superseded', 'expired', 'cancelled')
    ),
    CONSTRAINT ck_quotes_currency_vnd CHECK (currency = 'VND'),
    CONSTRAINT ck_quotes_subtotal_non_negative CHECK (subtotal >= 0),
    CONSTRAINT ck_quotes_total_non_negative CHECK (total >= 0)
);

CREATE TABLE quote_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id uuid NOT NULL,
    item_type varchar(16) NOT NULL,
    description varchar(500) NOT NULL,
    quantity numeric(12, 2) NOT NULL DEFAULT 1,
    unit_price numeric(14, 2) NOT NULL DEFAULT 0,
    line_total numeric(14, 2) NOT NULL,
    replacement_reason text,
    estimated_duration integer,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_quote_items_quote
        FOREIGN KEY (quote_id) REFERENCES quotes (id) ON DELETE RESTRICT,
    CONSTRAINT ck_quote_items_type CHECK (item_type IN ('part', 'labor', 'service')),
    CONSTRAINT ck_quote_items_description_not_blank
        CHECK (char_length(trim(description)) > 0),
    CONSTRAINT ck_quote_items_quantity_positive CHECK (quantity > 0),
    CONSTRAINT ck_quote_items_unit_price_non_negative CHECK (unit_price >= 0),
    CONSTRAINT ck_quote_items_line_total_non_negative CHECK (line_total >= 0),
    CONSTRAINT ck_quote_items_sort_order_non_negative CHECK (sort_order >= 0),
    CONSTRAINT ck_quote_items_duration_non_negative
        CHECK (estimated_duration IS NULL OR estimated_duration >= 0)
);
