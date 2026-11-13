import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import { YjsDocumentManager } from '../../src/crdt/yjs-document-manager';
import { expectOk } from '../support/fakes';
import { parseNoteId } from '../../src/domain/value-objects/ids';

describe('YjsDocumentManager', () => {
  const noteId = expectOk(parseNoteId('test-note-1'));

  it('creates a new Y.Doc and resolver', () => {
    const { doc, resolver } = YjsDocumentManager.createNoteDoc(noteId);
    expect(doc).toBeInstanceOf(Y.Doc);
    expect(resolver).toBeDefined();
  });

  it('applies initial state updates correctly', () => {
    const doc1 = new Y.Doc();
    doc1.getText('content').insert(0, 'Merhaba');
    const state = Y.encodeStateAsUpdate(doc1);

    const { doc } = YjsDocumentManager.createNoteDoc(noteId, state);
    expect(doc.getText('content').toString()).toBe('Merhaba');
  });

  it('merges updates correctly (CRDT consistency)', () => {
    const { doc: docA, resolver: resA } = YjsDocumentManager.createNoteDoc(noteId);
    const { doc: docB, resolver: resB } = YjsDocumentManager.createNoteDoc(noteId);

    // Apply change A
    resA.getText('content').insert(0, 'A');
    const updateA = Y.encodeStateAsUpdate(docA);
    YjsDocumentManager.applyUpdate(docB, updateA);

    // Apply change B
    resB.getText('content').insert(0, 'B');
    const updateB = Y.encodeStateAsUpdate(docB);
    YjsDocumentManager.applyUpdate(docA, updateB);

    expect(docA.getText('content').toString()).toBe(docB.getText('content').toString());
  });

  it('extracts plain text from XmlFragment and Y.Text', () => {
    // 1. XmlFragment (Tiptap gövdesi - 'content')
    const { doc: xmlDoc } = YjsDocumentManager.createNoteDoc(noteId);
    const fragment = xmlDoc.getXmlFragment('content');
    const p1 = new Y.XmlElement('paragraph');
    const t1 = new Y.XmlText('İlk paragraf');
    p1.insert(0, [t1]);

    const p2 = new Y.XmlElement('paragraph');
    const t2 = new Y.XmlText('İkinci paragraf');
    p2.insert(0, [t2]);

    fragment.insert(0, [p1, p2]);

    const extracted = YjsDocumentManager.extractPlainText(xmlDoc, 'content');
    expect(extracted).toContain('İlk paragraf');
    expect(extracted).toContain('İkinci paragraf');

    // 2. Y.Text (Başlık veya düz metin alanı - 'title')
    const { doc: textDoc } = YjsDocumentManager.createNoteDoc(noteId);
    textDoc.getText('title').insert(0, 'Düz metin başlık');
    expect(YjsDocumentManager.extractPlainText(textDoc, 'title')).toBe('Düz metin başlık');
  });

  it('produces compact snapshots using encodeStateAsUpdate', () => {
    const { doc } = YjsDocumentManager.createNoteDoc(noteId);
    doc.getText('content').insert(0, 'Test snapshot boyutu');
    const snapshot = YjsDocumentManager.createSnapshot(doc);
    expect(snapshot).toBeInstanceOf(Uint8Array);
    expect(snapshot.length).toBeGreaterThan(0);

    // Rehydrate in another doc
    const { doc: restored } = YjsDocumentManager.createNoteDoc(noteId, snapshot);
    expect(restored.getText('content').toString()).toBe('Test snapshot boyutu');
  });
});
