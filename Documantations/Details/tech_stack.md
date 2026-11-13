# Tech Stack & Engineering Blueprint (v1.0 - MVP)

Bu doküman, `system_design.md` ve `mvp_scope.md` belgelerinde tanımlanan mimariyi hayata geçirecek teknoloji yığınını ve araçları tanımlar.

## 1. Ana Teknolojiler (Core Stack)

*   **Programlama Dili:** TypeScript (Strict Mode). Tüm sistem tip güvenli (type-safe) olarak inşa edilecektir.
*   **Monorepo Yöneticisi:** Turborepo. Proje; `core`, `ui`, ve `web` paketlerine ayrılarak Clean Architecture standartlarında yönetilecektir.

## 2. Frontend (İstemci / UI Katmanı)

*   **Framework:** React 18+ (Vite tabanlı oluşturulmuş SPA/PWA). 
    *   *Neden:* Next.js'in SSR özellikleri çevrimdışı öncelikli (offline-first) bir E2EE uygulaması için gereksiz karmaşıklık yaratır. Hızlı PWA için Vite idealdir.
*   **State Management:** Zustand.
    *   *Neden:* Redux'a göre çok daha hafif ve boilerplate kodu azdır. Yjs state'ini UI'a bağlamak için mükemmel bir uyumu vardır.
*   **Stil ve Tasarım:** Tailwind CSS + Radix UI (Headless UI).
    *   *Neden:* `requirements.md`'deki minimalist UI hedefini, hazır ve erişilebilir (a11y) Radix bileşenlerini Tailwind ile giydirerek hızla üretebiliriz.
*   **Zengin Metin Editörü:** Tiptap (ProseMirror tabanlı).
    *   *Neden:* Sadece temel Markdown özellikleri gerektirdiği için modüler yapısı kusursuzdur. Yjs ile yerleşik (native) ortak çalışma ve CRDT desteği vardır.

## 3. Client Core (İş Mantığı ve Çevrimdışı Katman)

Bu katman tamamen UI-agnostik olacak ve `@core/logic` pakedi altında yaşayacaktır.

*   **CRDT & Conflict Resolution:** Yjs.
    *   *Neden:* Metin tabanlı çakışmaları matematiksel olarak (vektör saatleri ile) birleştiren endüstri standardı.
*   **Yerel Veritabanı (Offline Storage):** IndexedDB (Wrapper olarak `idb` veya `y-indexeddb`).
    *   *Neden:* Cihaz internete bağlı değilken Yjs dokümanlarının cihazda kalıcı (persistent) olarak saklanması için en hızlı tarayıcı API'sidir.
*   **Şifreleme Motoru (Cryptography):** WebCrypto API (Native).
    *   *Algoritma:* PBKDF2 (Master şifreden anahtar türetmek için) ve AES-256-GCM (Notları ve CRDT vektörlerini şifrelemek için).
    *   *Mimari Kural:* Şifreleme işlemleri ana akışı (Main Thread) bloklamaması için kesinlikle **Web Workers** içinde çalıştırılacaktır (`NFR-1` hız kısıtı).

## 4. Backend & Veri Katmanı

*   **BaaS (Backend as a Service):** Supabase.
    *   *Kimlik Doğrulama:* Supabase Auth (JWT tabanlı, merkezi kimlik yönetimi).
    *   *Veritabanı:* PostgreSQL. CRDT operasyon geçmişleri (binary state'ler) `BYTEA` veya Base64 formatında `JSONB` kolonlarında şifreli blob'lar olarak tutulacaktır.
*   **Gerçek Zamanlı Senkronizasyon (Sync Service):** Hocuspocus (Yjs için optimize edilmiş Node.js / WebSocket sunucusu) veya Supabase Realtime.
    *   *Mimari Kural:* Sunucu (Hocuspocus), Yjs dokümanlarının sadece şifreli (E2EE) hallerini WebSocket üzerinden iletecek bir "aptal röle" (dumb relay) görevi görecektir. Sunucu verinin içeriğini asla parse edemez.

## 5. Altyapı ve CI/CD (DevOps)

*   **Hosting:** Vercel veya Cloudflare Pages (Frontend / PWA için küresel Edge caching).
*   **Backend Hosting:** Supabase Cloud (Veritabanı ve Auth için) + Render/Railway (Eğer Hocuspocus için özel Node.js WebSocket sunucusu gerekirse).
*   **CI/CD:** GitHub Actions (TypeScript tip kontrolü, Linting ve otomatik Vercel deploy süreçleri).