-- migration_id: 20260917_0003
-- spec: docs/v0/05-database-requirements.md
-- section: 5.4, 5.5, 5.6, 5.7, 5.18
-- purpose: Create the C2 customer, device, repair-order and initial timeline schema
-- depends_on: 20260917_0002

CREATE TABLE IF NOT EXISTS customers (
    id uuid PRIMARY KEY,
    workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
    name varchar(160) NOT NULL,
    phone varchar(32) NOT NULL,
    email varchar(320),
    note text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT customers_workspace_id_id_unique UNIQUE (workspace_id, id),
    CONSTRAINT customers_name_not_blank CHECK (length(btrim(name)) > 0),
    CONSTRAINT customers_phone_not_blank CHECK (length(btrim(phone)) > 0)
);

CREATE TABLE IF NOT EXISTS devices (
    id uuid PRIMARY KEY,
    workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
    customer_id uuid NOT NULL,
    device_type varchar(32) NOT NULL,
    brand varchar(80) NOT NULL,
    model varchar(120) NOT NULL,
    serial_number varchar(160),
    device_identifier varchar(160),
    note text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT devices_workspace_id_id_unique UNIQUE (workspace_id, id),
    CONSTRAINT devices_workspace_customer_id_unique UNIQUE (workspace_id, customer_id, id),
    CONSTRAINT devices_customer_fk
        FOREIGN KEY (workspace_id, customer_id)
        REFERENCES customers(workspace_id, id)
        ON DELETE RESTRICT,
    CONSTRAINT devices_type_not_blank CHECK (length(btrim(device_type)) > 0),
    CONSTRAINT devices_brand_not_blank CHECK (length(btrim(brand)) > 0),
    CONSTRAINT devices_model_not_blank CHECK (length(btrim(model)) > 0),
    CONSTRAINT devices_identifier_required CHECK (
        NULLIF(btrim(serial_number), '') IS NOT NULL OR
        NULLIF(btrim(device_identifier), '') IS NOT NULL
    )
);

CREATE TABLE IF NOT EXISTS repair_order_code_counters (
    workspace_id uuid PRIMARY KEY REFERENCES workspaces(id) ON DELETE RESTRICT,
    next_value bigint NOT NULL DEFAULT 1 CHECK (next_value > 0)
);

CREATE TABLE IF NOT EXISTS repair_orders (
    id uuid PRIMARY KEY,
    workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
    order_code varchar(32) NOT NULL,
    customer_id uuid NOT NULL,
    device_id uuid NOT NULL,
    status varchar(32) NOT NULL DEFAULT 'received'
        CHECK (status IN (
            'received', 'diagnosing', 'waiting_for_approval', 'approved',
            'repairing', 'cancellation_requested', 'quality_check',
            'ready_for_pickup', 'handed_over', 'rejected',
            'ready_for_return', 'returned', 'cancelled'
        )),
    customer_description text NOT NULL,
    internal_note text,
    received_at timestamptz NOT NULL DEFAULT now(),
    expected_completed_at timestamptz,
    completed_at timestamptz,
    cancelled_at timestamptz,
    cancellation_reason text,
    created_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT repair_orders_workspace_order_code_unique UNIQUE (workspace_id, order_code),
    CONSTRAINT repair_orders_customer_fk
        FOREIGN KEY (workspace_id, customer_id)
        REFERENCES customers(workspace_id, id)
        ON DELETE RESTRICT,
    CONSTRAINT repair_orders_device_fk
        FOREIGN KEY (workspace_id, customer_id, device_id)
        REFERENCES devices(workspace_id, customer_id, id)
        ON DELETE RESTRICT,
    CONSTRAINT repair_orders_description_not_blank CHECK (length(btrim(customer_description)) > 0),
    CONSTRAINT repair_orders_cancelled_fields_check CHECK (
        status <> 'cancelled' OR (
            cancelled_at IS NOT NULL AND
            NULLIF(btrim(cancellation_reason), '') IS NOT NULL
        )
    )
);

CREATE TABLE IF NOT EXISTS repair_order_staff (
    id uuid PRIMARY KEY,
    repair_order_id uuid NOT NULL REFERENCES repair_orders(id) ON DELETE RESTRICT,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    responsibility varchar(32) NOT NULL
        CHECK (responsibility IN (
            'intake', 'diagnosis', 'primary_technician',
            'repairer', 'quality_checker', 'handover'
        )),
    is_primary boolean NOT NULL DEFAULT false,
    assigned_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz,
    note text,
    CONSTRAINT repair_order_staff_unique UNIQUE (repair_order_id, user_id, responsibility)
);

CREATE TABLE IF NOT EXISTS status_history (
    id uuid PRIMARY KEY,
    repair_order_id uuid NOT NULL REFERENCES repair_orders(id) ON DELETE RESTRICT,
    from_status varchar(32),
    to_status varchar(32) NOT NULL,
    changed_by uuid REFERENCES users(id) ON DELETE SET NULL,
    reason text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT status_history_to_status_check CHECK (to_status IN (
        'received', 'diagnosing', 'waiting_for_approval', 'approved',
        'repairing', 'cancellation_requested', 'quality_check',
        'ready_for_pickup', 'handed_over', 'rejected',
        'ready_for_return', 'returned', 'cancelled'
    ))
);

CREATE UNIQUE INDEX IF NOT EXISTS repair_order_staff_one_primary_idx
    ON repair_order_staff (repair_order_id, responsibility)
    WHERE is_primary;

CREATE UNIQUE INDEX IF NOT EXISTS customers_workspace_phone_unique
    ON customers (workspace_id, phone);

CREATE UNIQUE INDEX IF NOT EXISTS devices_workspace_serial_unique
    ON devices (workspace_id, serial_number)
    WHERE serial_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS customers_workspace_name_idx
    ON customers (workspace_id, name);

CREATE INDEX IF NOT EXISTS customers_workspace_phone_idx
    ON customers (workspace_id, phone);

CREATE INDEX IF NOT EXISTS devices_workspace_customer_idx
    ON devices (workspace_id, customer_id);

CREATE INDEX IF NOT EXISTS devices_workspace_identifier_idx
    ON devices (workspace_id, device_identifier)
    WHERE device_identifier IS NOT NULL;

CREATE INDEX IF NOT EXISTS repair_orders_workspace_status_idx
    ON repair_orders (workspace_id, status, received_at DESC);

CREATE INDEX IF NOT EXISTS repair_orders_workspace_code_idx
    ON repair_orders (workspace_id, order_code);

CREATE INDEX IF NOT EXISTS repair_orders_customer_idx
    ON repair_orders (customer_id, received_at DESC);

CREATE INDEX IF NOT EXISTS repair_orders_device_idx
    ON repair_orders (device_id, received_at DESC);

CREATE INDEX IF NOT EXISTS repair_order_staff_user_order_idx
    ON repair_order_staff (user_id, repair_order_id);

CREATE INDEX IF NOT EXISTS repair_order_staff_order_responsibility_idx
    ON repair_order_staff (repair_order_id, responsibility);

CREATE INDEX IF NOT EXISTS status_history_order_created_idx
    ON status_history (repair_order_id, created_at);
