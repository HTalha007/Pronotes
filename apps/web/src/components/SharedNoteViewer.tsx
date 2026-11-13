import React from 'react';
import { Plus, Calendar, Share2, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  Button,
  Badge,
} from '@pronotes/ui';
import { useNotesStore } from '../stores/notesStore';

interface SharedNoteViewerProps {
  noteData: { title: string; content: string; date?: string } | null;
  onClose: () => void;
}

export const SharedNoteViewer: React.FC<SharedNoteViewerProps> = ({ noteData, onClose }) => {
  const [imported, setImported] = React.useState(false);
  const { createStandardNote } = useNotesStore();

  if (!noteData) return null;

  const handleImport = async () => {
    await createStandardNote(noteData.title, noteData.content);
    setImported(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <Dialog open={true} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-6">
        <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-[#E8E4DE] dark:border-[#3F3F4E]">
          <div className="flex items-center gap-2">
            <Badge variant="subtle" className="gap-1.5 py-1 px-2.5">
              <Share2 className="w-3.5 h-3.5 text-[#2F3A6B] dark:text-[#93A5F8]" />
              <span>Salt Okunur Paylaşılan Not</span>
            </Badge>
          </div>
          {noteData.date && (
            <div className="flex items-center gap-1 text-xs text-[#9A9AA2] dark:text-[#71717A]">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(noteData.date).toLocaleDateString('tr-TR')}</span>
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          <h1 className="text-xl font-bold text-[#2E2E38] dark:text-[#EDEDF0]">
            {noteData.title || 'Başlıksız Not'}
          </h1>

          <div className="text-sm text-[#2E2E38] dark:text-[#EDEDF0] leading-relaxed whitespace-pre-wrap font-sans bg-[#FAF8F5] dark:bg-[#282833] p-4 rounded-card border border-[#E8E4DE] dark:border-[#3F3F4E]">
            {noteData.content || 'İçerik bulunmuyor.'}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-[#E8E4DE] dark:border-[#3F3F4E]">
          <span className="text-xs text-[#9A9AA2] dark:text-[#71717A]">
            Pronotes Salt Okunur Paylaşım
          </span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Kapat
            </Button>
            <Button
              size="sm"
              onClick={handleImport}
              disabled={imported}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {imported ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Notlarıma Eklendi!</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Kendi Notlarıma Ekle</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
