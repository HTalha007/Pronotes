import { describe, expect, it } from 'vitest';
import {
  GetCurrentRoute,
  NavigateTo,
  parseNoteId,
  parseTagId,
  type AppRoute,
} from '../../src/domain';
import { expectOk, FakeNavigationAdapter } from '../support/fakes';

describe('Navigation Domain Use Cases', () => {
  it('starts at all-notes route by default', async () => {
    const nav = new FakeNavigationAdapter();
    const getCurrentRoute = new GetCurrentRoute(nav);

    const route = await getCurrentRoute.execute();
    expect(route).toEqual({ kind: 'all-notes' });
  });

  it('navigates to vault route', async () => {
    const nav = new FakeNavigationAdapter();
    const navigateTo = new NavigateTo(nav);
    const getCurrentRoute = new GetCurrentRoute(nav);

    await navigateTo.execute({ route: { kind: 'vault' } });
    const route = await getCurrentRoute.execute();

    expect(route).toEqual({ kind: 'vault' });
    expect(nav.history).toEqual([{ kind: 'all-notes' }, { kind: 'vault' }]);
  });

  it('navigates to tag route', async () => {
    const nav = new FakeNavigationAdapter();
    const navigateTo = new NavigateTo(nav);
    const getCurrentRoute = new GetCurrentRoute(nav);
    const tagId = expectOk(parseTagId('tag-work-123'));

    await navigateTo.execute({ route: { kind: 'tag', tagId } });
    const route = await getCurrentRoute.execute();

    expect(route).toEqual({ kind: 'tag', tagId });
  });

  it('navigates to note detail route', async () => {
    const nav = new FakeNavigationAdapter();
    const navigateTo = new NavigateTo(nav);
    const getCurrentRoute = new GetCurrentRoute(nav);
    const noteId = expectOk(parseNoteId('note-abc-456'));

    await navigateTo.execute({ route: { kind: 'note-detail', noteId } });
    const route = await getCurrentRoute.execute();

    expect(route).toEqual({ kind: 'note-detail', noteId });
  });

  it('notifies subscribers on route changes and allows unsubscribing', async () => {
    const nav = new FakeNavigationAdapter();
    const navigateTo = new NavigateTo(nav);
    const observed: AppRoute[] = [];

    const unsubscribe = nav.subscribe((route) => {
      observed.push(route);
    });

    await navigateTo.execute({ route: { kind: 'vault' } });
    expect(observed).toEqual([{ kind: 'vault' }]);

    unsubscribe();
    await navigateTo.execute({ route: { kind: 'all-notes' } });
    expect(observed).toEqual([{ kind: 'vault' }]); // Did not receive second event
  });
});
