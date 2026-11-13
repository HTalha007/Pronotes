# Acceptance Criteria & Testing Checklist (v1.1 - Verified Release)

Bu doküman, `mvp_scope.md`'de tanımlanan özelliklerin "Bitti" (Definition of Done) statüsüne geçebilmesi için sağlanması gereken kabul kriterlerini ve doğrulama durumlarını içerir. Tüm maddeler birim testler ve otomatik tarayıcı E2E testleri ile %100 doğrulanmıştır.

## 1. Temel Not Senkronizasyonu (Standard Notes) - [✅ DOĞRULANDI]
**Açıklama:** Kullanıcıların oluşturduğu şifresiz, düz veya temel markdown destekli notların cihazlar arası senkronizasyonu.

*   **Functional Criteria (Fonksiyonel):**
    *   [x] Kullanıcı "Yeni Not" butonuna tıkladığında boş bir not kartı anında oluşturulmalı ve odaklanmalıdır.
    *   [x] Not içeriği değiştirildiğinde, değişiklikler en fazla 2 saniye içinde sunucuya/veritabanına otomatik olarak kaydedilmelidir.
    *   [x] Kullanıcı notu sildiğinde, UI'dan anında kalkmalı (optimistic UI update) ve sunucudan silinme işlemi arka planda tamamlanmalıdır.
*   **Cross-Platform Consistency (Tutarlılık):**
    *   [x] Web/PWA üzerinde eklenen, güncellenen veya silinen bir not, aynı hesaba bağlı diğer bir açık oturumda anında eşzamanlı görünmelidir.
*   **Non-Functional Criteria (Performans & UI):**
    *   [x] Uygulama ana ekranı 1.5 saniyenin altında yüklenmelidir (`NFR-1`). PWA ile ilk yükleme <500 ms.
    *   [x] UI, Google Keep tarzı minimalist bir grid (masonry layout) şeklinde olmalı ve ekran boyutuna göre kartlar dinamik dizilmelidir.
*   **Edge Cases (Uç Durumlar):**
    *   [x] Not içeriğine tek seferde 50.000 karakter yapıştırıldığında uygulama donmamalı (UI thread bloklanmamalı), asenkron olarak kaydetmelidir.
    *   [x] Ağ bağlantısı tamamen koptuğunda, kullanıcı bir uyarı görmeksizin veya üstteki bildirim çubuğu eşliğinde yazmaya kesintisiz devam edebilmelidir.

## 2. Şifreli Kasa (E2EE Vault) - [✅ DOĞRULANDI]
**Açıklama:** Kullanıcının özel şifresiyle korunan, uçtan uca şifrelenmiş sıfır bilgi (Zero-Knowledge) not alanı.

*   **Functional Criteria (Fonksiyonel):**
    *   [x] Kullanıcı ilk girişte en az 8 karakterlik bir "Master Password" (Ana Şifre) belirleyebilmelidir.
    *   [x] Ana şifre girilmeden "Kasa" sekmesine erişilememeli, API çağrıları şifreli veriyi getirse bile deşifre edilemediği için arayüzde gösterilememelidir.
    *   [x] Şifreli kasada oluşturulan notlar sunucuya ve ağa kesinlikle düz metin olarak değil, AES-256-GCM ile şifrelenmiş anlamsız byte (blob) dizileri olarak gitmelidir (Canlı E2E testinde gizli kelime taraması ile kanıtlanmıştır).
*   **Cross-Platform Consistency (Tutarlılık):**
    *   [x] Kullanıcı 1. cihazda şifreli bir not yazdığında, 2. cihazdaki Kasa açıksa (doğru Master Password girilmişse) yeni not anında deşifre edilip gösterilmelidir.
*   **Non-Functional Criteria (Güvenlik & Performans):**
    *   [x] Kriptografik işlemler (PBKDF2 anahtar türetme ve AES-256-GCM şifreleme/çözme) kesinlikle Web Workers üzerinde yapılmalı, yazma esnasında klavye girişlerinde (typing) takılma olmamalıdır.
    *   [x] Şifreleme anahtarları (derived keys) tarayıcının `localStorage` alanına kesinlikle düz metin olarak yazılmamalı, oturum kapandığında bellekten (memory) silinmelidir.
*   **Edge Cases (Uç Durumlar):**
    *   [x] Kullanıcı yanlış Master Password girdiğinde "Şifre Yanlış" uyarısı vermeli (sunucudan doğrulama beklenmeden, yerel kriptografik MAC hatası yakalanarak).
    *   [x] Kullanıcı Master Password'ü unuttuğunda "Şifremi Unuttum" seçeneği **olmamalıdır** (Zero-knowledge mimarisi gereği verilerin kurtarılamayacağı net bir UI ile belirtilmelidir).

## 3. Çevrimdışı Çalışma ve CRDT (Offline-First & Conflict Resolution) - [✅ DOĞRULANDI]
**Açıklama:** İnternet yokken not alabilme ve çakışma yönetimi (Yjs entegrasyonu).

*   **Functional Criteria (Fonksiyonel):**
    *   [x] Cihaz çevrimdışı moddayken (Network = Offline) notlar başarıyla oluşturulmalı, düzenlenmeli ve IndexedDB'ye kaydedilmelidir.
    *   [x] İnternet bağlantısı sağlandığında, `Sync Manager` bekleyen Yjs güncellemelerini sunucuya tek bir paket halinde iletmelidir.
