-- migration_id: 20260917_0002
-- spec: docs/v0/05-database-requirements.md
-- section: access module, workspace memberships
-- purpose: Normalize membership roles and persist the active role for each session
-- depends_on: 20260917_0001

CREATE TABLE IF NOT EXISTS workspace_membership_roles (
    id uuid PRIMARY KEY,
    membership_id uuid NOT NULL REFERENCES workspace_memberships(id) ON DELETE CASCADE,
    role varchar(24) NOT NULL
        CHECK (role IN ('owner', 'manager', 'receptionist', 'technician')),
    is_default boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT workspace_membership_roles_membership_role_unique
        UNIQUE (membership_id, role)
);

CREATE UNIQUE INDEX IF NOT EXISTS workspace_membership_roles_one_default_idx
    ON workspace_membership_roles (membership_id)
    WHERE is_default;

INSERT INTO workspace_membership_roles (id, membership_id, role, is_default)
SELECT gen_random_uuid(), wm.id, wm.role, true
FROM workspace_memberships wm
WHERE wm.role IN ('owner', 'manager', 'receptionist', 'technician')
  AND NOT EXISTS (
      SELECT 1
      FROM workspace_membership_roles wmr
      WHERE wmr.membership_id = wm.id
        AND wmr.role = wm.role
  );

ALTER TABLE access_sessions
    ADD COLUMN IF NOT EXISTS active_role varchar(24);

UPDATE access_sessions s
SET active_role = COALESCE(
    (
        SELECT wmr.role
        FROM workspace_membership_roles wmr
        INNER JOIN workspace_memberships wm ON wm.id = wmr.membership_id
        WHERE wm.workspace_id = s.workspace_id
          AND wm.user_id = s.staff_profile_id
        ORDER BY wmr.is_default DESC, wmr.created_at
        LIMIT 1
    ),
    (
        SELECT wm.role
        FROM workspace_memberships wm
        WHERE wm.workspace_id = s.workspace_id
          AND wm.user_id = s.staff_profile_id
        LIMIT 1
    )
)
WHERE s.active_role IS NULL;

ALTER TABLE access_sessions
    ALTER COLUMN active_role SET NOT NULL;

ALTER TABLE access_sessions
    ADD CONSTRAINT access_sessions_active_role_check
        CHECK (active_role IN ('owner', 'manager', 'receptionist', 'technician'));
