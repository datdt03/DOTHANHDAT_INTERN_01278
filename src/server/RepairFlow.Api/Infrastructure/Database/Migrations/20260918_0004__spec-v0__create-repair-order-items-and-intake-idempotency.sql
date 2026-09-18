-- migration_id: 20260918_0004
-- spec: docs/v0/05-database-requirements.md
-- section: 5.6, 5.7, 5.18, 10
-- purpose: Add repair-order item snapshots, encrypted credential metadata and intake idempotency
-- depends_on: 20260917_0003

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'repair_orders_workspace_id_id_unique'
    ) THEN
        ALTER TABLE repair_orders
            ADD CONSTRAINT repair_orders_workspace_id_id_unique UNIQUE (workspace_id, id);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS repair_order_items (
    id uuid PRIMARY KEY,
    workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
    repair_order_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    device_id uuid NOT NULL,
    item_index integer NOT NULL CHECK (item_index > 0),
    status varchar(32) NOT NULL DEFAULT 'received'
        CHECK (status IN (
            'received', 'diagnosing', 'waiting_for_approval', 'approved',
            'repairing', 'cancellation_requested', 'quality_check',
            'ready_for_pickup', 'handed_over', 'rejected',
            'ready_for_return', 'returned', 'cancelled'
        )),
    reported_issue text NOT NULL,
    handover_condition text,
    accessories text,
    item_notes text,
    credential_status varchar(32) NOT NULL DEFAULT 'not_required'
        CHECK (credential_status IN ('not_required', 'customer_unlocked_device', 'passcode_provided')),
    credential_ciphertext text,
    credential_key_version varchar(32),
    credential_consent boolean NOT NULL DEFAULT false,
    credential_received_at timestamptz,
    credential_expires_at timestamptz,
    credential_destroyed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT repair_order_items_order_index_unique UNIQUE (repair_order_id, item_index),
    CONSTRAINT repair_order_items_order_fk
        FOREIGN KEY (workspace_id, repair_order_id)
        REFERENCES repair_orders(workspace_id, id)
        ON DELETE RESTRICT,
    CONSTRAINT repair_order_items_customer_fk
        FOREIGN KEY (workspace_id, customer_id)
        REFERENCES customers(workspace_id, id)
        ON DELETE RESTRICT,
    CONSTRAINT repair_order_items_device_fk
        FOREIGN KEY (workspace_id, customer_id, device_id)
        REFERENCES devices(workspace_id, customer_id, id)
        ON DELETE RESTRICT,
    CONSTRAINT repair_order_items_issue_not_blank CHECK (length(btrim(reported_issue)) > 0),
    CONSTRAINT repair_order_items_credential_check CHECK (
        (credential_status = 'passcode_provided' AND
         credential_ciphertext IS NOT NULL AND
         credential_key_version IS NOT NULL AND
         credential_consent = true AND
         credential_received_at IS NOT NULL AND
         credential_expires_at IS NOT NULL)
        OR
        (credential_status <> 'passcode_provided' AND credential_ciphertext IS NULL)
    )
);

CREATE TABLE IF NOT EXISTS repair_order_intake_idempotency (
    workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
    idempotency_key varchar(128) NOT NULL,
    request_hash char(64) NOT NULL,
    repair_order_id uuid,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (workspace_id, idempotency_key),
    CONSTRAINT repair_order_intake_idempotency_order_fk
        FOREIGN KEY (workspace_id, repair_order_id)
        REFERENCES repair_orders(workspace_id, id)
        ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS devices_workspace_identifier_unique
    ON devices (workspace_id, device_identifier)
    WHERE device_identifier IS NOT NULL;

CREATE INDEX IF NOT EXISTS repair_order_items_order_idx
    ON repair_order_items (repair_order_id, item_index);

CREATE INDEX IF NOT EXISTS repair_order_items_device_idx
    ON repair_order_items (workspace_id, device_id, created_at DESC);

CREATE INDEX IF NOT EXISTS repair_order_items_customer_idx
    ON repair_order_items (workspace_id, customer_id, created_at DESC);

INSERT INTO repair_order_items (
    id, workspace_id, repair_order_id, customer_id, device_id, item_index,
    status, reported_issue, created_at)
SELECT
    gen_random_uuid(), ro.workspace_id, ro.id, ro.customer_id, ro.device_id, 1,
    ro.status, ro.customer_description, ro.created_at
FROM repair_orders ro
WHERE NOT EXISTS (
    SELECT 1
    FROM repair_order_items roi
    WHERE roi.repair_order_id = ro.id
);
