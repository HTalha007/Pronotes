# `@pronotes/core` – Clean Architecture rules (directory scope)

These rules apply to everything under `packages/core/`. They complement the root `.antigravityrules`
(root file wins on conflict). Full documentation: `Documantations/domain-layer.md`.

## Layers

```
packages/core/src/
├── domain/            # INNERMOST: entities, value objects, errors, ports, use cases
│   ├── shared/        # Result, Brand, pure bytes/text helpers
│   ├── errors/        # DomainError subclasses with stable `code`
│   ├── value-objects/ # validated, branded, immutable (NoteTitle, MasterPassword, KdfParams, ...)
│   ├── entities/      # Note (standard | vault), Vault, User
│   ├── repositories/  # PORTS: NoteRepository, VaultRepository
│   ├── services/      # PORTS: VaultCipher, SyncGateway, AuthGateway, Clock, IdGenerator, ConnectivityMonitor
│   └── use-cases/     # notes/, vault/, sync/, auth/  (one class per user intention)
└── infrastructure/    # (to be built) adapters implementing the ports; may import domain + libraries
```

Legacy folders `crypto/`, `storage/`, `crdt/`, `sync/`, `types/` pre-date the layering: do not extend them,
migrate them into `infrastructure/` as port adapters.

## Hard rules

1. **Dependency Rule:** `domain/` imports ONLY files inside `domain/`. No npm packages, no `infrastructure/`, no `apps/*`, no `packages/ui`.
2. **No environment access in `domain/`:** no `window`, `document`, `navigator`, `indexedDB`, `localStorage`, `fetch`, `WebSocket`, `Worker`, global `crypto`, `btoa`/`atob`. Use `domain/shared/bytes.ts`.
3. **No `any`** (use `unknown` + type guards). Strict TypeScript, `noUncheckedIndexedAccess` is on.
4. **Use cases:** one file/class per intention in `domain/use-cases/<area>/<verb-noun>.ts`; implements `UseCase<I, O>`; ports injected via constructor; single `execute`; returns `Promise<Result<O, DomainError>>`; enforces ownership (`loadOwnedNote`) and vault-unlocked rules itself.
5. **Entities/value objects are immutable.** Transitions are pure functions returning new objects. Invariants live in value-object factories returning `Result`; never `throw` for expected failures.
6. **Security invariants (never weaken):** master password and derived keys never leave the cipher port, are never persisted or logged; vault notes are stored/synced only as one opaque `EncryptedBlob`; wrong password is detected locally through the verifier / AES-GCM tag; no "forgot password" flow; offline is a normal state, never an error.
7. **Naming:** `kebab-case` files; `PascalCase` types/classes; use cases named verb + noun (`CreateVaultNote`).
8. **Every use case/entity change needs a test** in `packages/core/tests/` using the in-memory fakes in `tests/support/`.

## Before finishing a task in this package

```bash
npm run check:architecture   # dependency-rule / purity / kebab-case / no-any guard
npm run type-check
npm test
```
