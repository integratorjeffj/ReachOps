# ADR-002: Establish ReachOps as an Independent Repository

- **Status:** Accepted
- **Decision date:** 2026-08-10
- **Supersedes:** ADR-001 repository-locus and conversion-preservation mechanics only
- **Decision owner:** ReachOps product owner

## Context

ADR-001 assumed ReachOps would replace ProcessForge in place and therefore required ProcessForge baseline commits, an annotated preservation tag, and a conversion branch. The original implementation conversation was archived before those operations occurred. The designated ReachOps workspace is empty, while the historical ProcessForge checkout contains unrelated runtime code and a heavily modified worktree.

The product owner subsequently directed that ReachOps be built as a brand-new, independent repository at `C:\Users\JeffJenkins\Documents\Codex\reachops` and that ProcessForge and LaunchPath remain separate projects.

## Decision

ReachOps will be initialized as an independent Git repository with no ProcessForge or LaunchPath Git history, runtime code, package identity, branding, or domain artifacts.

The following ADR-001 decisions remain authoritative:

- the ReachOps product and document authority;
- the retained architectural patterns, applied through new ReachOps code;
- the retired ProcessForge domain concepts;
- the ReachOps architecture, security, AI, evidence, approval, audit, source-mode, and demo boundaries;
- sequential issue and milestone delivery.

The following ADR-001 mechanics are retired:

- committing the historical ProcessForge worktree as a ReachOps baseline;
- creating `processforge-final-before-reachops` for ReachOps delivery;
- creating `codex/reachops-portfolio` from the ProcessForge branch;
- treating active ProcessForge migrations or packages as the starting ReachOps repository.

## M0 issue interpretation

- RCH-001 is satisfied by ADR-001's product-boundary decision plus this superseding repository decision and current repository instructions.
- RCH-002 establishes ReachOps package, environment, script, and runtime identity directly; it is not a rename of copied ProcessForge code.
- RCH-003 introduces the ReachOps schema as the first schema baseline; it is not a migration of ProcessForge customer data.
- RCH-004 and RCH-005 retain their documented outcomes unchanged.

Stable issue identifiers and downstream dependencies remain unchanged.

## Consequences

### Positive

- ReachOps has an unambiguous repository and product identity.
- Unrelated ProcessForge worktree changes cannot be staged or published accidentally.
- The new history contains only ReachOps decisions and implementation.
- The architecture can reuse proven patterns without copying retired product behavior.

### Costs

- Useful patterns must be reimplemented rather than inherited mechanically.
- Historical ProcessForge verification results do not count as ReachOps verification.
- Clean-repository scaffolding becomes part of RCH-002 and RCH-003.

## Git baseline

The initial ReachOps commit may contain the recovered authority documents, repository governance, and the first coherent M0 implementation after its full verification. No ProcessForge preservation tag or conversion branch is required.

## Compliance

This decision is satisfied when:

- the Git root is the designated ReachOps workspace;
- no active ProcessForge or LaunchPath identity exists in packages or runtime behavior;
- the recovered ReachOps authority documents are present;
- repository instructions identify ADR-002 as superseding only ADR-001's conversion mechanics;
- Git history begins independently.
