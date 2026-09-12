-- RepairFlow migration 0002: customers, devices, repair orders and assignments.

CREATE TABLE customers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL,
    name varchar(160) NOT NULL,
    phone varchar(32) NOT NULL,
    email varchar(320),
    note text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_customers_workspace
        FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE RESTRICT,
    CONSTRAINT ck_customers_name_not_blank CHECK (char_length(trim(name)) > 0),
    CONSTRAINT ck_customers_phone_not_blank CHECK (char_length(trim(phone)) > 0)
);

CREATE TABLE devices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    device_type varchar(32) NOT NULL,
    brand varchar(80) NOT NULL,
    model varchar(120) NOT NULL,
    serial_number varchar(160),
    device_identifier varchar(160),
    note text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_devices_workspace
        FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE RESTRICT,
    CONSTRAINT fk_devices_customer
        FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE RESTRICT,
    CONSTRAINT ck_devices_type_not_blank CHECK (char_length(trim(device_type)) > 0),
    CONSTRAINT ck_devices_brand_not_blank CHECK (char_length(trim(brand)) > 0),
    CONSTRAINT ck_devices_model_not_blank CHECK (char_length(trim(model)) > 0)
);

CREATE TABLE repair_orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL,
    order_code varchar(32) NOT NULL,
    customer_id uuid NOT NULL,
    device_id uuid NOT NULL,
    status varchar(32) NOT NULL DEFAULT 'received',
    customer_description text NOT NULL,
    internal_note text,
    received_at timestamptz NOT NULL DEFAULT now(),
    expected_completed_at timestamptz,
    completed_at timestamptz,
    created_by uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_repair_orders_workspace
        FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE RESTRICT,
    CONSTRAINT fk_repair_orders_customer
        FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE RESTRICT,
    CONSTRAINT fk_repair_orders_device
        FOREIGN KEY (device_id) REFERENCES devices (id) ON DELETE RESTRICT,
    CONSTRAINT fk_repair_orders_created_by
        FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT ck_repair_orders_status CHECK (
        status IN (
            'received', 'diagnosing', 'waiting_for_approval', 'approved',
            'repairing', 'quality_check', 'ready_for_pickup', 'handed_over',
            'warranty_active', 'rejected', 'cancelled'
        )
    ),
    CONSTRAINT ck_repair_orders_code_not_blank CHECK (char_length(trim(order_code)) > 0),
    CONSTRAINT ck_repair_orders_description_not_blank
        CHECK (char_length(trim(customer_description)) > 0)
);

CREATE TABLE repair_order_staff (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    repair_order_id uuid NOT NULL,
    user_id uuid NOT NULL,
    responsibility varchar(32) NOT NULL,
    is_primary boolean NOT NULL DEFAULT false,
    assigned_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz,
    note text,
    CONSTRAINT fk_repair_order_staff_order
        FOREIGN KEY (repair_order_id) REFERENCES repair_orders (id) ON DELETE RESTRICT,
    CONSTRAINT fk_repair_order_staff_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT uq_repair_order_staff_assignment
        UNIQUE (repair_order_id, user_id, responsibility),
    CONSTRAINT ck_repair_order_staff_responsibility CHECK (
        responsibility IN ('intake', 'diagnosis', 'primary_technician', 'repairer', 'quality_checker', 'handover')
    )
);
