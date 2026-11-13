import * as Y from 'yjs';
import { CrdtResolver } from './crdt-resolver';
import type { NoteId } from '../domain/value-objects/ids';

function extractXmlText(node: any): string {
  if (node instanceof Y.XmlText) {
    return node.toString();
  }
  if (node && typeof node.toArray === 'function') {
    const children = node.toArray();
    return children
      .map((child: any) => extractXmlText(child))
      .filter((s: string) => s.length > 0)
      .join('\n');
  }
  if (typeof node?.toString === 'function') {
    return node.toString();
  }
  return '';
}

export class YjsDocumentManager {
  static createNoteDoc(
    noteId: NoteId,
    initialState?: Uint8Array,
  ): { doc: Y.Doc; resolver: CrdtResolver } {
    const doc = new Y.Doc({ guid: noteId });

    if (initialState && initialState.length > 0) {
      try {
        Y.applyUpdate(doc, initialState);
      } catch (err) {
        console.warn('Yjs update decode error, starting clean doc:', err);
      }
    }

    const resolver = new CrdtResolver(doc);
    return { doc, resolver };
  }

  static createSnapshot(doc: Y.Doc): Uint8Array {
    return Y.encodeStateAsUpdate(doc);
  }

  static applyUpdate(doc: Y.Doc, update: Uint8Array): void {
    Y.applyUpdate(doc, update);
  }

  static extractPlainText(doc: Y.Doc, field: string = 'content'): string {
    const shared = doc.share.get(field);
    if (shared instanceof Y.Text) {
      return shared.toString().trim();
    }
    const fragment = doc.getXmlFragment(field);
    return extractXmlText(fragment).trim();
  }
}

