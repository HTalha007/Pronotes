import type { TagColor } from '../value-objects/tag-color';
import type { TagName } from '../value-objects/tag-name';
import type { TagId, UserId } from '../value-objects/ids';

export interface Tag {
  readonly id: TagId;
  readonly ownerId: UserId;
  readonly name: TagName;
  readonly color: TagColor;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
}

export function isTagDeleted(tag: Tag): boolean {
  return tag.deletedAt !== null;
}

export function createTagEntity(params: {
  readonly id: TagId;
  readonly ownerId: UserId;
  readonly name: TagName;
  readonly color: TagColor;
  readonly now: Date;
}): Tag {
  return {
    id: params.id,
    ownerId: params.ownerId,
    name: params.name,
    color: params.color,
    createdAt: params.now,
    updatedAt: params.now,
    deletedAt: null,
  };
}

export interface TagChanges {
  readonly name?: TagName;
  readonly color?: TagColor;
}

export function updateTagEntity(tag: Tag, changes: TagChanges, now: Date): Tag {
  return {
    ...tag,
    name: changes.name ?? tag.name,
    color: changes.color ?? tag.color,
    updatedAt: now,
  };
}

export function markTagDeleted(tag: Tag, now: Date): Tag {
  return { ...tag, deletedAt: now, updatedAt: now };
}
