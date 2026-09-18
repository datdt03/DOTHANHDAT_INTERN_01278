-- migration_id: 20260918_0005
-- spec: docs/v0/05-database-requirements.md
-- section: 10
-- purpose: Allow repair-item credentials to be destroyed without retaining ciphertext
-- depends_on: 20260918_0004

ALTER TABLE repair_order_items
    DROP CONSTRAINT IF EXISTS repair_order_items_credential_check;

ALTER TABLE repair_order_items
    DROP CONSTRAINT IF EXISTS repair_order_items_credential_status_check;

ALTER TABLE repair_order_items
    ADD CONSTRAINT repair_order_items_credential_check CHECK (
        (credential_status = 'passcode_provided' AND
         credential_ciphertext IS NOT NULL AND
         credential_key_version IS NOT NULL AND
         credential_consent = true AND
         credential_received_at IS NOT NULL AND
         credential_expires_at IS NOT NULL AND
         credential_destroyed_at IS NULL)
        OR
        (credential_status = 'destroyed' AND
         credential_ciphertext IS NULL AND
         credential_key_version IS NULL AND
         credential_destroyed_at IS NOT NULL)
        OR
        (credential_status IN ('not_required', 'customer_unlocked_device') AND
         credential_ciphertext IS NULL)
    );

ALTER TABLE repair_order_items
    DROP CONSTRAINT IF EXISTS repair_order_items_credential_status_values_check;

ALTER TABLE repair_order_items
    ADD CONSTRAINT repair_order_items_credential_status_values_check
        CHECK (credential_status IN (
            'not_required', 'customer_unlocked_device', 'passcode_provided', 'destroyed'
        ));
