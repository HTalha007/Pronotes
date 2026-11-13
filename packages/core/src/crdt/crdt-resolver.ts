import * as Y from 'yjs';

export class CrdtResolver {
  private doc: Y.Doc;

  constructor(doc?: Y.Doc) {
    this.doc = doc ?? new Y.Doc();
  }

  getDoc(): Y.Doc {
    return this.doc;
  }

  getText(field: string = 'content'): Y.Text {
    return this.doc.getText(field);
  }

  getXmlFragment(field: string = 'content'): Y.XmlFragment {
    return this.doc.getXmlFragment(field);
  }

  getMap<T = unknown>(name: string = 'metadata'): Y.Map<T> {
    return this.doc.getMap<T>(name);
  }

  encodeStateAsUpdate(): Uint8Array {
    return Y.encodeStateAsUpdate(this.doc);
  }

  applyUpdate(update: Uint8Array, origin?: any): void {
    Y.applyUpdate(this.doc, update, origin);
  }

  destroy(): void {
    this.doc.destroy();
  }
}
