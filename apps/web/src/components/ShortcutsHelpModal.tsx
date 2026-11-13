import React from 'react';
import { Keyboard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Badge,
} from '@pronotes/ui';

interface ShortcutsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
}

interface ShortcutCategory {
  title: string;
  items: ShortcutItem[];
}

const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
  {
    title: 'Not İşlemleri',
    items: [
      { keys: ['N', 'veya', 'C'], description: 'Yeni standart not oluştur' },
      { keys: ['Ctrl', 'Alt', 'N'], description: 'Hızlı yeni not aç' },
      { keys: ['Ctrl', 'Shift', 'V'], description: 'Yeni şifreli kasa notu oluştur' },
    ],
  },
  {
    title: 'Arama ve Gezinme',
    items: [
      { keys: ['/'], description: 'Arama kutusuna odaklan' },
      { keys: ['Ctrl', 'K'], description: 'Arama kutusuna odaklan ve seç' },
      { keys: ['Esc'], description: 'Açık pencereyi / modalı kapat' },
    ],
  },
  {
    title: 'Gizli Kasa ve Güvenlik',
    items: [
      { keys: ['Ctrl', 'Shift', 'L'], description: 'Kasa kilidini aç veya anında kilitle' },
    ],
  },
  {
    title: 'Görünüm ve Yardım',
    items: [
      { keys: ['T'], description: 'Karanlık / Açık mod arasında geçiş yap' },
      { keys: ['?'], description: 'Klavye kısayolları kılavuzunu aç' },
    ],
  },
];

export const ShortcutsHelpModal: React.FC<ShortcutsHelpModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-6">
        <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-[#E8E4DE] dark:border-[#3F3F4E]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#E8ECFB] dark:bg-[#1E294A] flex items-center justify-center text-[#2F3A6B] dark:text-[#93A5F8]">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-[#2E2E38] dark:text-[#EDEDF0]">
                Klavye Kısayolları
              </DialogTitle>
              <p className="text-xs text-[#9A9AA2] dark:text-[#71717A]">
                Hızlı ve kesintisiz not alma için kısayollar
              </p>
            </div>
          </div>
          <Badge variant="subtle" className="text-[10px] font-mono">
            v1.1
          </Badge>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-3 divide-y divide-[#F0EDE8] dark:divide-[#32323D]">
          {SHORTCUT_CATEGORIES.map((category) => (
            <div key={category.title} className="pt-3 first:pt-0 space-y-2">
              <h4 className="text-xs font-semibold text-[#6B6B76] dark:text-[#A1A1AA] uppercase tracking-wider">
                {category.title}
              </h4>
              <div className="space-y-1.5">
                {category.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-1 text-xs text-[#2E2E38] dark:text-[#EDEDF0]"
                  >
                    <span>{item.description}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((k, kIdx) =>
                        k === 'veya' ? (
                          <span key={kIdx} className="text-[10px] text-[#9A9AA2] dark:text-[#71717A] px-0.5">
                            veya
                          </span>
                        ) : (
                          <kbd
                            key={kIdx}
                            className="px-1.5 py-0.5 text-[11px] font-mono bg-[#FAF8F5] dark:bg-[#282833] border border-[#E8E4DE] dark:border-[#3F3F4E] rounded text-[#2E2E38] dark:text-[#EDEDF0] shadow-2xs font-semibold"
                          >
                            {k}
                          </kbd>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-[#E8E4DE] dark:border-[#3F3F4E] flex items-center justify-between text-xs text-[#9A9AA2] dark:text-[#71717A]">
          <span>Not yazarken harf kısayolları devre dışı kalır.</span>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Kapat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
