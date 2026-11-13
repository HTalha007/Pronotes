import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlock from '@tiptap/extension-code-block';
import Collaboration from '@tiptap/extension-collaboration';
import * as Y from 'yjs';

interface EditorProps {
  doc?: Y.Doc | null;
  content?: string;
  onChange?: (plainText: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export const Editor: React.FC<EditorProps> = ({
  doc,
  content = '',
  onChange,
  placeholder = 'Notunuzu yazın... (* madde listesi, ``` kod bloğu)',
  readOnly = false,
}) => {
  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          history: doc ? false : undefined, // Disable PM history when Collaboration/Yjs provides UndoManager
          codeBlock: false,
        }),
        CodeBlock.configure({
          HTMLAttributes: {
            class: 'bg-[#F4F2EE] font-mono text-sm p-3 rounded-code border border-[#E8E4DE]',
          },
        }),
        Placeholder.configure({
          placeholder,
        }),
        ...(doc
          ? [
              Collaboration.configure({
                document: doc,
                field: 'content',
              }),
            ]
          : []),
      ],
      content: doc ? undefined : content,
      editable: !readOnly,
      onUpdate: ({ editor }) => {
        onChange?.(editor.getText());
      },
    },
    [doc],
  );

  // Fallback initial content population for empty Y.Doc or non-doc mode
  useEffect(() => {
    if (!editor) return;

    if (doc) {
      const fragment = doc.getXmlFragment('content');
      if (fragment.length === 0 && content.trim().length > 0) {
        editor.commands.setContent(content);
      }
    } else if (content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, doc, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="w-full">
      <EditorContent editor={editor} className="prose prose-sm max-w-none focus:outline-none" />
    </div>
  );
};
