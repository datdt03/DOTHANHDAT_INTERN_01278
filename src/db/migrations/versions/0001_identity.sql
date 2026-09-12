-- RepairFlow migration 0001: workspace identity and memberships.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE workspaces (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(160) NOT NULL,
    phone varchar(32),
    address text,
    timezone varchar(64) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_workspaces_name_not_blank CHECK (char_length(trim(name)) > 0)
);

CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(160) NOT NULL,
    email varchar(320),
    phone varchar(32),
    status varchar(16) NOT NULL DEFAULT 'active',
    last_login_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_users_status CHECK (status IN ('active', 'inactive', 'locked')),
    CONSTRAINT ck_users_name_not_blank CHECK (char_length(trim(name)) > 0)
);

CREATE TABLE workspace_memberships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role varchar(24) NOT NULL,
    status varchar(16) NOT NULL DEFAULT 'invited',
    invited_at timestamptz,
    joined_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_workspace_memberships_workspace
        FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE RESTRICT,
    CONSTRAINT fk_workspace_memberships_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT uq_workspace_memberships_workspace_user UNIQUE (workspace_id, user_id),
    CONSTRAINT ck_workspace_memberships_role
        CHECK (role IN ('owner', 'admin', 'manager', 'receptionist', 'technician')),
    CONSTRAINT ck_workspace_memberships_status
        CHECK (status IN ('invited', 'active', 'suspended', 'removed'))
);
