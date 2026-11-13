# Acceptance Criteria & Testing Checklist (v1.0 - MVP)

Bu doküman, `mvp_scope.md`'de tanımlanan özelliklerin "Bitti" (Definition of Done) statüsüne geçebilmesi için sağlanması gereken kabul kriterlerini içerir. QA ekibi, test süreçlerini bu kriterlere göre işletecektir.

## 1. Temel Not Senkronizasyonu (Standard Notes)
**Açıklama:** Kullanıcıların oluşturduğu şifresiz, düz veya temel markdown destekli notların cihazlar arası senkronizasyonu.

*   **Functional Criteria (Fonksiyonel):**
    *   Kullanıcı "Yeni Not" butonuna tıkladığında boş bir not kartı anında oluşturulmalı ve odaklanmalıdır.
    *   Not içeriği değiştirildiğinde, değişiklikler en fazla 2 saniye içinde sunucuya (Supabase) otomatik olarak kaydedilmelidir.
    *   Kullanıcı notu sildiğinde, UI'dan anında kalkmalı (optimistic UI update) ve sunucudan silinme işlemi arka planda tamamlanmalıdır.
*   **Cross-Platform Consistency (Tutarlılık):**
    *   Web/PWA üzerinde eklenen, güncellenen veya silinen bir not, aynı hesaba bağlı diğer bir açık cihazda en fazla 3 saniye (WebSocket gecikmesi) içinde eşzamanlı görünmelidir.
*   **Non-Functional Criteria (Performans & UI):**
    *   Uygulama ana ekranı 1.5 saniyenin altında yüklenmelidir (`NFR-1`).
    *   UI, Google Keep tarzı minimalist bir grid (masonry layout) şeklinde olmalı ve ekran boyutuna göre kartlar dinamik dizilmelidir.
*   **Edge Cases (Uç Durumlar):**
    *   Not içeriğine tek seferde 50.000 karakter yapıştırıldığında uygulama donmamalı (UI thread bloklanmamalı), asenkron olarak kaydetmelidir.
    *   Ağ bağlantısı tamamen koptuğunda, kullanıcı bir uyarı görmeksizin yazmaya devam edebilmelidir.

## 2. Şifreli Kasa (E2EE Vault)
**Açıklama:** Kullanıcının özel şifresiyle korunan, uçtan uca şifrelenmiş not alanı.

*   **Functional Criteria (Fonksiyonel):**
    *   Kullanıcı ilk girişte en az 8 karakterlik bir "Master Password" (Ana Şifre) belirleyebilmelidir.
    *   Ana şifre girilmeden "Kasa" sekmesine erişilememeli, API çağrıları şifreli veriyi getirse bile deşifre edilemediği için arayüzde gösterilememelidir.
    *   Şifreli kasada oluşturulan notlar sunucuya (Network sekmesinden izlendiğinde) kesinlikle düz metin olarak değil, AES-256-GCM ile şifrelenmiş anlamsız byte (blob) dizileri olarak gitmelidir.
*   **Cross-Platform Consistency (Tutarlılık):**
    *   Kullanıcı 1. cihazda şifreli bir not yazdığında, 2. cihazdaki Kasa açıksa (doğru Master Password girilmişse) yeni not anında deşifre edilip gösterilmelidir.
*   **Non-Functional Criteria (Güvenlik & Performans):**
    *   Kriptografik işlemler (PBKDF2 anahtar türetme ve AES-256-GCM şifreleme/çözme) kesinlikle Web Workers üzerinde yapılmalı, yazma esnasında klavye girişlerinde (typing) takılma olmamalıdır.
    *   Şifreleme anahtarları (derived keys) tarayıcının `localStorage` alanına kesinlikle düz metin olarak yazılmamalı, oturum kapandığında bellekten (memory) silinmelidir.
*   **Edge Cases (Uç Durumlar):**
    *   Kullanıcı yanlış Master Password girdiğinde "Şifre Yanlış" uyarısı vermeli (sunucudan doğrulama beklenmeden, yerel kriptografik MAC hatası yakalanarak).
    *   Kullanıcı Master Password'ü unuttuğunda "Şifremi Unuttum" seçeneği **olmamalıdır** (Zero-knowledge mimarisi gereği verilerin kurtarılamayacağı net bir UI ile belirtilmelidir).

## 3. Çevrimdışı Çalışma ve CRDT (Offline-First & Conflict Resolution)
**Açıklama:** İnternet yokken not alabilme ve çakışma yönetimi (Yjs entegrasyonu).

*   **Functional Criteria (Fonksiyonel):**
    *   Cihaz çevrimdışı moddayken (Network = Offline) notlar başarıyla oluşturulmalı, düzenlenmeli ve IndexedDB'ye kaydedilmelidir.
    *   İnternet bağlantısı sağlandığında, `Sync Manager` bekleyen Yjs güncellemelerini sunucuya tek bir paket halinde iletmelidir.
*   **Cross-Platform Consistency (Tutarlılık):**
    *   Bir not aynı anda hem 1. cihazda hem de 2. cihazda (ikisi de çevrimdışıyken) düzenlenirse; ikisi de internete bağlandığında, satır/karakter bazlı CRDT algoritması iki değişikliği otomatik birleştirmeli, hiçbir veri kaybolmamalıdır.
*   **Non-Functional Criteria (Performans & Limitler):**
    *   Yerel IndexedDB depolama kotası dolmaya yaklaştığında, eski ve gereksiz CRDT geçmiş verileri çöp toplamaya (Garbage Collection) tabi tutularak sıkıştırılmalıdır.
*   **Edge Cases (Uç Durumlar):**
    *   İnternet bağlantısının gidip gelmesi (flaky network) durumunda WebSocket (Hocuspocus/Realtime) bağlantısı kopup tekrar bağlandığında çift (duplicate) veri yazılmamalı, sync state sorunsuz devam etmelidir.

## 4. Zengin Metin Düzenleme (Basic Markdown)
**Açıklama:** Kalın, italik, liste ve kod bloğu destekleyen Tiptap tabanlı metin editörü.

*   **Functional Criteria (Fonksiyonel):**
    *   Kullanıcı metin seçip klavye kısayolu (Cmd+B vb.) kullandığında metin kalın olmalıdır.
    *   Kullanıcı satır başında `* ` yazdığında otomatik olarak madde işaretli (bullet) listeye dönüşmelidir.
    *   Kullanıcı ```` ``` ```` yazdığında içerik bir kod bloğuna dönüşmelidir.
*   **Cross-Platform Consistency (Tutarlılık):**
    *   Web'de oluşturulan Markdown (Tiptap JSON formatındaki Yjs verisi), mobil görünümde (PWA/Responsive Web) görsel olarak birebir aynı (CSS styles eşleşerek) render edilmelidir.
*   **Non-Functional Criteria (UX):**
    *   Karmaşık slash (`/`) komut menüleri MVP kapsamında gösterilmemeli, sadece metin tabanlı (syntax-driven) şekillendirme desteklenmelidir.
*   **Edge Cases (Uç Durumlar):**
    *   Kullanıcı başka bir web sitesinden kopyaladığı karmaşık bir HTML'i editöre yapıştırdığında, editör desteklemediği HTML taglerini (resimler, tablolar) temizlemeli, sadece saf metin ve temel markdown yapılarını koruyarak yapıştırmalıdır.
