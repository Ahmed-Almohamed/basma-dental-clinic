# Security

Basma is a single-account clinic application. All patient and attachment endpoints require a valid, unexpired session. Session tokens are random 256-bit values, stored hashed in D1, with HttpOnly and SameSite=Strict cookies (Secure on HTTPS). Passwords use salted PBKDF2-SHA256 with 100,000 iterations. Login attempts are limited per IP, and credentials must be changed after initial setup.

Credential changes require the current password and revoke existing sessions. Mutation requests require a matching Origin. Body and upload sizes are bounded; attachment MIME signatures are checked. Database operations bind values and scope record access to the clinic account. Header-based identity from earlier hosting is not accepted.

Do not publish passwords, sessions, patient data, attachments or database backups in GitHub issues. Report a problem to the repository owner privately through an already established contact channel. This repository does not claim formal penetration testing, regulatory certification or a guarantee of security.

See [the audit record](docs/TESTING.md) for the tested release scope and remaining dependency advisories.

