# Pronotes (v1.1 - PWA & Enhanced Note Experience)

> **"Sade Arayüz, Güçlü Markdown ve Uçtan Uca Şifreli Gizli Kasa"** sunan; çevrimdışı tam fonksiyonel çalışabilen (Offline-First PWA), sıfır bilgi prensipli (Zero-Knowledge E2EE) ve CRDT tabanlı modern not alma uygulaması.

---

## ✨ Öne Çıkan Özellikler (v1.1)

- 🔒 **Sıfır Bilgi Uçtan Uca Şifreli Kasa (E2EE Vault):** WebCrypto API, PBKDF2 (100.000 iterasyon) ve AES-256-GCM ile Web Worker üzerinde asenkron şifreleme. Kasa notlarının anahtarları asla sunucuya gitmez; ağ trafiğinde ve yerel depolamada düz metin asla yer almaz.
- 📱 **Tam PWA & Çevrimdışı Çalışma (Offline-First):** `vite-plugin-pwa` ile masaüstü/mobil ana ekrana yükleme desteği, Service Worker ve Google Fonts runtime caching ile internetsiz tam fonksiyonel kullanım.
- 📡 **Çevrimdışı Bildirim Çubuğu (Offline/Online Banner):** Ağ bağlantısı kesildiğinde yerel kaydı bildiren kehribar uyarı, bağlantı sağlandığında senkronizasyonu onaylayan yeşil geçiş bildirimi.
- 🔄 **CRDT Çakışma Çözümü (Conflict-Free Yjs):** Cihazlar arası çevrimdışı ve eşzamanlı düzenlemeleri matematiksel vektör saatleriyle veri kaybı olmadan birleştirme.
- 📝 **Zengin Markdown Editörü (Tiptap):** Kalın, italik, madde işaretli liste, görev listesi ve syntax-highlighted kod blokları.
- 📤 **Markdown Dışa Aktarma & Salt Okunur Paylaşım:** Notları `.md` dosyası olarak indirme, Markdown olarak panoya kopyalama ve `#share/...` URL hash ile sunucuya ihtiyaç duymadan salt okunur paylaşma.
- 🎨 **Google Keep Pastel Renkleri & Etiketler (Tagging):** Notları 6 pastel renkle gruplama, dinamik etiket oluşturma/filtreleme.
- 🌙 **Karanlık Mod (Dark Mode):** Tam Tailwind CSS uyumlu, göz yormayan karanlık tema ve hızlı geçiş.
- ⌨️ **Klavye Kısayolları:** Hızlı üretkenlik için `N` (Yeni Not), `/` (Arama), `Ctrl+K` (Hızlı Arama), `?` (Kısayol Rehberi) ve `Esc` (Modal Kapatma). Yazı yazarken kısayolların engellenmesi koruması.
- 🛡️ **Güvenli Not Penceresi (NoteModal UX):** Kapat ($X$) butonu izole edilmiş, Sil ($Trash2$) butonu alt bara taşınmış ve iki aşamalı silme onay diyaloğu ile korunmuştur. Otomatik başlık odaklanması ve 44x44 px a11y dokunma hedefleri.

---

## 🏛️ Mimari ve Monorepo Yapısı

Proje, Clean Architecture prensiplerine uygun olarak **Turborepo** ile yönetilen monorepo mimarisinde kurulmuştur:

```text
Pronotes/
├── apps/
│   └── web/                     # React 18+ SPA / PWA (Vite, Tailwind, Zustand)
│       ├── public/              # SVG App ikonları ve manifest varlıkları
│       ├── src/
│       │   ├── workers/         # WebCrypto AES-256-GCM / PBKDF2 Web Worker
│       │   ├── stores/          # Zustand durum yönetimi (Notes, Vault, Tags, Network)
│       │   ├── hooks/           # usePwaInstall, useKeyboardShortcuts
│       │   ├── components/      # Görünüm bileşenleri (NoteModal, Sidebar, Header, Editor)
│       │   └── lib/             # Bulut ve yerel depolama istemcileri
│       ├── vite.config.ts       # Vite & VitePWA manifest + Workbox caching
│       └── tailwind.config.ts   # "Quiet Paper" pastel tasarım token'ları
├── packages/
│   ├── core/                    # UI-Agnostik Client Core İş Mantığı
│   │   ├── src/crypto/          # PBKDF2 ve AES-256-GCM kriptografi motoru
│   │   ├── src/storage/         # IndexedDB çevrimdışı kalıcı depolama (idb)
│   │   ├── src/crdt/            # Yjs CRDT çakışma çözücü (Conflict Resolution)
│   │   ├── src/sync/            # Dumb relay senkronizasyon yöneticisi
│   │   └── src/domain/          # Standart, Kasa ve Etiket tip tanımları
│   └── ui/                      # Paylaşılan UI Bileşen Kütüphanesi
│       └── src/components/      # Button, Card, Dialog (Radix UI), Input, Badge
├── turbo.json                   # Turborepo task pipeline (build, dev, test, type-check)
├── tsconfig.base.json           # Katı tip güvenliği (Strict Mode TypeScript)
└── Documantations/              # Ürün ve mühendislik mimari dokümantasyonu
```

---

## 🛠️ Teknoloji Yığını

| Alan | Seçim / Araç | Sürüm / Durum | Açıklama |
|---|---|---|---|
| **Monorepo** | **Turborepo** | ^2.11 | Paketler arası önbellekli derleme ve task orkestrasyonu |
| **Dil** | **TypeScript (Strict)** | ^5.6 | `tsconfig.base.json` ve tüm alt paketlerde tam tip güvenliği |
| **Frontend SPA** | **React 18 + Vite** | ^18.3 / ^6.4 | Yüksek performanslı derleme ve modüler SPA |
| **PWA Desteği** | **vite-plugin-pwa** | ^0.21 | Service Worker, Google Fonts runtime caching ve Web App Manifest |
| **Stil & Tasarım** | **Tailwind CSS** | ^3.4 | "Quiet Paper" pastel paleti ve Karanlık Mod desteği |
| **UI Primitifleri** | **Radix UI** | ^1.1 | Dialog, Dropdown, Slot ve Tooltip erişilebilir (a11y) bileşenler |
| **Zengin Metin** | **Tiptap (ProseMirror)** | ^2.8 | Markdown sözdizimi, kod bloğu ve liste desteği |
| **Durum Yönetimi** | **Zustand** | ^4.5 | `notesStore`, `vaultStore`, `tagsStore`, `networkStore` |
| **E2EE Kripto** | **WebCrypto API** | Native | Worker içinde PBKDF2 (100k iterasyon) + AES-256-GCM |
| **Yerel Depolama** | **IndexedDB (`idb`)** | ^8.0 | Çevrimdışı öncelikli kalıcı yerel veritabanı |
| **CRDT Motoru** | **Yjs** | ^13.6 | Vektör saatleri ile deterministik çakışmasız veri birleştirme |
| **BaaS / Ağ** | **Supabase / Local Gateway** | Entegre | Bulut senkronizasyonu ve kullanıcı oturum yönetimi |

---

## 🚀 Çalıştırma ve Test Komutları

Geliştirme sunucusunu başlatmak ve testleri koşturmak için:

```bash
# Tüm monorepo için geliştirme modunu başlat (localhost:3000)
npm run dev

# TypeScript tip kontrollerini çalıştırma
npm run type-check

# Birim testleri çalıştırma (Vitest)
npm test

# Üretim (Production) derlemesi ve PWA dosyalarını oluşturma
npm run build
```
