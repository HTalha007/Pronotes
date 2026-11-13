import { useEffect } from 'react';

export interface ShortcutHandlers {
  onNewStandardNote: () => void;
  onNewVaultNote: () => void;
  onToggleVault: () => void;
  onFocusSearch: () => void;
  onOpenShortcutsHelp: () => void;
  onToggleTheme: () => void;
}

export function isTypingInField(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true;
  }
  if (target.isContentEditable) {
    return true;
  }
  return false;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isTyping = isTypingInField(e.target);
      const isModifier = e.ctrlKey || e.metaKey;

      // 1. Global Modifier Shortcuts (Work anywhere, even while typing)
      
      // Ctrl+K / Cmd+K -> Focus Search
      if (isModifier && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handlers.onFocusSearch();
        return;
      }

      // Ctrl+Shift+L / Cmd+Shift+L -> Toggle Vault (Unlock or Lock)
      if (isModifier && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        handlers.onToggleVault();
        return;
      }

      // Ctrl+Shift+V / Cmd+Shift+V -> Create Vault Note
      if (isModifier && e.shiftKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        handlers.onNewVaultNote();
        return;
      }

      // Ctrl+Alt+N / Ctrl+N -> Create Standard Note
      if ((isModifier && e.altKey && e.key.toLowerCase() === 'n') || (isModifier && e.key.toLowerCase() === 'n')) {
        // Prevent default browser new-window action when possible
        e.preventDefault();
        handlers.onNewStandardNote();
        return;
      }

      // 2. Single Key Shortcuts (Only when NOT typing in an input/textarea/editor)
      if (!isTyping && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // 'c' or 'n' -> New Note
        if (e.key === 'c' || e.key === 'n' || e.key === 'C' || e.key === 'N') {
          e.preventDefault();
          handlers.onNewStandardNote();
          return;
        }

        // '/' -> Focus Search
        if (e.key === '/') {
          e.preventDefault();
          handlers.onFocusSearch();
          return;
        }

        // '?' -> Shortcuts Help
        if (e.key === '?') {
          e.preventDefault();
          handlers.onOpenShortcutsHelp();
          return;
        }

        // 't' -> Toggle Theme
        if (e.key === 't' || e.key === 'T') {
          e.preventDefault();
          handlers.onToggleTheme();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers, enabled]);
}
