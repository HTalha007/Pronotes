# Not Uygulaması (MVP) – Ürün ve Mühendislik Dokümantasyonu

> **Sürüm:** v1.0 (MVP)
> **Kaynak dokümanlar:** `requirements.md`, `mvp_scope.md`, `system_design.md`, `tech_stack.md`, `acceptance_criteria.md`
> **Amaç:** Beş ayrı dokümanı tek bir referans noktasında toplamak; ürün vizyonu ile MVP kapsamı arasındaki farkı, mimariyi, teknoloji seçimlerini, kabul kriterlerini ve açık kararları net biçimde göstermek.

---

## İçindekiler

1. [Ürün Özeti](#1-ürün-özeti)
2. [Hedef Kullanıcılar](#2-hedef-kullanıcılar)
3. [MVP Kapsamı (MoSCoW)](#3-mvp-kapsamı-moscow)
4. [Fonksiyonel Gereksinimler ve MVP Durumu](#4-fonksiyonel-gereksinimler-ve-mvp-durumu)
5. [Fonksiyonel Olmayan Gereksinimler ve MVP Durumu](#5-fonksiyonel-olmayan-gereksinimler-ve-mvp-durumu)
6. [Sistem Mimarisi](#6-sistem-mimarisi)
7. [Teknoloji Yığını](#7-teknoloji-yığını)
8. [Güvenlik Modeli (E2EE Kasa)](#8-güvenlik-modeli-e2ee-kasa)
9. [Kabul Kriterleri ve Test Kontrol Listesi](#9-kabul-kriterleri-ve-test-kontrol-listesi)
10. [Başarı Metrikleri](#10-başarı-metrikleri)
11. [UI/UX İlkeleri](#11-uiux-ilkeleri)
12. [Yol Haritası](#12-yol-haritası)
13. [Dokümanlar Arası Tutarsızlıklar ve Açık Sorular](#13-dokümanlar-arası-tutarsızlıklar-ve-açık-sorular)
14. [Sözlük](#14-sözlük)

---

## 1. Ürün Özeti

### 1.1 Uzun Vadeli Vizyon
Günlük kullanıcılar için Google Keep sadeliğinde başlayan; "Power User" ve ekipler için zengin metin düzenleme (Markdown), Uçtan Uca Şifreli (E2EE) Kasa, CRDT tabanlı çevrimdışı çalışma ve gerçek zamanlı ortak çalışma sunan bir üretkenlik platformu.

**İş modeli (vizyon):** Bireysel kullanıcılar için Freemium SaaS, kurumsal tarafta B2B (takım lisanslama).

### 1.2 MVP Ürün Hedefi
> **"Sade Arayüz, Güçlü Markdown ve Uçtan Uca Şifreli Gizli Kasa"** sunan; bireysel odaklı, çevrimdışı çalışabilen, web tabanlı bir not uygulaması.

MVP'de **paradan çok ürün-pazar uyumu (Product-Market Fit)** kanıtlanmak istenir. Rekabet avantajının çekirdeği **Şifreli Kasa**'dır.

### 1.3 Mimari Vizyon
Çevrimdışı öncelikli (Offline-First), istemci tarafında şifreleme yapan (Zero-Knowledge), CRDT tabanlı senkronizasyon kullanan, ölçeklenebilir not alma altyapısı.

---

## 2. Hedef Kullanıcılar

| Persona | Profil | İhtiyaç | MVP'de hedef mi? |
|---|---|---|---|
| **Günlük Kullanıcı** ("Sadelik Arayan") | Öğrenci, ev hanımı, standart ofis çalışanı | Fikir, alışveriş listesi, yapılacakları sıfır gecikmeyle kaydetmek; klasör karmaşasından kaçınmak | ✅ Evet |
| **Power User / Geliştirici** ("Güvenlik ve Fonksiyon Arayan") | Yazılım mühendisi, veri bilimci, araştırmacı | Kod blokları, API anahtarı/token saklamak için yüksek güvenlik, veri kaybı olmayacağı garantisi | ✅ Evet (Kasa + Markdown) |
| **Kurumsal Ekip / Proje Yöneticisi** ("İşbirliği Arayan") | Startup kurucusu, ürün yöneticisi, tasarım ekibi | Ekip içi paylaşım, eşzamanlı düzenleme, rol yönetimi | ❌ Hayır (v2.0+ / kapsam dışı) |

---

## 3. MVP Kapsamı (MoSCoW)

### 3.1 Must-Have (v1.0)

| Özellik | Açıklama |
|---|---|
| **Minimalist UI** | Google Keep benzeri grid / post-it görünümü |
| **Temel Notlar** | Sunucuda senkronize edilen, hızlı aranabilir metin notları |
| **Şifreli Kasa (E2EE)** | Kullanıcının belirlediği "Master Password" ile açılan; veriler tarayıcıda AES-256-GCM ile şifrelenip buluta anlamsız blob olarak giden güvenli alan |
| **Temel Markdown** | `/` (slash) menüsü **olmadan**; kalın, italik, liste, kod bloğu |
| **Çevrimdışı Temel Destek** | İnternet yokken not alma; online olunca Yjs (CRDT) ile çakışmasız senkronizasyon |
| **Platform** | Yalnızca Responsive Web App + PWA |

### 3.2 Should-Have (v1.1 – hızlı güncellemeler)
- Notları salt okunur (read-only) link olarak paylaşma
- Not renklendirme ve etiketleme (Tagging)
- Karanlık Mod (Dark Mode)

### 3.3 Could-Have (v2.0)
- Mobil native uygulamalar (iOS / Android)
- Yüz tanıma / parmak izi ile Kasa açılışı
- Markdown tabloları ve gelişmiş bağlantılı not (Backlinking) yapısı

### 3.4 Won't-Have (şu an kapsam dışı)
- Aynı not üzerinde eşzamanlı ortak çalışma (Multiplayer / canlı imleçler)
- Not içi yorum ve `@` ile etiketleme
- Kurumsal paketler, ekip çalışma alanları, yetki yönetimi (Admin Panel)

---

## 4. Fonksiyonel Gereksinimler ve MVP Durumu

`requirements.md` tam ürün vizyonunu tanımlar. Aşağıdaki tablo her gereksinimin MVP'deki karşılığını gösterir.

| ID | Gereksinim | MVP Durumu |
|---|---|---|
| **FR-1** | Açılış ekranı minimalist kart/post-it ızgarası (grid) olmalı | ✅ Kapsamda |
| **FR-2** | `/` tuşu veya Markdown sözdizimi ile zengin metin editörü aktif olmalı (kod bloğu, tablo, başlık hiyerarşisi) | ⚠️ Kısmen. Yalnızca sözdizimi tabanlı Markdown (kalın, italik, liste, kod bloğu). **Slash menüsü ve tablolar yok** |
| **FR-3** | Standart notlar: sunucuda şifreli, aranabilir, şifre sıfırlamaya uygun | ✅ Kapsamda (bkz. [Açık Soru #2](#13-dokümanlar-arası-tutarsızlıklar-ve-açık-sorular)) |
| **FR-4** | Master Password veya biyometrik (FaceID/Parmak İzi) ile açılan Şifreli Kasa | ⚠️ Kısmen. Yalnızca Master Password. Biyometrik v2.0 |
| **FR-5** | Kasa notları cihazda uçtan uca şifrelenmeli (Zero-Knowledge), sunucuya yalnızca şifreli blok gitmeli; sunucuda aranamaz ve paylaşılamaz | ✅ Kapsamda |
| **FR-6** | İnternetsiz yeni not oluşturma / düzenleme (Offline-first) | ✅ Kapsamda |
| **FR-7** | Çevrimdışı/çevrimiçi çakışmaları CRDT ile satır ve karakter bazında otomatik birleştirme (sıfır veri kaybı) | ✅ Kapsamda (tek kullanıcının birden fazla cihazı için) |
| **FR-8** | Standart notları e-posta daveti veya link ile paylaşma | ⚠️ Yalnızca salt okunur link, v1.1'de. E-posta daveti kapsam dışı |
| **FR-9** | Canlı imleç ve eşzamanlı düzenleme (Multiplayer) | ❌ Won't-Have |
| **FR-10** | Blok yorumları ve `@` ile kullanıcı etiketleme | ❌ Won't-Have |
| **FR-11** | Freemium model | ❌ MVP kapsamında listelenmemiş |
| **FR-12** | "Pro" ve "Team" abonelik katmanları, ödeme geçidi | ❌ MVP kapsamında listelenmemiş |
| **FR-13** | Merkezi faturalandırma (admin panel), rol tabanlı yetkilendirme | ❌ Won't-Have |

---

## 5. Fonksiyonel Olmayan Gereksinimler ve MVP Durumu

| ID | Gereksinim | MVP Durumu |
|---|---|---|
| **NFR-1** | İlk açılış (Time to Interactive) < **1.5 sn** | ✅ Kapsamda (yalnızca web/PWA) |
| **NFR-2** | Ortak çalışmada tuş vuruşu en fazla **50 ms** gecikmeyle diğer kullanıcıya yansımalı | ❌ Multiplayer kapsam dışı. MVP'de cihazlar arası hedef: **≤ 3 sn** |
| **NFR-3** | Yatay ölçeklenebilir (auto-scaling) sunucu mimarisi | ⚠️ Yönetilen servislerle (Supabase vb.) karşılanması beklenir; MVP için açık bir kabul kriteri yok |
| **NFR-4** | Standart notlar: uçuşta TLS 1.3, sunucuda AES-256 | ✅ Kapsamda |
| **NFR-5** | Kasa: istemci tarafında AES-256-GCM, anahtarlar asla sunucuya iletilmez | ✅ Kapsamda |
| **NFR-6** | GDPR ve SOC-2 uyumluluğuna baştan hazır tasarım | ⚠️ MVP'de açık bir iş kalemi yok, sonraya kalmaması için takip edilmeli |
| **NFR-7** | Onboarding: kayıttan ilk nota **en fazla 3 tıklama / 15 sn** | ⚠️ Kabul kriterlerinde yer almıyor, eklenmesi önerilir |
| **NFR-8** | Web, iOS, Android'de %100 tutarlı deneyim | ❌ MVP yalnızca PWA. Native uygulamalar v2.0 |

---

## 6. Sistem Mimarisi

### 6.1 Bileşenler

**Client Core (paylaşılan kütüphane, UI'dan bağımsız)**
- **Local Storage Manager:** İstemci tarafı verileri (IndexedDB; mobilde SQLite) yönetir. **Tüm okuma/yazma önce buraya** yapılır.
- **Cryptography Engine:** AES-256-GCM şifreleme/deşifreleme; Master Password'den anahtar türetme.
- **CRDT Resolver (Yjs):** Yerel ve uzak veriler arasındaki metin çakışmalarını matematiksel olarak birleştirir.
- **Sync Manager:** Çevrimiçi/çevrimdışı durumu dinler, güncellemeleri kuyruğa alır, backend ile haberleşir.

**Client UI (Presentation)**
- Web/PWA arayüzü. Yalnızca Core'un sunduğu arayüzleri tüketir, **iş mantığı içermez**.

**Backend Servisleri (Microservices / Modüler Monolit)**
- **API Gateway:** İstekleri karşılar, JWT doğrular, ilgili servise yönlendirir.
- **Auth Service:** Kayıt, giriş, token üretimi.
- **Sync Service (WebSocket):** İstemciler arası CRDT güncellemelerini alır, doğrular, veritabanına yazar.

**Veri Katmanı**
- **Primary DB:** CRDT metadatası ve şifreli not blob'ları (esnek doküman yapısı).
- **Cache (Redis):** Aktif WebSocket bağlantı durumu ve oturum bilgileri.

### 6.2 Mimari Diyagram

```mermaid
flowchart LR
  subgraph Client["İstemci (Web / PWA)"]
    UI["Client UI<br/>React + Tiptap"]
    subgraph Core["Client Core (@core/logic)"]
      LSM["Local Storage Manager<br/>IndexedDB"]
      CRYPTO["Cryptography Engine<br/>WebCrypto (Web Worker)"]
      CRDT["CRDT Resolver<br/>Yjs"]
      SYNC["Sync Manager"]
    end
    UI --> Core
    CRDT --> LSM
    CRDT --> CRYPTO
    CRYPTO --> SYNC
    LSM --> SYNC
  end

  subgraph Backend["Backend"]
    GW["API Gateway<br/>JWT doğrulama"]
    AUTH["Auth Service<br/>Supabase Auth"]
    WS["Sync Service<br/>Hocuspocus / Supabase Realtime"]
    DB[("PostgreSQL<br/>CRDT state + şifreli blob")]
    REDIS[("Redis<br/>bağlantı / oturum")]
  end

  SYNC <-- "WebSocket / TLS" --> WS
  SYNC -- "HTTPS" --> GW
  GW --> AUTH
  WS --> DB
  WS --> REDIS
```

### 6.3 Veri Akışları

**A) Standart Not Senkronizasyonu (Çevrimdışı → Çevrimiçi)**
1. Kullanıcı internet yokken not yazar.
2. Client Core değişikliği Yjs (CRDT) formatına çevirir ve yerel veritabanına kaydeder.
3. Kullanıcı internete bağlanır.
4. Sync Manager bekleyen CRDT güncellemelerini paketler ve Sync Service'e (WebSocket) gönderir.
5. Sync Service gelen operasyonları Primary DB'deki not geçmişinin üzerine "yeni operasyonlar" olarak yazar ve varsa diğer aktif cihazlara anında push eder.

**B) Şifreli Kasa Yazma**
1. Kullanıcı Master Password girer.
2. Cryptography Engine, şifreden KDF ile **bellekte tutulan** bir anahtar üretir.
3. Kullanıcı notu düzenler; CRDT Resolver değişiklikleri operasyon vektörüne çevirir.
4. Cryptography Engine CRDT vektörünü **AES-256-GCM ile tamamen şifreler**.
5. Sync Manager şifreli blob'u sunucuya gönderir. Sunucu veriyi okuyamaz, yalnızca saklar ve diğer cihazlara aktarır.

### 6.4 Teknik Kısıtlar

| Kısıt | Sonuç |
|---|---|
| **Sunucu tarafında arama yapılamaz (Kasa)** | Kasa aramaları yalnızca cihazda, şifre çözüldükten sonra yerel indeksleme ile yapılır |
| **Şifre kurtarma imkânsız** | Master Password sunucuya gitmediği için sıfırlama yoktur. Unutulursa Kasa verisi kriptografik olarak kurtarılamaz |
| **Payload şişmesi** | CRDT, metnin kendisinden çok ekleme/silme geçmişini tuttuğu için boyut zamanla büyür. İstemci ve sunucuda periyodik Garbage Collection / geçmiş sıkıştırma şarttır |
| **Performans bütçesi** | 1.5 sn hedefi için şifreleme ve CRDT işlemleri **Web Worker**'larda asenkron çalışmalı, Main Thread bloklanmamalı |

---

## 7. Teknoloji Yığını

### 7.1 Ana Teknolojiler
| Alan | Seçim |
|---|---|
| Dil | **TypeScript (Strict Mode)** |
| Monorepo | **Turborepo**, paketler: `core`, `ui`, `web` (Clean Architecture) |

### 7.2 Frontend
| Alan | Seçim | Gerekçe |
|---|---|---|
| Framework | **React 18+ (Vite, SPA/PWA)** | Next.js SSR'ı offline-first bir E2EE uygulama için gereksiz karmaşıklık; Vite hızlı PWA için ideal |
| State | **Zustand** | Redux'tan hafif, az boilerplate, Yjs state'ini UI'a bağlamak kolay |
| Stil | **Tailwind CSS + Radix UI** | Erişilebilir (a11y) hazır bileşenleri hızla minimalist arayüze dönüştürmek |
| Editör | **Tiptap (ProseMirror)** | Modüler yapı, temel Markdown için yeterli; Yjs ile yerleşik CRDT desteği |

### 7.3 Client Core (`@core/logic`)
| Alan | Seçim | Not |
|---|---|---|
| CRDT | **Yjs** | Vektör saatleriyle metin çakışma çözümü |
| Yerel DB | **IndexedDB** (`idb` veya `y-indexeddb`) | Yjs dokümanlarını cihazda kalıcı saklamak için |
| Kriptografi | **WebCrypto API** | **PBKDF2** (anahtar türetme) + **AES-256-GCM** (şifreleme). **Mutlaka Web Worker içinde** |

### 7.4 Backend ve Veri
| Alan | Seçim | Not |
|---|---|---|
| BaaS | **Supabase** | |
| Kimlik doğrulama | **Supabase Auth** (JWT) | |
| Veritabanı | **PostgreSQL** | CRDT state'leri `BYTEA` veya Base64 `JSONB` kolonlarında şifreli blob olarak |
| Sync | **Hocuspocus** (Node.js WS) **veya Supabase Realtime** | Sunucu "aptal röle" (dumb relay) olmalı, Kasa içeriğini asla parse edememeli |

### 7.5 Altyapı ve CI/CD
- **Frontend hosting:** Vercel veya Cloudflare Pages (global edge cache)
- **Backend hosting:** Supabase Cloud + (gerekirse Hocuspocus için) Render/Railway
- **CI/CD:** GitHub Actions (tip kontrolü, lint, otomatik deploy)

---

## 8. Güvenlik Modeli (E2EE Kasa)

| Konu | Kural |
|---|---|
| **Algoritmalar** | PBKDF2 (anahtar türetme) + AES-256-GCM (şifreleme) |
| **Master Password** | İlk girişte en az **8 karakter** |
| **Anahtar yönetimi** | Türetilen anahtarlar `localStorage`'a düz metin yazılamaz. Oturum kapanınca bellekten silinir |
| **Sunucuya giden veri** | Yalnızca anlamsız byte dizileri (blob). Network sekmesinde düz metin görünmemeli |
| **Parola doğrulama** | Yanlış parola, sunucuya sormadan, yerel kriptografik **MAC hatası** yakalanarak "Şifre Yanlış" uyarısıyla bildirilir |
| **Şifremi Unuttum** | **Olmamalı.** Verilerin kurtarılamayacağı UI'da net biçimde belirtilmeli |
| **İş parçacığı** | Tüm kripto işlemleri Web Worker'da. Yazma sırasında takılma olmamalı |
| **Erişim** | Ana şifre girilmeden Kasa sekmesine erişilemez. API şifreli veriyi dönse bile deşifre edilemediği için gösterilemez |
| **Paylaşım / Arama** | Kasa notları sunucuda aranamaz ve paylaşılamaz |
| **Standart notlar** | TLS 1.3 ile iletim, sunucuda AES-256 ile dinlenme halinde şifreleme |

---

## 9. Kabul Kriterleri ve Test Kontrol Listesi

> Aşağıdaki maddeler `acceptance_criteria.md`'nin özetidir. Bir özellik, ilgili tüm maddeler sağlandığında "Bitti" (Definition of Done) sayılır. QA süreçleri bu listeye göre yürütülür.

### 9.1 Temel Not Senkronizasyonu
**Fonksiyonel**
- [ ] "Yeni Not" tıklanınca boş bir not kartı anında oluşur ve odaklanır
- [ ] İçerik değişince en geç **2 sn** içinde sunucuya (Supabase) otomatik kaydedilir
- [ ] Silinen not UI'dan anında kalkar (optimistic update), sunucuda arka planda silinir

**Tutarlılık**
- [ ] Bir cihazda eklenen/güncellenen/silinen not, aynı hesabın diğer açık cihazında en geç **3 sn** içinde görünür

**Performans ve UI**
- [ ] Ana ekran **< 1.5 sn** yüklenir (NFR-1)
- [ ] Google Keep tarzı masonry grid; kartlar ekran boyutuna göre dinamik dizilir

**Uç durumlar**
- [ ] Tek seferde **50.000 karakter** yapıştırılınca UI thread bloklanmaz, kayıt asenkron yapılır
- [ ] Ağ tamamen koptuğunda kullanıcı uyarı görmeden yazmaya devam eder

### 9.2 Şifreli Kasa (E2EE)
**Fonksiyonel**
- [ ] İlk girişte en az 8 karakterlik Master Password belirlenebilir
- [ ] Ana şifre girilmeden Kasa'ya erişilemez
- [ ] Kasa notları sunucuya düz metin değil, **AES-256-GCM** ile şifrelenmiş blob olarak gider (Network sekmesinde doğrulanır)

**Tutarlılık**
- [ ] 1. cihazda yazılan şifreli not, Kasası açık olan 2. cihazda anında deşifre edilip gösterilir

**Güvenlik ve performans**
- [ ] PBKDF2 ve AES-256-GCM işlemleri Web Worker'da, yazarken takılma yok
- [ ] Türetilmiş anahtarlar `localStorage`'a düz metin yazılmaz, oturum kapanınca bellekten silinir

**Uç durumlar**
- [ ] Yanlış parolada "Şifre Yanlış" uyarısı, sunucu doğrulaması beklenmeden (yerel MAC hatası ile)
- [ ] "Şifremi Unuttum" seçeneği yok; verilerin kurtarılamayacağı UI'da belirtilir

### 9.3 Çevrimdışı Çalışma ve CRDT
**Fonksiyonel**
- [ ] Offline modda not oluşturma ve düzenleme başarılı, veriler IndexedDB'ye kaydedilir
- [ ] Bağlantı gelince Sync Manager bekleyen Yjs güncellemelerini **tek paket** halinde iletir

**Tutarlılık**
- [ ] Aynı not iki cihazda da offline düzenlenirse, ikisi de online olunca CRDT iki değişikliği otomatik birleştirir, **veri kaybı olmaz**

**Performans ve limitler**
- [ ] IndexedDB kotası dolmaya yaklaşınca eski CRDT geçmişi Garbage Collection ile sıkıştırılır

**Uç durumlar**
- [ ] Bağlantı gidip gelirken (flaky network) WebSocket kopup yeniden bağlandığında **çift (duplicate) veri yazılmaz**, sync state sorunsuz devam eder

### 9.4 Temel Markdown Editörü
**Fonksiyonel**
- [ ] Metin seçip kısayol (Cmd+B vb.) kullanınca metin kalın olur
- [ ] Satır başında `* ` yazınca madde işaretli listeye dönüşür
- [ ] Üç ters tırnak (` ``` `) yazınca kod bloğuna dönüşür

**Tutarlılık**
- [ ] Web'de oluşturulan içerik (Tiptap JSON formatında Yjs verisi) mobil görünümde (PWA / responsive) görsel olarak **birebir** aynı render edilir

**UX**
- [ ] Slash (`/`) komut menüsü MVP'de **gösterilmez**; yalnızca sözdizimi tabanlı biçimlendirme

**Uç durumlar**
- [ ] Başka siteden yapıştırılan karmaşık HTML'de desteklenmeyen etiketler (resim, tablo) temizlenir; yalnızca düz metin ve temel Markdown korunur

---

## 10. Başarı Metrikleri

### 10.1 MVP Metrikleri
| Metrik | Tanım | Hedef |
|---|---|---|
| **Aktivasyon** | Kayıt olanların ilk 24 saatte en az 1 not oluşturma oranı | **> %60** |
| **Kasa Kullanımı (Core Value)** | Aktif kullanıcıların ilk şifreli notunu oluşturma oranı | **≥ %20** (olmazsa rekabet avantajı yok demektir) |
| **Bağlılık** | Day-7 geri dönüş oranı | **> %25** |
| **Performans** | İlk yüklenme ve etkileşime hazır olma süresi | **< 1.5 sn** |

### 10.2 Uzun Vadeli Metrikler (vizyon)
| Kategori | Metrik | Hedef |
|---|---|---|
| Gelir | Free-to-Paid dönüşüm oranı | %4–%6 |
| Gelir | MRR (bireysel abonelik) | – |
| Gelir | ARPA (kurumsal) | – |
| Gelir | Net Retention Rate (NRR) | > %100 |
| Etkileşim | DAU / MAU | > %30 |
| Etkileşim | Vault Adoption Rate (≥1 not koyan kullanıcı oranı) | – |
| Etkileşim | Multiplayer Session Count (haftalık) | – |
| Mühendislik | CRDT Conflict Count (otomatik birleştirmenin devreye girdiği başarılı senkronizasyon sayısı) | – |

---

## 11. UI/UX İlkeleri

- **Kademeli gösterim (Progressive Disclosure):** Açılışta yalın bir kart/post-it ızgarası; zengin özellikler yalnızca gerektiğinde ortaya çıkar.
- **Minimalist grid:** Google Keep tarzı masonry yerleşim, kartlar ekrana göre dinamik dizilir.
- **Yeni not:** Tek tıkla boş kart, anında odak.
- **Sözdizimi tabanlı biçimlendirme:** Slash menüsü yok. `* `, ` ``` `, Cmd+B gibi kısayol ve Markdown yazımı yeterli.
- **Onboarding hedefi:** Kayıttan ilk nota en fazla 3 tıklama / 15 sn (NFR-7).
- **Çevrimdışı deneyim:** Bağlantı kopsa da kullanıcı uyarı ile kesintiye uğramadan yazmaya devam eder.
- **Kasa arayüzü:**
  - Ana şifre girilmeden Kasa sekmesi açılmaz.
  - Yanlış şifrede net "Şifre Yanlış" mesajı.
  - Şifre belirleme ekranında "unutulursa kurtarılamaz" uyarısı açıkça gösterilir.
  - "Şifremi Unuttum" bağlantısı **bulunmaz**.
- **Tutarlılık:** Web ve mobil (responsive/PWA) görünümde aynı Markdown render sonucu.
- **Erişilebilirlik:** Radix UI bileşenleri ile a11y desteği.

---

## 12. Yol Haritası

| Sürüm | İçerik |
|---|---|
| **v1.0 (MVP)** | Minimalist grid UI, senkronize standart notlar, E2EE Şifreli Kasa, temel Markdown, offline-first + Yjs, Responsive Web + PWA |
| **v1.1** | Salt okunur link paylaşımı, renk ve etiket (Tagging), Karanlık Mod |
| **v2.0** | iOS / Android native uygulamalar, biyometrik Kasa açılışı, Markdown tabloları ve backlinking |
| **Sonrası (şu an rafta)** | Multiplayer / canlı imleç, yorum ve `@` etiketleme, takım çalışma alanları, admin panel, abonelik ve ödeme |

---

## 13. Dokümanlar Arası Tutarsızlıklar ve Açık Sorular

> Bu bölüm kaynak dokümanların karşılaştırılmasından çıkan gözlemlerdir. Geliştirmeye başlamadan önce karara bağlanmaları önerilir.

### 13.1 Dokümanlar arası çelişkiler

| # | Konu | Çelişki | Öneri |
|---|---|---|---|
| 1 | **Slash menüsü** | `requirements.md` (FR-2, persona senaryosu) `/` ile zengin editörü tetikler; `mvp_scope.md` ve `acceptance_criteria.md` MVP'de slash menüsünü **yasaklar** | MVP için `mvp_scope` geçerli sayılsın; `requirements.md` v2.0 vizyonu olarak işaretlensin |
| 2 | **Standart notlarda arama ve sunucu görünürlüğü** | `requirements.md` (FR-3, NFR-4) ve `mvp_scope.md` standart notlar için *sunucu tarafında şifreli, aranabilir* der; `tech_stack.md` ise sunucuyu içeriği parse edemeyen "aptal röle" olarak tanımlar | Standart notlar için sunucunun içerik görüp görmeyeceği net karar verilmeli (bkz. 13.2 #1) |
| 3 | **Veritabanı** | `system_design.md`: NoSQL (MongoDB) veya PostgreSQL JSONB; `tech_stack.md`: Supabase / PostgreSQL | `tech_stack.md` kararı esas alınabilir; `system_design.md` güncellenmeli |
| 4 | **Redis** | `system_design.md`'de Cache olarak var; `tech_stack.md`'de hiç geçmiyor | MVP'de gerekli mi karar verilmeli (Supabase Realtime / Hocuspocus ile gereksiz olabilir) |
| 5 | **Sync servisi** | `tech_stack.md` "Hocuspocus **veya** Supabase Realtime" der, seçim yapılmamış | Spike ile karşılaştırılıp tek seçenek seçilmeli |
| 6 | **Yerel depolama** | `system_design.md` "IndexedDB/SQLite" der; MVP yalnızca web olduğu için IndexedDB yeterli | SQLite v2.0 (native) için ertelensin |
| 7 | **Platform tutarlılığı** | NFR-8 üç platformda %100 tutarlılık ister; MVP yalnızca PWA | NFR-8 MVP için "yalnızca PWA" olarak daraltılmalı |
| 8 | **Gecikme hedefi** | NFR-2: 50 ms (multiplayer); kabul kriteri: cihazlar arası 3 sn | MVP'de 3 sn geçerli; 50 ms v2.0+ hedefi olarak işaretlensin |
| 9 | **Sync Service "doğrular"** | `system_design.md` Sync Service'in gelen güncellemeleri "doğrulayacağını" söyler, ancak Kasa verisini okuyamaz | Doğrulama yalnızca yetki/boyut/format düzeyinde olmalı, içerik düzeyinde olamaz |

### 13.2 Dokümanda cevabı bulunmayan teknik sorular

1. **Standart notlarda "hızlı arama" nasıl yapılacak?** Yjs binary state sunucuda okunamaz. Seçenekler: (a) yalnızca istemci tarafı arama, (b) sunucuda ayrı düz metin/FTS sütunu.
2. **Kasa için Yjs entegrasyonu:** Hocuspocus ve Tiptap'in standart collaboration sağlayıcısı Yjs güncellemelerini şifrelemeden gönderir. Kasa notları için güncellemeleri göndermeden önce şifreleyen **özel bir sağlayıcı/katman** gerekir.
3. **Salt ve çok cihazlı Kasa kurulumu:** PBKDF2 için salt değerinin saklanacağı yer ve 2. cihazın aynı anahtarı nasıl türeteceği belirtilmemiş (salt gizli değildir, genelde sunucuda saklanır).
4. **Parola doğrulama mekanizması:** "Yerel MAC hatası ile yanlış şifre tespiti" için bilinen bir şifreli doğrulama bloğu (verifier) saklanması gerekebilir.
5. **PBKDF2 parametreleri:** İterasyon sayısı ve hash algoritması belirtilmemiş. Bu seçim güvenlik ve 1.5 sn performans hedefi arasında bir denge gerektirir.
6. **Kasa oturum süresi:** Anahtar "oturum kapanınca" siliniyor; otomatik kilitlenme süresi ve sekme yenilendiğinde yeniden şifre sorulup sorulmayacağı belirsiz.
7. **Kasa içi yerel arama:** Çözülmüş içerik için yerel indeks nerede tutulacak? Düz metin indeksi diske yazılmamalı; yalnızca bellekte mi yoksa şifreli mi saklanacağı belirlenmeli.
8. **Garbage Collection politikası:** Hangi eşikte (kota %?, geçmiş boyutu?) ve hangi veri için çalışacağı tanımlı değil. Çok cihazlı ortamda GC'nin diğer cihazların senkronizasyonunu bozmaması gerekir.
9. **Yetkilendirme (veritabanı seviyesi):** Kullanıcıların yalnızca kendi satırlarını görebilmesi için Supabase Row Level Security (RLS) politikaları tanımlanmalı (dokümanlarda geçmiyor).
10. **Yedekleme ve veri silme:** GDPR hazırlığı (NFR-6) kapsamında hesap silme ve veri dışa aktarma akışı MVP'de nasıl ele alınacak?
11. **Onboarding (NFR-7):** 3 tıklama / 15 sn hedefi için kabul kriteri yazılmamış.
12. **Mobil görünüm tanımı:** Kabul kriterlerindeki "mobil görünüm" PWA/responsive anlamına geliyor; hedef ekran boyutları ve tarayıcı desteği matrisi belirtilmemiş.

---

## 14. Sözlük

| Terim | Açıklama |
|---|---|
| **E2EE** | End-to-End Encryption. Veri yalnızca kullanıcının cihazında çözülebilir |
| **Zero-Knowledge** | Sunucunun kullanıcı verisinin içeriğini ve anahtarlarını bilmediği mimari |
| **CRDT** | Conflict-free Replicated Data Type. Çakışmaların otomatik ve veri kaybı olmadan birleştirildiği veri yapısı |
| **Yjs** | JavaScript için CRDT kütüphanesi |
| **Tiptap / ProseMirror** | Modüler zengin metin editörü altyapısı |
| **Hocuspocus** | Yjs için optimize edilmiş WebSocket sunucusu |
| **Offline-First** | Önce yerel depoya yazan, ağ varsa senkronize eden mimari yaklaşım |
| **PWA** | Progressive Web App. Kurulabilir, çevrimdışı çalışabilen web uygulaması |
| **PBKDF2** | Paroladan kriptografik anahtar türeten fonksiyon (KDF) |
| **AES-256-GCM** | Hem şifreleme hem bütünlük doğrulaması (MAC/authentication tag) sağlayan simetrik şifreleme |
| **Web Worker** | Ana UI iş parçacığından bağımsız arka plan iş parçacığı |
| **Dumb Relay** | Veriyi yorumlamadan yalnızca ileten/saklayan sunucu |
| **Garbage Collection (GC)** | Eski CRDT geçmişinin sıkıştırılıp temizlenmesi |
| **Optimistic UI** | İşlemin sunucu onayı beklenmeden arayüzde anında yansıtılması |
| **MoSCoW** | Must / Should / Could / Won't önceliklendirme yöntemi |
| **PMF** | Product-Market Fit. Ürün-pazar uyumu |
| **RLS** | Row Level Security. Veritabanında satır bazlı erişim kontrolü |