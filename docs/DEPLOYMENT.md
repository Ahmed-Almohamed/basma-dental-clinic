# Deployment and recovery

## Cloudflare resources

Basma uses one Worker and one D1 database. There is no public file bucket and no externally trusted identity header. The application authenticates every data request itself.

1. Install dependencies with `npm ci` and run `npx wrangler login`.
2. For a new installation, run `npx wrangler d1 create basma-clinic-db`.
3. Put the returned database ID in `wrangler.jsonc`, keeping the binding name `DB`. Adjust the Worker and database names for another clinic.
4. Run `npm run db:migrate:remote`.
5. Run `node scripts/create-admin.mjs --remote` once to provision the initial account. Keep credentials private; do not put them in source, README files, command-line arguments or issues.
6. Run `npm run typecheck`, `npm run build`, then `npx wrangler deploy --config dist/server/wrangler.json`.
7. Sign in, change the initial username/password, and verify the clinic settings.

The tracked database ID identifies a resource; it is not a credential. Deployment requires permission on the Cloudflare account. GitHub is the source repository; pushing does not deploy automatically.

## Updating an installation

Apply pending migrations, build and deploy. Do not replay old SQL manually. Keep applied migrations unchanged and append new files for schema changes. Review schema changes before applying them to a live clinic.

## Backups

The Settings JSON export contains patient, appointment, treatment, receipt and attachment metadata. **It does not include the attachment binaries or provide an automatic restore button.** Download important attachments individually or export the entire D1 database:

```sh
npx wrangler d1 export DB --remote --output backups/basma.sql
```

A complete D1 export includes attachment chunks and password/session records. Keep it private, access-controlled and outside Git. This repository ignores `backups/`. Use a dated export before schema or hosting changes. A restore is an administrative operation: restore into a new database first, verify counts and attachments, then switch the binding. Do not blindly import over live records.

## Account recovery

An authenticated user changes credentials at `/account` using the current password. Changing credentials invalidates all earlier sessions. For a forgotten password, the Cloudflare account owner must reset the account through a private administrative procedure; there is no public reset endpoint. Revoke all sessions when performing an administrative reset. Never share raw database exports while asking for support.

## Capacity

D1 currently stores both records and attachments. Each file is split into 512 KiB chunks; base64 encoding adds approximately one third to the file size. The application caps a file at 10 MiB. Monitor D1 storage and daily read/write quotas in Cloudflare. The free plan's database cap is currently 500 MB; consult [current limits](https://developers.cloudflare.com/d1/platform/limits/) before planning capacity. Cloudflare may change plan limits.

No paid upgrade or R2 subscription is enabled by the application. Object storage can be added later with a separate migration for attachment content.

