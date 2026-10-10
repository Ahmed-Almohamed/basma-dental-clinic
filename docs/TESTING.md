# Release verification

Verified on 10 October 2026 against an isolated local D1 database with generated credentials and synthetic records.

## Automated checks

- TypeScript validation and production build.
- Appointment availability, overlapping bookings and rescheduling.
- Unified patient creation and booking, existing-patient matching, session type and tooth persistence.
- Concurrent booking retries, completion retries and manual-payment idempotency.
- Daily queue membership and ordering, including completed-visit protection.
- Patient, treatment and receipt persistence; authenticated attachment access.
- Multi-chunk PDF upload and byte-for-byte download integrity; invalid image rejection.
- Unauthorized access, forged legacy identity headers, cross-origin mutations, malformed and oversized payloads.
- Initial-password change requirement, credential updates, session invalidation, logout and login throttling.

All seven integration scripts passed individually. Run them again for changes with `npm test` after following the local test setup in the README. Tests never target the deployed database.

## Browser review

Reviewed sign-in, the appointment form, session selection, tooth selection and account settings. The booking dialog was also inspected at a 390 × 844 viewport: fields scroll inside the dialog and save/cancel remain available. The README screenshot shows an empty local booking form, without patient data.

## Issues corrected during this release

- Removed the separate demo data path and demo/AI-facing interface labels.
- Replaced hosting-specific identity headers with private clinic sessions.
- Required changing initial credentials before accessing clinic records.
- Fixed a framework upload limit that rejected files above roughly 1 MiB despite the UI allowing 10 MiB.
- Made manual receipt retries idempotent and protected concurrent account changes.
- Exported the filtered patient list and kept completed appointments outside the active waiting order.
- Removed automatic first-patient selection from generic treatment/payment forms.
- Prevented edits to form fields while a save is pending.

## Dependency review

`npm audit --omit=dev` reported **0 known advisories** at verification time. The complete dependency tree still reported **13 advisories (6 high, 7 moderate)** in build-tool transitive chains involving `braces`/`micromatch`, `fflate` and a nested older `esbuild`. The available automatic fix proposed incompatible tool downgrades, so it was not applied. These dependencies are part of the build environment; a clean production-only audit is not a guarantee that every bundled framework path is unaffected. Monitor upstream releases and repeat the audit before future releases.

## Limits of verification

This is a functional and regression review, not an independent penetration test or medical-data compliance certification. No live medical records were used in destructive tests. Large-scale performance, long-term storage growth, multi-user roles and imaging-device integration are outside this release's scope.
