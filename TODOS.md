# TODOs

1) Fix business dashboard URL in email templates

- Problem: Hardcoded `https://business.orcavo.com/dashboard` appears in two email templates and should point to the correct production URL.
- Files:
  - packages/api/emails/templates.ts:370
  - packages/api/emails/templates.ts:428
- Plan:
  - Decide the canonical production URL for the business dashboard.
  - Replace hardcoded URLs with environment-driven config (e.g., `BUSINESS_APP_URL`) and default sensible values for dev.
  - Unify brand links in email templates (currently mixed KymaClub/Orcavo domains) under the same config approach.
  - Add a small helper to build app links consistently across templates.

