import { create } from 'zustand';
import { domain } from '@pronotes/core';
import { compositionRoot } from '../composition-root';
import { browserNavigation } from '../lib/browser-navigation-adapter';

interface NavigationState {
  currentRoute: domain.AppRoute;
  navigateTo: (route: domain.AppRoute) => void;
}

export const useNavigationStore = create<NavigationState>((set) => {
  // Subscribe to navigation events
  browserNavigation.subscribe((route) => {
    set({ currentRoute: route });
  });

  return {
    currentRoute: browserNavigation.getCurrentRoute(),
    navigateTo: (route: domain.AppRoute) => {
      compositionRoot.navigateTo.execute({ route });
    },
  };
});
