# RepairFlow — UX/UI Requirements

## 1. Document purpose

This document defines the UX/UI requirements for RepairFlow, a workflow management system for personal device repair. The interface must help the shop create a clear evidence trail from device intake through diagnosis, quotation, repair, handover, and warranty.

Each repair order is the central workspace. Customer, device, condition, quotation, work, quality-check, and handover information must be reachable from the same record.

## 2. Design principles

- Every status tells the user the next step and the responsible person.
- Important evidence such as photos, checklists, quotations, and customer decisions is easy to find again.
- Required steps cannot be skipped before a status transition.
- Staff UI contains the operational detail; customer UI shows only necessary, understandable information.
- Primary actions change with the current order status.
- UI copy uses clear terms for staff and customers and does not depend on internal status codes.

## 3. Roles and primary entry points

### MVP access model

- Owner/Manager, Receptionist and Technician may see the login screen when an
  active account has been provisioned for them.
- Staff profiles without accounts have no session; the Manager can still
  operate the UI and select the correct staff profile for each step.
- Staff work is limited by fixed role permissions and assigned repair orders;
  it is not a workspace-wide view.
- Customers access a public link with a token and do not need an account.

### Receptionist/Front Desk

Priority tasks:

- Create an order.
- Record condition.
- Send a quotation link.
- Hand over the device.
- Actions use the current account session when available; a Manager may still
  attribute an action to a staff profile when operating on their behalf.

### Technician

Priority tasks:

- View assigned work.
- Diagnose.
- Create and update quotations.
- Record repair work.
- Perform quality checks.
- A Technician may have an account with access limited to assigned orders; a
  Technician without an account remains a staff profile.

### Manager/Owner

Priority tasks:

- Monitor the dashboard.
- Assign staff.
- Track overdue and waiting orders.
- Review reports and activity history.

### Customer

No account is required in the MVP. The customer accesses information through a secure link issued for the correct order and quotation.

## 4. Overall business flow

~~~text
Dashboard
    → Create repair order
    → Intake customer and device
    → Record condition and evidence
    → Diagnose
    → Create quotation
    → Send customer link
    → Customer approves or rejects
    → Perform repair
    → Quality check
    → Ready for handover
    → Handover and activate warranty
    → Repair history
~~~

### Internal status flow

~~~text
received
    → diagnosing
    → waiting_for_approval
    → approved | rejected
    → repairing
    → quality_check
    → ready_for_pickup
    → handed_over
    → warranty_active
~~~

When quality check fails, the order returns to `repairing`.

## 5. Internal navigation

The primary navigation includes:

- **Dashboard:** overall progress and orders requiring attention.
- **Repair Orders:** list, search, filtering, and new-order creation.
- **My Work:** orders assigned to the current staff profile.
- **Customers:** customer profiles and repair history.
- **Devices:** device information and history by serial number or identifier.
- **Notifications:** quotations awaiting approval, overdue orders, and ready-for-handover orders.
- **Settings:** shop, staff, roles, and workflow policies.

## 6. Screen and flow requirements

### 6.1. Dashboard

The dashboard must answer quickly:

- How many orders are in each status?
- Which orders are waiting for customer approval?
- Which orders are past their expected completion time?
- Which orders are ready for handover?
- Which staff profiles have assigned work?

Suggested KPI cards:

- Intake/diagnosis in progress.
- Waiting for customer approval.
- Repairing.
- Waiting for quality check.
- Ready for handover.
- Overdue.

Each card links to the corresponding filtered list.

### 6.2. Repair-order list

Each order row displays:

- Order code.
- Customer name.
- Device.
- Status.
- Primary staff profile.
- Intake date.
- Expected completion date.
- An overdue indicator when applicable.

Minimum filters:

- Status.
- Staff profile.
- Intake date.
- Overdue orders.
- Orders waiting for the customer.

### 6.3. Create repair order

#### Step 1: Select or create a customer

The form includes:

- Customer name.
- Phone number.
- Email.
- Notes.

When a phone number already exists, suggest the existing customer profile to prevent duplicates.

#### Step 2: Select or create a device

The form includes:

- Device type.
- Brand and model.
- Serial number or identifier.
- Device notes.

When the device has history, show recent repair orders.

#### Step 3: Record the reported issue

The form includes:

- Customer-reported issue.
- Start time, when known.
- Power state.
- Received accessories.
- Expected completion date.
- Intake notes.

After saving, the system creates a human-readable, workspace-unique order code such as `RF-20260911-001`.

### 6.4. Record condition and evidence

This is required before diagnosis or repair begins. The interface combines a checklist, notes, and photos.

Suggested checks:

- Exterior: scratches, dents, cracks, and breaks.
- Screen.
- Camera.
- Speaker and microphone.
- Buttons.
- Charging port.
- Wi-Fi and Bluetooth.
- Power state.
- Included accessories.
- Additional notes.

Photos display as thumbnails, support captions, and can be marked important. The UI may guide the user to capture the front, back, edges, and damaged area.

If the minimum checklist or evidence is incomplete, show:

