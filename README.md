# Pronotes (v1.0 - MVP)

> **"Sade Arayüz, Güçlü Markdown ve Uçtan Uca Şifreli Gizli Kasa"** sunan; çevrimdışı çalışabilen (Offline-First), sıfır bilgi prensipli (Zero-Knowledge E2EE) modern not uygulaması.

---

## 🏛️ Mimari ve Monorepo Yapısı

Proje, Clean Architecture prensiplerine uygun olarak **Turborepo** ile yönetilen monorepo mimarisinde kurulmuştur:

```text
Pronotes/
├── apps/
│   └── web/                     # React 18+ SPA / PWA (Vite, Tailwind, Zustand)
│       ├── src/
│       │   ├── workers/         # WebCrypto AES-256-GCM / PBKDF2 Web Worker
│       │   ├── stores/          # Zustand durum yönetimi (Notes, Vault, Auth)
│       │   ├── components/      # Görünüm bileşenleri (Editör, Modal, Kartlar)
│       │   └── lib/             # Supabase ve Worker istemcileri
│       ├── vite.config.ts       # Vite & VitePWA konfigürasyonu
│       └── tailwind.config.ts   # "Quiet Paper" pastel tasarım token'ları
├── packages/
│   ├── core/                    # UI-Agnostik Client Core İş Mantığı
│   │   ├── src/crypto/          # PBKDF2 ve AES-256-GCM kriptografi motoru
│   │   ├── src/storage/         # IndexedDB çevrimdışı kalıcı depolama (idb)
│   │   ├── src/crdt/            # Yjs CRDT çakışma çözücü (Conflict Resolution)
│   │   ├── src/sync/            # Dumb relay senkronizasyon yöneticisi
│   │   └── src/types/           # Standart ve Kasa notları tip tanımları
│   └── ui/                      # Paylaşılan UI Bileşen Kütüphanesi
│       └── src/components/      # Button, Card, Dialog (Radix UI), Input, Badge
├── turbo.json                   # Turborepo task pipeline (build, dev, type-check)
├── tsconfig.base.json           # Katı tip güvenliği (Strict Mode TypeScript)
└── Documantations/              # Ürün ve mühendislik dokümantasyonu
```

---

## 🛠️ Kurulumu Tamamlanan Framework ve Araçlar

| Alan | Seçim / Araç | Kurulum Durumu | Açıklama |
|---|---|---|---|
| **Monorepo** | **Turborepo** | ✅ Kurulu & Yapılandırıldı | Paketler arası önbellekli derleme ve task orkestrasyonu |
| **Dil** | **TypeScript (Strict)** | ✅ Kurulu | `tsconfig.base.json` ve tüm alt paketlerde tam tip güvenliği |
| **Frontend SPA** | **React 18 + Vite** | ✅ Kurulu | Hızlı derleme ve SPA performansı |
| **PWA Desteği** | **vite-plugin-pwa** | ✅ Kurulu & Entegre | Çevrimdışı önbellekleme ve Service Worker |
| **Stil & Tasarım** | **Tailwind CSS** | ✅ Yapılandırıldı | Tasarım dokümanlarındaki `Quiet Paper` renk paleti |
| **UI Primitifleri** | **Radix UI** | ✅ Entegre | Dialog, Dropdown, Slot ve Tooltip erişilebilir bileşenler |
| **Zengin Metin** | **Tiptap (ProseMirror)** | ✅ Entegre | Temel Markdown (kalın, italik, liste, kod bloğu) |
| **Durum Yönetimi** | **Zustand** | ✅ Entegre | `notesStore`, `vaultStore`, `authStore` |
| **E2EE Kripto** | **WebCrypto API** | ✅ Worker Entegre | PBKDF2 (100k iterasyon) + AES-256-GCM |
| **Yerel Depolama** | **IndexedDB (`idb`)** | ✅ Entegre | Çevrimdışı öncelikli kalıcı yerel depolama |
| **CRDT Motoru** | **Yjs** | ✅ Entegre | Vektör saatleri ile çakışmasız veri birleştirme |
| **Backend & Auth** | **Supabase JS** | ✅ Entegre | İstemci konfigürasyonu ve tip tanımları hazırlandı |

---

## 🚀 Çalıştırma Komutları

Geliştirme sunucusunu başlatmak için:

```bash
# Tüm monorepo için geliştirme modunu başlat
npm run dev

# TypeScript tip kontrollerini çalıştırma
npm run type-check

# Üretim (Production) derlemesi
npm run build
```
