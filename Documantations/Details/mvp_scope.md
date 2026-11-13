**Ürün Hedefi (v1.1):** Kullanıcılara "Sade Arayüz, Güçlü Markdown ve Uçtan Uca Şifreli Gizli Kasa" sunan, bireysel odaklı, çevrimdışı tam yetenekli (PWA Offline-First), modern web tabanlı not uygulaması.

### 1. MoSCoW Önceliklendirmesi ve Gerçekleşme Durumu

**Must-Have (Olmazsa Olmazlar - v1.0 Kapsamı - ✅ TAMAMLANDI)**

* **UI:** Google Keep benzeri minimalist grid/post-it görünümü. ✅
* **Temel Notlar:** Sunucuda senkronize edilen, hızlı aranabilir metin notları. ✅
* **Şifreli Kasa (E2EE):** Kullanıcının sadece kendi belirlediği bir "Master Password" ile girebildiği, verilerin tarayıcıda Web Worker içinde AES-256-GCM ile şifrelenip buluta anlamsız veri (blob) olarak gittiği güvenli alan. ✅
* **Zengin Metin (Temel Markdown):** `/` (slash) menüsü olmadan, sadece temel Markdown kuralları (kalın, italik, liste, kod bloğu) destekleyen Tiptap editörü. ✅
* **Çevrimdışı Temel Destek:** İnternet yokken not alabilme; cihaz online olduğunda *Yjs (CRDT)* kütüphanesiyle kendi notlarını çakışmasız senkronize etme. ✅
* **Platform:** Responsive Web App ve PWA (Progressive Web App). ✅

**Should-Have (Olsa İyi Olur - Hızlı Güncellemeler v1.1 - ✅ TAMAMLANDI)**

* **Salt Okunur Link Paylaşımı:** Notları `#share/...` URL hash yapısı ve readonly Tiptap renderer ile sunucuya ihtiyaç duymadan güvenle paylaşabilme. ✅
* **Markdown Dışa Aktarma:** Notları `.md` dosyası olarak doğrudan indirme ve panoya kopyalama desteği. ✅
* **Not Renklendirme ve Etiketleme (Tagging):** 6'lı pastel renk seçimi, etiket yönetimi (ekleme, silme, etiket bazlı filtreleme). ✅
* **Karanlık Mod (Dark Mode):** Kolay tema anahtarı ve Tailwind CSS tabanlı gece modu desteği. ✅
* **PWA Kurulum Deneyimi:** `beforeinstallprompt` entegrasyonu, Sidebar'da "Uygulamayı Yükle" butonu, Google Fonts runtime caching ve eksiksiz çevrimdışı asset önbelleği. ✅
* **Klavye Kısayolları & UX Koruma:** `N`, `/`, `?`, `Ctrl+K`, `Esc` kısayolları; metin editöründe yazarken kısayolların baskılanması koruması. ✅
* **Güvenli Not Penceresi (NoteModal):** Kapatma ($X$) butonu izole edilmiş, Sil butonu alt barda korumaya alınmış, iki aşamalı silme onayı ve 44x44 px a11y dokunma alanları. ✅
* **Çevrimdışı Durum Göstergesi:** Ağ kopmasında üstte sarı bildirim, bağlantı geldiğinde yeşil senkronizasyon geri bildirimi. ✅

**Could-Have (Daha Sonra Yapılabilir - v2.0 Kapsamı)**

* Mobil Native Uygulamalar (iOS / Android).
* Yüz tanıma / Parmak izi ile Kasa açılışı (WebAuthn).
* Markdown tabloları ve gelişmiş birbirine bağlı not (Backlinking) yapısı.

**Won't-Have (Şu An Kapsam Dışı - Rafa Kalkanlar)**

* Aynı not üzerinde eşzamanlı ortak çalışma (Multiplayer / Canlı İmleçler).
* Not içi yorum yapma ve `@` ile takım arkadaşlarını etiketleme.
* Kurumsal paketler, ekip çalışma alanları, yetki yönetimi (Admin Panel).

### 2. MVP Başarı Metrikleri (Success Metrics)

MVP aşamasında paradan çok, "ürün-pazar uyumunu" (Product-Market Fit) kanıtlamamız gerekir:

* **Aktivasyon (Activation):** Kayıt olan kullanıcıların ilk 24 saat içinde en az 1 not oluşturma oranı (Hedef: >%60).
* **Kasa Kullanımı (Core Value):** Aktif kullanıcıların en az %20'sinin "Şifreli Kasa" özelliğini kullanarak ilk şifreli notunu oluşturması. (Tarayıcı E2E testlerinde sıfır bilgi güvenliği doğrulanmıştır).
* **Bağlılık (Retention):** 1. Hafta (Day-7) geri dönüş oranı (Hedef: >%25).
* **Performans:** Web uygulamasının ilk yüklenme ve etkileşime hazır olma süresinin 1.5 saniyenin altında kalması (PWA önbelleği ile <500ms).