~~~text
Condition record is incomplete. The order cannot move to diagnosis.
~~~

### 6.5. Repair-order detail

This is the central staff workspace.

#### Header

Display:

- Order code.
- Customer.
- Device.
- Current status.
- Primary and related staff profiles.
- Expected completion date.
- Primary action for the current status.

Suggested actions:

| Status | Display label | Primary action |
| --- | --- | --- |
| `received` | Received | Start diagnosis |
| `diagnosing` | Diagnosing | Create quotation |
| `waiting_for_approval` | Waiting for customer approval | Copy or send link |
| `approved` | Approved | Start repair |
| `repairing` | Repairing | Complete repair |
| `quality_check` | Quality check | Record result |
| `ready_for_pickup` | Ready for handover | Create handover record |

#### Order content

Use sections or tabs:

1. Overview.
2. Condition and evidence.
3. Diagnosis and quotation.
4. Repair work.
5. Quality check.
6. Handover and warranty.
7. History timeline.

The timeline should remain visible on the side or at the end of the page. It includes time, actor, action, note, and related documents.

Example:

~~~text
09:10 — Linh received the device
09:45 — Nam completed the diagnosis
10:20 — Quotation version 1 sent
11:05 — Customer approved the quotation
13:30 — Repair completed
14:00 — Quality check passed
~~~

### 6.6. Diagnosis and quotation

#### Diagnosis

The form includes:

- Test findings.
- Root cause.
- Proposed solution.
- Expected repair duration.
- Diagnosing staff profile.
- Technical photos or notes.

#### Quotation

Each quotation line includes:

- Type: part or labor.
- Description.
- Quantity.
- Unit price.
- Replacement or repair reason.
- Expected duration.

The quotation footer displays subtotal, total, customer note, and quotation version.

Quotation actions are **Save draft**, **Send customer link**, and **Create new version**. Sent or approved quotations are read-only. Any later change creates a new version and requires a new customer decision.

### 6.7. Customer link interface

Customers do not create accounts. The public page focuses on information to review and the decision to make.

Suggested content:

1. Shop name, order code, and device.
2. Repair progress.
3. Device condition at intake.
4. Diagnosis result.
5. Quotation details.
6. Expected completion time.
7. Relevant photos.
8. **Approve repair** button.
9. **Reject or discuss** button.

When the customer approves, show a confirmation step with the confirming name, quotation version, and time. After recording the decision, disable the approval button to prevent duplicate submissions.

### 6.8. Repair and quality check

#### Repair

The technical work screen includes:

- Approved work list.
- Execution checklist.
- Progress notes.
- Start and end time.
- After-repair photos.
- Actual parts used.

The UI clearly distinguishes four work states: **proposed**, **approved**, **performed**, and **checked**.

#### Quality check

The checklist should include:

- Whether the original issue was resolved.
- Whether the device starts normally.
- Whether related functions work.
- Whether new issues appeared.
- Exterior condition after repair.
- After-repair photos.
- Pass/fail conclusion.
- Remaining limitations.

When the check fails, return the order to `repairing`; it cannot go directly to handover.

### 6.9. Handover and warranty

The handover form includes:

- Recipient name.
- Handover date and time.
- Returned accessories.
- Final condition.
- Notes.
- Handover confirmation.
- Handover staff profile.
- Warranty duration or expiry date.

After saving:

- Move the order to `handed_over`.
- Activate warranty from the handover time.
- Lock important order information.
- Add the order to customer and device history.

## 7. Error and exception states

UX must clearly handle:

- Expired or revoked customer links.
- Customer rejection.
- A quotation changed after customer approval.
- Incomplete condition checklist.
- Missing evidence photos.
- Failed quality check.
- An order past its expected completion time.
- A device with another open repair order.
- An inactive staff profile that still owns an assignment.

## 8. MVP screen list

1. Internal login for Owner/Manager and provisioned staff accounts.
2. Dashboard.
3. Repair-order list.
4. Create repair order.
5. Repair-order detail.
6. Condition and photo evidence.
7. Diagnosis.
8. Versioned quotation.
9. Customer public page.
10. Repair checklist.
11. Quality check.
12. Handover and warranty.
13. Customer profile.
14. Device profile.
15. Timeline and basic audit log.

## 9. UX/UI acceptance criteria

- Users always see the current order status and next step.
- Owner/Manager can create an order and attribute the Receptionist profile without leaving the flow.
- Managers can select and record only active Technician profiles; Technician accounts, when provisioned, remain limited to assigned work.
- Customers can understand the quotation and decide without an account.
- Repair cannot start without an `approved` decision for the correct quotation version.
- Handover cannot occur before the quality checklist passes.
- Users can trace an order to photos, quotations, customer decisions, checklists, handover, and warranty.
- The UI clearly handles expired links, new quotation versions, overdue orders, and failed quality checks.

## 10. Related documents

- [Product README](../../README.md)
- [Architecture and system requirements](./03-business-and-domain-requirements.md)
- [Authentication and authorization](./07-authentication-and-authorization.md)
