import type { Brand } from '../shared/brand';

/**
 * Opaque binary Yjs update/state. The domain never inspects it; only the
 * CRDT adapter (infrastructure) and the editor know how to read it.
 */
export type CrdtState = Brand<Uint8Array, 'CrdtState'>;

export function toCrdtState(bytes: Uint8Array): CrdtState {
  return bytes as CrdtState;
}

export function emptyCrdtState(): CrdtState {
  return new Uint8Array(0) as CrdtState;
}
