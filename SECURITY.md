# ReachOps Security Policy

## Supported state

ReachOps is currently a portfolio demonstration under active development, not a production service. Security reports should target the latest default branch.

## Reporting a vulnerability

Please use GitHub private vulnerability reporting when it is enabled for the repository. Do not open a public issue containing secrets, personal data, exploit details, or OAuth material.

## Current security boundaries

- Only synthetic or explicitly authorized non-sensitive data belongs in the public project.
- Secrets and OAuth tokens must never enter Git, fixtures, browser payloads, screenshots, or logs.
- Application identity and Google data consent are separate trust decisions.
- Business records are workspace-scoped and require server-side authorization as their API slices are implemented.
- Integration adapters never write directly to persistence.
- External review/import content is untrusted data.
- AI is proposal-only, receives minimized facts, and has no external-write capability.
- Every consequential connection, synchronization, AI, approval, assignment, and action transition must become auditable in its implementing milestone.

The current M0 release contains no live OAuth flow, external connector, AI provider call, or customer data.
