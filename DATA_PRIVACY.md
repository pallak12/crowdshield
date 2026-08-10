# CrowdShield Data Privacy & Ethics

## Purpose
This document describes how CrowdShield handles sensitive data, what is collected, and how to protect user privacy and ethical operation when using the application.

## What is collected
- High-level event logs that describe system actions, operator commands, and status updates.
- Operational metadata such as timestamps, event categories, and action outcomes.
- Application metrics needed for analysis and safe system operation.

## What is not collected by default
- No personally identifiable information (PII) such as names, email addresses, phone numbers, or identity documents.
- No raw audio recordings or unredacted speech transcripts unless explicitly configured by an operator and a secure backend.
- No geolocation data tied to identifiable individuals.

## Voice command handling
- Voice commands should be treated as sensitive input.
- The backend stub included in `backend/server.js` is designed to redact voice text and store only minimal command metadata.
- If raw transcripts are ever required, they must be encrypted at rest, access-controlled, and retained only for a limited, documented period.

## Data minimization
- Store only the minimum information needed for safe operation and auditing.
- Prefer event labels and outcomes over raw user text.
- Avoid keeping detailed logs longer than necessary.

## Retention and deletion
- Define a retention policy before deploying in a live environment.
- Recommended default retention: 30 days for operational logs, unless a different regulatory requirement applies.
- Periodically purge older logs and archived data.

## Secure transport and storage
- Always use HTTPS/TLS for backend communication.
- Protect authorization tokens and secrets in environment variables, not source code.
- Use strong bearer tokens, rotate them regularly, and store them securely.

## Access control and auditing
- Restrict access to logs and backend controls to authorized operators only.
- Record audit trails for actions that open gates, deploy security, or initiate evacuations.
- Do not expose audit logs to public or unauthorized users.

## Consent and legal compliance
- Obtain clear consent from operators who interact with the system.
- If the system is deployed in a jurisdiction with data protection laws (GDPR, PDPA, CCPA, etc.), follow the applicable requirements.
- Document any data sharing agreements and cross-border data transfer policies.

## Ethical operating principles
- Use the system to enhance safety, not to surveil or discriminate against individuals.
- Avoid automated actions that could endanger people without a human review step.
- Implement fail-safe behavior when the system cannot confirm a safe outcome.

## Deployment guidance
- Treat the included backend stub as a starting point, not a production-ready service.
- For production, add:
  - strong authentication and role-based access control
  - secure log storage and encryption
  - data retention and deletion workflows
  - legal and compliance review

## Notes
- The root README has been updated to reference this document.
- Use `backend/README.md` for details on how to run the secure backend stub that complements CrowdShield.
