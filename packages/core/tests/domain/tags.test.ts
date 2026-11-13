import { describe, expect, it } from 'vitest';
import { expectErr, expectOk } from '../support/fakes';
import { createWorld, OTHER_USER, OWNER } from '../support/world';

describe('tag use cases and note-tag association', () => {
  it('creates an empty tag with valid name and default color', async () => {
    const world = createWorld();
    const tag = expectOk(
      await world.createTag.execute({ ownerId: OWNER, name: 'İş Notları' }),
    );

    expect(tag.name).toBe('İş Notları');
    expect(tag.color).toBe('#E8ECFB');
    expect(tag.ownerId).toBe(OWNER);
    expect(tag.deletedAt).toBeNull();
    expect(world.tags.store.get(tag.id)).toEqual(tag);
  });

  it('rejects empty tag names and names over 50 chars', async () => {
    const world = createWorld();
    const emptyErr = expectErr(
      await world.createTag.execute({ ownerId: OWNER, name: '   ' }),
    );
    expect(emptyErr.code).toBe('VALIDATION_ERROR');

    const longErr = expectErr(
      await world.createTag.execute({ ownerId: OWNER, name: 'a'.repeat(51) }),
    );
    expect(longErr.code).toBe('VALIDATION_ERROR');
    expect(world.tags.store.size).toBe(0);
  });

  it('validates custom hex color', async () => {
    const world = createWorld();
    const invalidColorErr = expectErr(
      await world.createTag.execute({ ownerId: OWNER, name: 'Proje', color: 'red' }),
    );
    expect(invalidColorErr.code).toBe('VALIDATION_ERROR');

    const validTag = expectOk(
      await world.createTag.execute({ ownerId: OWNER, name: 'Proje', color: '#3D7A5F' }),
    );
    expect(validTag.color).toBe('#3D7A5F');
  });

  it('lists only the owner non-deleted tags, sorted alphabetically', async () => {
    const world = createWorld();
    const tagZ = expectOk(
      await world.createTag.execute({ ownerId: OWNER, name: 'Zebra' }),
    );
    const tagA = expectOk(
      await world.createTag.execute({ ownerId: OWNER, name: 'Arşiv' }),
    );
    await world.createTag.execute({ ownerId: OTHER_USER, name: 'Yabancı' });

    const listed = expectOk(await world.listTags.execute({ ownerId: OWNER }));
    expect(listed.map((t) => t.id)).toEqual([tagA.id, tagZ.id]);
  });

  it('updates tag name and color with authorization checks', async () => {
    const world = createWorld();
    const tag = expectOk(
      await world.createTag.execute({ ownerId: OWNER, name: 'Eski İsim' }),
    );

    const accessErr = expectErr(
      await world.updateTag.execute({
        ownerId: OTHER_USER,
        tagId: tag.id,
        name: 'Yeni İsim',
      }),
    );
    expect(accessErr.code).toBe('ACCESS_DENIED');

    const updated = expectOk(
      await world.updateTag.execute({
        ownerId: OWNER,
        tagId: tag.id,
        name: 'Yeni İsim',
        color: '#6B5CA5',
      }),
    );
    expect(updated.name).toBe('Yeni İsim');
    expect(updated.color).toBe('#6B5CA5');
  });

  it('soft-deletes tag and hides from list', async () => {
    const world = createWorld();
    const tag = expectOk(
      await world.createTag.execute({ ownerId: OWNER, name: 'Silinecek' }),
    );

    expectOk(await world.deleteTag.execute({ ownerId: OWNER, tagId: tag.id }));

    const inStore = world.tags.store.get(tag.id);
    expect(inStore?.deletedAt).not.toBeNull();

    const listed = expectOk(await world.listTags.execute({ ownerId: OWNER }));
    expect(listed).toHaveLength(0);

    const secondDelete = expectErr(
      await world.deleteTag.execute({ ownerId: OWNER, tagId: tag.id }),
    );
    expect(secondDelete.code).toBe('NOT_FOUND');
  });

  it('associates tags with standard notes during creation and update', async () => {
    const world = createWorld();
    const tag1 = expectOk(await world.createTag.execute({ ownerId: OWNER, name: 'Tag 1' }));
    const tag2 = expectOk(await world.createTag.execute({ ownerId: OWNER, name: 'Tag 2' }));

    const note = expectOk(
      await world.createStandardNote.execute({
        ownerId: OWNER,
        title: 'Etiketli Not',
        tagIds: [tag1.id],
      }),
    );
    expect(note.tagIds).toEqual([tag1.id]);

    const updatedNote = expectOk(
      await world.updateStandardNote.execute({
        ownerId: OWNER,
        noteId: note.id,
        tagIds: [tag1.id, tag2.id],
      }),
    );
    expect(updatedNote.tagIds).toEqual([tag1.id, tag2.id]);
  });
});
