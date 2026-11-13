/**
 * Utility functions for exporting notes and generating read-only share links.
 */

export function formatNoteToMarkdown(title: string, content: string, tags: string[] = []): string {
  const parts: string[] = [];

  if (title.trim()) {
    parts.push(`# ${title.trim()}`);
  }

  if (tags.length > 0) {
    parts.push(tags.map((t) => `#${t.replace(/\s+/g, '-')}`).join(' '));
  }

  if (content.trim()) {
    // If content has HTML tags from editor, clean or keep text
    const cleanContent = content.replace(/<br\s*\/?>/gi, '\n');
    parts.push(cleanContent);
  }

  return parts.join('\n\n');
}

export async function copyNoteAsMarkdown(
  title: string,
  content: string,
  tags: string[] = [],
): Promise<boolean> {
  try {
    const md = formatNoteToMarkdown(title, content, tags);
    await navigator.clipboard.writeText(md);
    return true;
  } catch (err) {
    console.error('Failed to copy note to clipboard:', err);
    return false;
  }
}

export function downloadNoteAsFile(
  title: string,
  content: string,
  tags: string[] = [],
): void {
  const md = formatNoteToMarkdown(title, content, tags);
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const safeTitle = (title.trim() || 'not')
    .toLowerCase()
    .replace(/[^a-z0-9ğüşıöç-]/gi, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeTitle}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function generateShareUrl(title: string, content: string): string {
  if (typeof window === 'undefined') return '';
  const payload = {
    t: title.trim(),
    c: content.trim(),
    d: new Date().toISOString(),
  };

  const json = JSON.stringify(payload);
  // URL-safe base64 encoding
  const base64 = btoa(unescape(encodeURIComponent(json)));
  const origin = window.location.origin;
  return `${origin}/#share=${encodeURIComponent(base64)}`;
}

export interface SharedNoteData {
  title: string;
  content: string;
  date?: string;
}

export function parseSharedNoteFromUrl(): SharedNoteData | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash;
  if (!hash.startsWith('#share=')) return null;

  try {
    const rawBase64 = decodeURIComponent(hash.substring(7));
    const json = decodeURIComponent(escape(atob(rawBase64)));
    const parsed = JSON.parse(json);
    return {
      title: parsed.t || '',
      content: parsed.c || '',
      date: parsed.d,
    };
  } catch (err) {
    console.error('Failed to parse shared note from URL:', err);
    return null;
  }
}
