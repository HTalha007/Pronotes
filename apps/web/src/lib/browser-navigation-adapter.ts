import { domain } from '@pronotes/core';

const { parseTagId, parseNoteId } = domain;

export class BrowserNavigationAdapter implements domain.NavigationPort {
  private listeners: ((route: domain.AppRoute) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', () => {
        const route = this.getCurrentRoute();
        this.notify(route);
      });
    }
  }

  getCurrentRoute(): domain.AppRoute {
    if (typeof window === 'undefined') {
      return { kind: 'all-notes' };
    }

    const path = window.location.pathname;

    if (path === '/vault' || path === '/vault/') {
      return { kind: 'vault' };
    }

    const tagMatch = path.match(/^\/tags?\/([^/]+)/);
    if (tagMatch && tagMatch[1]) {
      const parsed = parseTagId(tagMatch[1]);
      if (parsed.ok) {
        return { kind: 'tag', tagId: parsed.value };
      }
    }

    const noteMatch = path.match(/^\/notes?\/([^/]+)/);
    if (noteMatch && noteMatch[1]) {
      const parsed = parseNoteId(noteMatch[1]);
      if (parsed.ok) {
        return { kind: 'note-detail', noteId: parsed.value };
      }
    }

    return { kind: 'all-notes' };
  }

  navigateTo(route: domain.AppRoute): void {
    if (typeof window === 'undefined') return;

    let path = '/';
    switch (route.kind) {
      case 'all-notes':
        path = '/';
        break;
      case 'vault':
        path = '/vault';
        break;
      case 'tag':
        path = `/tag/${route.tagId}`;
        break;
      case 'note-detail':
        path = `/note/${route.noteId}`;
        break;
    }

    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
    this.notify(route);
  }

  subscribe(listener: (route: domain.AppRoute) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(route: domain.AppRoute): void {
    this.listeners.forEach((listener) => {
      try {
        listener(route);
      } catch (err) {
        console.error('Error in navigation listener:', err);
      }
    });
  }
}

export const browserNavigation = new BrowserNavigationAdapter();