*   **Cross-Platform Consistency (Tutarlılık):**
    *   [x] Bir not aynı anda iki farklı oturumda düzenlenirse; CRDT algoritması iki değişikliği otomatik birleştirmeli, hiçbir veri kaybolmamalıdır.
*   **Non-Functional Criteria (Performans & Limitler):**
    *   [x] Yerel IndexedDB depolama kotası dolmaya yaklaştığında, eski ve gereksiz CRDT geçmiş verileri çöp toplamaya (Garbage Collection) tabi tutularak sıkıştırılmalıdır.
*   **Edge Cases (Uç Durumlar):**
    *   [x] İnternet bağlantısının gidip gelmesi (flaky network) durumunda bağlantı kopup tekrar bağlandığında çift (duplicate) veri yazılmamalı, sync state sorunsuz devam etmelidir.

## 4. Zengin Metin Düzenleme (Basic Markdown) - [✅ DOĞRULANDI]
**Açıklama:** Kalın, italik, liste ve kod bloğu destekleyen Tiptap tabanlı metin editörü.

*   **Functional Criteria (Fonksiyonel):**
    *   [x] Kullanıcı metin seçip klavye kısayolu (Cmd+B / Ctrl+B) kullandığında metin kalın olmalıdır.
    *   [x] Kullanıcı satır başında `* ` yazdığında otomatik olarak madde işaretli (bullet) listeye dönüşmelidir.
    *   [x] Kullanıcı ```` ``` ```` yazdığında içerik bir kod bloğuna dönüşmelidir.
*   **Cross-Platform Consistency (Tutarlılık):**
    *   [x] Web'de oluşturulan Markdown içeriği mobil ve masaüstü görünümlerinde görsel olarak birebir aynı render edilmelidir.
*   **Non-Functional Criteria (UX):**
    *   [x] Karmaşık slash (`/`) komut menüleri MVP kapsamında gösterilmemeli, sadece metin tabanlı (syntax-driven) şekillendirme desteklenmelidir.

## 5. Not Dışa Aktarma ve Salt Okunur Paylaşım (v1.1) - [✅ DOĞRULANDI]
*   **Functional Criteria (Fonksiyonel):**
    *   [x] Not penceresinde "Markdown İndir" seçeneği tıklandığında başlık ve içerikten oluşan `.md` dosyası istemcide oluşturulup indirilebilmelidir.
    *   [x] "Markdown Kopyala" seçeneği ile biçimlendirilmiş metin doğrudan panoya aktarılmalıdır.
    *   [x] "Salt Okunur Link Oluştur" tıklandığında `#share/{encodedData}` hash linki üretilmeli; bu linke gidildiğinde düzenleme çubukları olmadan sadece okunabilir Tiptap kartı açılmalıdır.

## 6. Renklendirme ve Etiket Yönetimi (v1.1) - [✅ DOĞRULANDI]
*   **Functional Criteria (Fonksiyonel):**
    *   [x] Notlara 6 pastel renk seçeneğinden biri atanabilmeli, kart arka planı ve modal zeminine bu renk yansımalıdır.
    *   [x] Kullanıcı sol kenar çubuğundan yeni etiket oluşturabilmeli, notlara atayabilmeli ve etiket seçtiğinde o etikete sahip notlar filtrelenmelidir.
    *   [x] Etiket silindiğinde ilgili notlardan etiketin kaldırılması güvenli şekilde gerçekleşmelidir.

## 7. Klavye Kısayolları ve NoteModal Güvenlik Mimarisi (v1.1) - [✅ DOĞRULANDI]
*   **Functional Criteria (Fonksiyonel & a11y):**
    *   [x] `N` tuşu yeni not oluşturma modalını anında açmalıdır.
    *   [x] `/` ve `Ctrl+K` tuşları arama kutusuna odaklanmalıdır.
    *   [x] `?` tuşu kısayol yardım rehberini açmalıdır.
    *   [x] Kullanıcı herhangi bir girdi alanında veya Tiptap editöründe yazarken kısayollar (`n`, `/`, `?`) tetiklenmemelidir.
    *   [x] NoteModal'da Kapat ($X$) butonu sağ üstte tek başına yer almalıdır.
    *   [x] Silme ($Trash2$) butonu modalın sol altına taşınmalı ve tıklandığında onay penceresi (`DialogContent`: "Notu Silmek İstiyor Musunuz?") ile korunmalıdır.
    *   [x] Modal açıldığında ilk odak kapatma/silme butonlarına değil, doğrudan not başlığı girdisine verilmelidir.
    *   [x] Tüm etkileşimli butonların dokunma hedefi en az 44x44 px olmalı ve `aria-label` taşımalıdır.

## 8. PWA Kurulum Deneyimi ve Çevrimdışı Hizmet (v1.1) - [✅ DOĞRULANDI]
*   **Functional Criteria (PWA & Offline):**
    *   [x] `manifest.webmanifest` geçerli ikonlar ve tema rengiyle sunulmalıdır.
    *   [x] `beforeinstallprompt` tetiklendiğinde Sidebar'da "Uygulamayı Yükle" butonu belirmeli ve tek tıkla yükleme akışını başlatmalıdır.
    *   [x] Service worker ve Workbox runtime caching ile Google Fonts (`fonts.googleapis.com` & `fonts.gstatic.com`) ve çekirdek bundle dosyaları çevrimdışı erişim için önbelleğe alınmalıdır.
    *   [x] Ağ bağlantısı koptuğunda kullanıcıya sarı çevrimdışı uyarısı, bağlantı geldiğinde yeşil senkronizasyon bildirimi sunulmalıdır.
