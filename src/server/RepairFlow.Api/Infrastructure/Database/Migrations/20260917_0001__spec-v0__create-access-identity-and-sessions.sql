-- migration_id: 20260917_0001
-- spec: docs/v0/05-database-requirements.md
-- section: 5.1, 5.2, 5.3, access module
-- purpose: Create workspace identity, provisioned access principals, sessions and access audit storage
-- depends_on: none

CREATE TABLE workspaces (
    id uuid PRIMARY KEY,
    name varchar(160) NOT NULL,
    phone varchar(32),
    address text,
    timezone varchar(64) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
    id uuid PRIMARY KEY,
    name varchar(160) NOT NULL,
    email varchar(320),
    phone varchar(32),
    status varchar(16) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive', 'locked')),
    last_login_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE workspace_memberships (
    id uuid PRIMARY KEY,
    workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    role varchar(24) NOT NULL
        CHECK (role IN ('owner', 'admin', 'manager', 'receptionist', 'technician')),
    status varchar(16) NOT NULL DEFAULT 'invited'
        CHECK (status IN ('invited', 'active', 'suspended', 'removed')),
    invited_at timestamptz,
    joined_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT workspace_memberships_workspace_user_unique UNIQUE (workspace_id, user_id)
);

CREATE TABLE access_principals (
    id uuid PRIMARY KEY,
    staff_profile_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    email varchar(320) NOT NULL,
    credential_hash varchar(512) NOT NULL,
    status varchar(16) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive', 'locked')),
    last_login_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE access_sessions (
    id uuid PRIMARY KEY,
    principal_id uuid NOT NULL REFERENCES access_principals(id) ON DELETE RESTRICT,
    staff_profile_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
    token_hash char(64) NOT NULL UNIQUE,
    issued_at timestamptz NOT NULL,
    last_accessed_at timestamptz NOT NULL,
    absolute_expires_at timestamptz NOT NULL,
    revoked_at timestamptz,
    revoke_reason varchar(128),
    ip_hash varchar(128),
    user_agent text,
    CONSTRAINT access_sessions_workspace_membership_fk
        FOREIGN KEY (workspace_id, staff_profile_id)
        REFERENCES workspace_memberships(workspace_id, user_id)
        ON DELETE RESTRICT
);

CREATE TABLE audit_logs (
    id uuid PRIMARY KEY,
    workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
    user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    actor_type varchar(16) NOT NULL
        CHECK (actor_type IN ('employee', 'customer', 'system')),
    entity_type varchar(64) NOT NULL,
    entity_id uuid NOT NULL,
    action varchar(64) NOT NULL,
    metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
    ip_hash varchar(128),
    user_agent text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX access_principals_email_unique
    ON access_principals (lower(email));

CREATE INDEX access_sessions_principal_idx
    ON access_sessions (principal_id, workspace_id);

CREATE INDEX access_sessions_expiry_idx
    ON access_sessions (absolute_expires_at, revoked_at);

CREATE INDEX audit_logs_access_idx
    ON audit_logs (workspace_id, entity_type, entity_id, created_at);
