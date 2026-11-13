import React, { useState } from 'react';
import { Share2, Copy, Check, Download, Link as LinkIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Input,
} from '@pronotes/ui';
import {
  copyNoteAsMarkdown,
  downloadNoteAsFile,
  generateShareUrl,
} from '../lib/note-export';

interface ShareExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  tagNames?: string[];
  isVault?: boolean;
}

export const ShareExportModal: React.FC<ShareExportModalProps> = ({
  isOpen,
  onClose,
  title,
  content,
  tagNames = [],
  isVault = false,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);

  const shareUrl = generateShareUrl(title, content);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyMarkdown = async () => {
    const ok = await copyNoteAsMarkdown(title, content, tagNames);
    if (ok) {
      setCopiedMd(true);
      setTimeout(() => setCopiedMd(false), 2000);
    }
  };

  const handleDownloadFile = () => {
    downloadNoteAsFile(title, content, tagNames);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-6">
        <DialogHeader className="flex flex-row items-center gap-3 pb-3 border-b border-[#E8E4DE] dark:border-[#3F3F4E]">
          <div className="w-10 h-10 rounded-full bg-[#E8ECFB] dark:bg-[#1E294A] flex items-center justify-center text-[#2F3A6B] dark:text-[#93A5F8]">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <DialogTitle className="text-base font-semibold">Paylaş ve Dışa Aktar</DialogTitle>
            <DialogDescription className="text-xs text-[#6B6B76] dark:text-[#A1A1AA]">
              Notunuzu Markdown formatında aktarın veya salt okunur link paylaşın.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {isVault ? (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-card text-xs text-amber-800 dark:text-amber-200 space-y-1">
              <span className="font-semibold block">⚠️ Şifreli Kasa Notu:</span>
              Bu not uçtan uca şifrelidir. Güvenliğiniz için Kasa notlarına genel paylaşım linki oluşturulamaz. Dilerseniz sadece Markdown çıktısı alabilirsiniz.
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#2E2E38] dark:text-[#EDEDF0] flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-[#2F3A6B] dark:text-[#93A5F8]" />
                <span>Salt Okunur Paylaşım Bağlantısı</span>
              </label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={shareUrl}
                  className="text-xs font-mono select-all bg-[#FAF8F5] dark:bg-[#282833]"
                />
                <Button
                  size="sm"
                  onClick={handleCopyLink}
                  className="gap-1 flex-shrink-0"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Kopyalandı</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Kopyala</span>
                    </>
                  )}
                </Button>
              </div>
              <p className="text-[11px] text-[#9A9AA2] dark:text-[#71717A]">
                Bu bağlantıya sahip olan herkes notunuzu salt okunur bir arayüzde görüntüleyebilir.
              </p>
            </div>
          )}

          <div className="pt-2 border-t border-[#E8E4DE] dark:border-[#3F3F4E] space-y-2">
            <span className="text-xs font-medium text-[#2E2E38] dark:text-[#EDEDF0] block">
              Dışa Aktarma Seçenekleri
            </span>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyMarkdown}
                className="gap-1.5 justify-center h-10 text-xs"
              >
                {copiedMd ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Kopyalandı!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Markdown Kopyala</span>
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadFile}
                className="gap-1.5 justify-center h-10 text-xs"
              >
                <Download className="w-4 h-4" />
                <span>.md Dosyası İndir</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-[#E8E4DE] dark:border-[#3F3F4E]">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Kapat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
