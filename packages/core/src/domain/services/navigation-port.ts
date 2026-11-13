import type { NoteId, TagId } from '../value-objects/ids';

/**
 * Supported routes in Pronotes.
 */
export type AppRoute =
  | { readonly kind: 'all-notes' }
  | { readonly kind: 'vault' }
  | { readonly kind: 'tag'; readonly tagId: TagId }
  | { readonly kind: 'note-detail'; readonly noteId: NoteId };

/**
 * Port: Abstract navigation service decoupling application logic from
 * browser URL / History API.
 */
export interface NavigationPort {
  getCurrentRoute(): AppRoute;
  navigateTo(route: AppRoute): void;
  subscribe(listener: (route: AppRoute) => void): () => void;
}
