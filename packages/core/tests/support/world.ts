import {
  CreateStandardNote,
  CreateTag,
  CreateVaultNote,
  DeleteNote,
  DeleteTag,
  ListNotes,
  ListTags,
  ListVaultNotes,
  LockVault,
  OpenVaultNote,
  parseUserId,
  SearchNotes,
  SetupVault,
  UnlockVault,
  UpdateStandardNote,
  UpdateTag,
  UpdateVaultNote,
  type UserId,
} from '../../src/domain';
import {
  expectOk,
  FakeClock,
  FakeVaultCipher,
  InMemoryNoteRepository,
  InMemoryTagRepository,
  InMemoryVaultRepository,
  SequentialIdGenerator,
} from './fakes';

export const OWNER: UserId = expectOk(parseUserId('user-1'));
export const OTHER_USER: UserId = expectOk(parseUserId('user-2'));
export const MASTER_PASSWORD = 'correct horse battery';

/** Wires every use case against in-memory fakes (the composition-root equivalent for tests). */
export function createWorld() {
  const notes = new InMemoryNoteRepository();
  const tags = new InMemoryTagRepository();
  const vaults = new InMemoryVaultRepository();
  const cipher = new FakeVaultCipher();
  const clock = new FakeClock();
  const ids = new SequentialIdGenerator();

  return {
    notes,
    tags,
    vaults,
    cipher,
    clock,
    ids,
    createStandardNote: new CreateStandardNote(notes, ids, clock),
    updateStandardNote: new UpdateStandardNote(notes, clock),
    deleteNote: new DeleteNote(notes, clock),
    listNotes: new ListNotes(notes),
    searchNotes: new SearchNotes(notes),
    createTag: new CreateTag(tags, ids, clock),
    listTags: new ListTags(tags),
    deleteTag: new DeleteTag(tags, clock),
    updateTag: new UpdateTag(tags, clock),
    setupVault: new SetupVault(vaults, cipher, clock),
    unlockVault: new UnlockVault(vaults, cipher),
    lockVault: new LockVault(cipher),
    createVaultNote: new CreateVaultNote(notes, cipher, ids, clock),
    updateVaultNote: new UpdateVaultNote(notes, cipher, clock),
    openVaultNote: new OpenVaultNote(notes, cipher),
    listVaultNotes: new ListVaultNotes(notes, cipher),
  };
}

export type World = ReturnType<typeof createWorld>;
