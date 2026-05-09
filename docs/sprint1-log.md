# Sprint 1 and 2 Completion Log

## Sprint 1 Status

- M1 (Project Lead): PR-01 - PR-04 [Completed]
- M2: PR-01 - PR-04 [Completed] [Refining UI only]
- M3: PR-01 - PR-04 [Completed] [Seed data and rights auth]
- M4: PR-01 - PR-04 [Completed] [Google Auth and Login Guard]
- M5: PR-01 - PR-02 [Completed] [Auth Validation and Sprint Logs]

## Sprint 2 Status

- Customer CRUD UI is gated by assigned rights.
- Add Customer requires `CUST_ADD`.
- Edit Customer requires `CUST_EDIT`.
- Delete Customer requires `CUST_DEL`; ADMIN users do not receive customer delete unless this right is granted.
- Deleted Customers recovery is available only to ADMIN and SUPERADMIN users.
- Sales and Product pages are read-only.
- `UserRightsContext` loads the current user role and the nine sprint rights.
- Dashboard displays data quality and access status summaries.

## Validation

- `npm.cmd run lint`
- `npm.cmd test -- --run`
- `npm.cmd run build`

## Remaining Notes For Sprint 3

- Database rights migrations now use the `"userId"` column used by the app, provisioning trigger, and Supabase schema.
- Expand UI/component tests if Sprint 3 adds more role-specific mutation flows.
