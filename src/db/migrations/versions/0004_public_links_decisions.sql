-- RepairFlow migration 0004: public customer links and decisions.

CREATE TABLE customer_links (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    repair_order_id uuid NOT NULL,
    quote_id uuid,
    purpose varchar(24) NOT NULL,
    token_hash varchar(128) NOT NULL,
    expires_at timestamptz NOT NULL,
    last_accessed_at timestamptz,
    revoked_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_customer_links_order
        FOREIGN KEY (repair_order_id) REFERENCES repair_orders (id) ON DELETE RESTRICT,
    CONSTRAINT fk_customer_links_quote
        FOREIGN KEY (quote_id) REFERENCES quotes (id) ON DELETE RESTRICT,
    CONSTRAINT uq_customer_links_token_hash UNIQUE (token_hash),
    CONSTRAINT ck_customer_links_purpose
        CHECK (purpose IN ('quote_review', 'status_tracking')),
    CONSTRAINT ck_customer_links_quote_required_for_review
        CHECK (purpose = 'status_tracking' OR quote_id IS NOT NULL)
);

CREATE TABLE customer_decisions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id uuid NOT NULL,
    decision varchar(16) NOT NULL,
    customer_name varchar(160) NOT NULL,
    customer_contact_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
    note text,
    decided_at timestamptz NOT NULL DEFAULT now(),
    source_link_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_customer_decisions_quote
        FOREIGN KEY (quote_id) REFERENCES quotes (id) ON DELETE RESTRICT,
    CONSTRAINT fk_customer_decisions_source_link
        FOREIGN KEY (source_link_id) REFERENCES customer_links (id) ON DELETE RESTRICT,
    CONSTRAINT ck_customer_decisions_decision
        CHECK (decision IN ('approved', 'rejected')),
    CONSTRAINT ck_customer_decisions_name_not_blank
        CHECK (char_length(trim(customer_name)) > 0)
);
