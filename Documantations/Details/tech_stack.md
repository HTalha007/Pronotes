# Tech Stack & Engineering Blueprint (v1.1 - Verified PWA Release)

Bu doküman, `system_design.md` ve `mvp_scope.md` belgelerinde tanımlanan mimariyi hayata geçiren teknoloji yığınını ve araçları tanımlar.

## 1. Ana Teknolojiler (Core Stack)

*   **Programlama Dili:** TypeScript (Strict Mode). Tüm sistem tip güvenli (type-safe) olarak inşa edilmiştir (`tsconfig.base.json` referanslı).
*   **Monorepo Yöneticisi:** Turborepo (^2.11). Proje; `core`, `ui`, ve `web` paketlerine ayrılarak Clean Architecture standartlarında yönetilmektedir.

## 2. Frontend (İstemci / UI Katmanı)

*   **Framework:** React 18+ (Vite 6 tabanlı SPA/PWA).
    *   *Neden:* Next.js'in SSR özellikleri çevrimdışı öncelikli (offline-first) bir E2EE uygulaması için gereksiz karmaşıklık yaratır. Hızlı PWA için Vite idealdir.
*   **PWA Altyapısı:** `vite-plugin-pwa` (^0.21) & `workbox-window`.
    *   *Kapsam:* Web App Manifest, Service Worker (`registerType: 'autoUpdate'`), Google Fonts CacheFirst runtime caching (`fonts.googleapis.com` & `fonts.gstatic.com`) ve `beforeinstallprompt` tarayıcı içi kurulum desteği.
*   **State Management:** Zustand (^4.5).
    *   *Kullanım:* `notesStore`, `vaultStore`, `tagsStore`, `navigationStore`, `networkStore`.
*   **Stil ve Tasarım:** Tailwind CSS (^3.4) + Radix UI (^1.1 Headless Primitives).
    *   *Tasarım Dili:* Google Keep esintili "Quiet Paper" pastel paleti ve tam Karanlık Mod (Dark Mode) entegrasyonu.
    *   *İkon Seti:* `lucide-react` (erişilebilir ve homojen ikonografi).
*   **Zengin Metin Editörü:** Tiptap (^2.8 - ProseMirror tabanlı).
    *   *Özellikler:* Markdown sözdizimi, kod blokları, madde işaretli listeler, salt okunur (read-only) render desteği.
*   **Pencere ve Etkileşim:** Güvenli `NoteModal` mimarisi (izole kapat butonu, onay diyaloğu ile korunan silme, otomatik başlık odağı, min 44x44 px dokunma alanları).

## 3. Client Core (İş Mantığı ve Çevrimdışı Katman - `@pronotes/core`)

Bu katman tamamen UI-agnostik olarak geliştirilmiştir:

*   **CRDT & Conflict Resolution:** Yjs (^13.6).
    *   *Neden:* Metin tabanlı çakışmaları matematiksel olarak (vektör saatleri ile) birleştiren endüstri standardı.
*   **Yerel Veritabanı (Offline Storage):** IndexedDB (Wrapper olarak `idb` ^8.0).
    *   *Neden:* Cihaz internete bağlı değilken notların ve Yjs dokümanlarının cihazda kalıcı olarak saklanması için optimize edilmiş tarayıcı API'si.
*   **Şifreleme Motoru (Cryptography Engine):** WebCrypto API (Native).
    *   *Algoritma:* PBKDF2 (100.000 iterasyon, SHA-256) ve AES-256-GCM (12-byte rastgele IV).
    *   *Mimari Kural:* Şifreleme işlemleri ana akışı (Main Thread) bloklamaması için **Web Worker** (`crypto.worker.ts`) içinde asenkron çalıştırılmaktadır.
*   **Dışa Aktarma:** Client-side Markdown derleyici (`.md` dosya indirme ve panoya kopyalama).

## 4. Backend & Senkronizasyon Katmanı

*   **Mimari Standart:** "Dumb Relay" (Aptal Röle). Sunucu Kasa içeriklerini asla deşifre edemez veya anahtarlarına erişemez.
*   **Veritabanı ve Auth:** Supabase / PostgreSQL & JWT Auth desteği.
*   **Geliştirme & Test Gateway:** Çevrimdışı simülasyon ve E2E testleri için tasarlanmış izole bulut gateway desteği.

## 5. Kalite, Test ve CI/CD

*   **Birim Testleri:** Vitest (^1.6) - `@pronotes/core` paketinde 83/83 birim testi tam geçişle çalışmaktadır.
*   **E2E Doğrulama:** Otomatik tarayıcı alt ajanı ile 5 kritik senaryo (Kısayollar, NoteModal UX, Çevrimdışı banner, Bulut eşitleme, E2EE Sıfır Bilgi) %100 başarıyla doğrulanmıştır.
*   **Tip Güvenliği:** TypeScript Strict Mode (`tsc --noEmit`). Sıfır tip hatası.