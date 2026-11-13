import { describe, expect, it } from 'vitest';
import { toCrdtState } from '../../src/domain';
import { expectErr, expectOk } from '../support/fakes';
import { createWorld, OTHER_USER, OWNER } from '../support/world';

const crdt = (...bytes: number[]) => toCrdtState(Uint8Array.from(bytes));

describe('standard note use cases', () => {
  it('creates an empty, owned note and persists it locally', async () => {
    const world = createWorld();
    const note = expectOk(await world.createStandardNote.execute({ ownerId: OWNER }));

    expect(note.kind).toBe('standard');
    expect(note.title).toBe('');
    expect(note.deletedAt).toBeNull();
    expect(world.notes.store.get(note.id)).toEqual(note);
  });

  it('rejects titles longer than 200 characters', async () => {
    const world = createWorld();
    const error = expectErr(
      await world.createStandardNote.execute({ ownerId: OWNER, title: 'x'.repeat(201) }),
    );
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(world.notes.store.size).toBe(0);
  });

  it('updates title and body and bumps updatedAt', async () => {
    const world = createWorld();
    const note = expectOk(await world.createStandardNote.execute({ ownerId: OWNER }));
    world.clock.advance(1_000);

    const updated = expectOk(
      await world.updateStandardNote.execute({
        ownerId: OWNER,
        noteId: note.id,
        title: '  Alışveriş  ',
        body: { content: crdt(1, 2, 3), plainText: 'süt, ekmek' },
      }),
    );

    expect(updated.title).toBe('Alışveriş');
    expect(updated.plainText).toBe('süt, ekmek');
    expect(updated.content).toEqual(crdt(1, 2, 3));
    expect(updated.updatedAt.getTime()).toBeGreaterThan(note.updatedAt.getTime());
    expect(updated.createdAt).toEqual(note.createdAt);
  });

  it('refuses to touch notes of another user', async () => {
    const world = createWorld();
    const note = expectOk(await world.createStandardNote.execute({ ownerId: OWNER }));

    const error = expectErr(
      await world.updateStandardNote.execute({ ownerId: OTHER_USER, noteId: note.id, title: 'x' }),
    );
    expect(error.code).toBe('ACCESS_DENIED');
    expect(expectErr(await world.deleteNote.execute({ ownerId: OTHER_USER, noteId: note.id })).code).toBe(
      'ACCESS_DENIED',
    );
  });

  it('reports NOT_FOUND for unknown ids', async () => {
    const world = createWorld();
    const unknown = world.ids.newNoteId();
    expect(
      expectErr(await world.updateStandardNote.execute({ ownerId: OWNER, noteId: unknown })).code,
    ).toBe('NOT_FOUND');
  });

  it('soft-deletes: hidden from lists, tombstone kept, second delete is NOT_FOUND', async () => {
    const world = createWorld();
    const note = expectOk(await world.createStandardNote.execute({ ownerId: OWNER }));

    expectOk(await world.deleteNote.execute({ ownerId: OWNER, noteId: note.id }));

    expect(world.notes.store.get(note.id)?.deletedAt).not.toBeNull();
    expect(expectOk(await world.listNotes.execute({ ownerId: OWNER }))).toHaveLength(0);
    expect(
      expectErr(await world.deleteNote.execute({ ownerId: OWNER, noteId: note.id })).code,
    ).toBe('NOT_FOUND');
    expect(
      expectErr(await world.updateStandardNote.execute({ ownerId: OWNER, noteId: note.id })).code,
    ).toBe('NOT_FOUND');
  });

  it('lists only the owner notes, most recently edited first', async () => {
    const world = createWorld();
    const first = expectOk(await world.createStandardNote.execute({ ownerId: OWNER, title: 'first' }));
    world.clock.advance(1_000);
    const second = expectOk(await world.createStandardNote.execute({ ownerId: OWNER, title: 'second' }));
    await world.createStandardNote.execute({ ownerId: OTHER_USER, title: 'foreign' });
    world.clock.advance(1_000);
    await world.updateStandardNote.execute({ ownerId: OWNER, noteId: first.id, title: 'first!' });

    const listed = expectOk(await world.listNotes.execute({ ownerId: OWNER }));
    expect(listed.map((n) => n.id)).toEqual([first.id, second.id]);
  });

  it('searches title and text ignoring case and Turkish diacritics', async () => {
    const world = createWorld();
    const city = expectOk(await world.createStandardNote.execute({ ownerId: OWNER, title: 'İstanbul Gezisi' }));
    const shop = expectOk(await world.createStandardNote.execute({ ownerId: OWNER, title: 'Liste' }));
    await world.updateStandardNote.execute({
      ownerId: OWNER,
      noteId: shop.id,
      body: { content: crdt(1), plainText: 'Şirket toplantısı notları' },
    });

    const byTitle = expectOk(await world.searchNotes.execute({ ownerId: OWNER, query: 'istanbul' }));
    expect(byTitle.map((n) => n.id)).toEqual([city.id]);

    const byText = expectOk(await world.searchNotes.execute({ ownerId: OWNER, query: 'SIRKET' }));
    expect(byText.map((n) => n.id)).toEqual([shop.id]);

    const all = expectOk(await world.searchNotes.execute({ ownerId: OWNER, query: '  ' }));
    expect(all).toHaveLength(2);
  });

  it('creates and updates note color', async () => {
    const world = createWorld();
    const note = expectOk(
      await world.createStandardNote.execute({ ownerId: OWNER, title: 'Renkli Not', color: '#FEF9C3' }),
    );
    expect(note.color).toBe('#FEF9C3');

    const updated = expectOk(
      await world.updateStandardNote.execute({
        ownerId: OWNER,
        noteId: note.id,
        color: '#DCFCE7',
      }),
    );
    expect(updated.color).toBe('#DCFCE7');
  });
});
