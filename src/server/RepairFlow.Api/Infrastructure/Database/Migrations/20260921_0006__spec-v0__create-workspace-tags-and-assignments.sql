-- migration_id: 20260921_0006
-- spec: docs/v0/05-database-requirements.md
-- section: 5.6, 5.7, 5.18
-- purpose: Create workspace tag catalog and repair-item tag assignments
-- depends_on: 20260918_0005

CREATE TABLE IF NOT EXISTS workspace_tags (
    id uuid PRIMARY KEY,
    workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
    name text NOT NULL,
    normalized_name text NOT NULL,
    created_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT workspace_tags_workspace_normalized_unique
        UNIQUE (workspace_id, normalized_name),
    CONSTRAINT workspace_tags_name_not_blank
        CHECK (length(btrim(name)) BETWEEN 1 AND 64),
    CONSTRAINT workspace_tags_normalized_name_not_blank
        CHECK (length(btrim(normalized_name)) > 0)
);

CREATE TABLE IF NOT EXISTS repair_order_item_tags (
    repair_order_item_id uuid NOT NULL
        REFERENCES repair_order_items(id) ON DELETE RESTRICT,
    tag_id uuid NOT NULL
        REFERENCES workspace_tags(id) ON DELETE RESTRICT,
    created_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (repair_order_item_id, tag_id)
);

CREATE INDEX IF NOT EXISTS workspace_tags_workspace_normalized_idx
    ON workspace_tags (workspace_id, normalized_name, id);

CREATE INDEX IF NOT EXISTS repair_order_item_tags_tag_idx
    ON repair_order_item_tags (tag_id, repair_order_item_id);
