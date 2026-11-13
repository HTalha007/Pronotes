Proje Özeti: Günlük kullanıcılar için Google Keep sadeliğinde başlayan, ancak "Power User" ve ekipler için zengin metin düzenleme (Markdown), Uçtan Uca Şifreli (E2EE) Kasa, CRDT tabanlı çevrimdışı çalışma ve gerçek zamanlı ortak çalışma özellikleri sunan yenilikçi bir üretkenlik platformu. İş modeli olarak bireyselde Freemium SaaS, kurumsalda ise B2B (Takım lisanslama) katmanlarına sahiptir.

1. User Personas (Kullanıcı Profilleri)
Günlük Kullanıcı (Hızlı Not Alan - "Sadelik Arayan")

Profil: Öğrenciler, ev hanımları, standart ofis çalışanları.

İhtiyaç: Aklına gelen bir fikri, alışveriş listesini veya yapılacakları anında, sıfır gecikmeyle kaydetmek. Karmaşık klasörlerle uğraşmak istemiyor.

Kullanım Senaryosu: Uygulamayı açar, varsayılan post-it panosuna yazar ve çıkar. Cihazlar arası standart senkronizasyona güvenir.

Power User / Geliştirici ("Güvenlik ve Fonksiyon Arayan")

Profil: Yazılım mühendisleri, veri bilimciler, araştırmacılar.

İhtiyaç: Kod blokları (syntax highlighting), API anahtarlarını saklamak için yüksek güvenlik ve verilerinin kaybolmayacağı garantisi.

Kullanım Senaryosu: / komutunu kullanarak Markdown özelliklerini tetikler. Hassas token'larını "Şifreli Kasa"ya koyarak buluta dahi güvenmeden kendi cihazında kilitler.

Kurumsal Ekip ve Proje Yöneticisi ("İşbirliği Arayan")

Profil: Startup kurucuları, ürün yöneticileri, tasarım ekipleri.

İhtiyaç: Ekip içi bilgi paylaşımı, aynı döküman üzerinde eşzamanlı çalışma ve rol yönetimi (okuma/yazma yetkileri).

Kullanım Senaryosu: Takım çalışma alanı (Workspace) oluşturur, notları ekibiyle paylaşır, toplantı esnasında aynı nota eşzamanlı veri girip (CRDT ile) ekip arkadaşını @ ile etiketler.

2. Functional Requirements (Fonksiyonel Gereksinimler)
2.1. Kademeli Gösterim (Progressive Disclosure UI)
FR-1: Uygulama açılış ekranı minimalist bir kart/post-it ızgarası (grid) tasarımına sahip olmalıdır.

FR-2: Kullanıcı bir nota girip / (slash) tuşuna bastığında veya Markdown sözdizimi kullandığında, zengin metin editörü (kod bloğu, tablo, başlık hiyerarşisi) aktif hale gelmelidir.

2.2. Hibrit Güvenlik ve "Kasa" (Vault) Sistemi
FR-3: Kullanıcılar standart notlar oluşturabilmeli (Sunucu tarafında şifreli, aranabilir, şifre sıfırlamaya uygun).

FR-4: Kullanıcılar uygulama içinde yerel bir şifre (Master Password) veya biyometrik veri (FaceID/Parmak İzi) ile açılan bir "Şifreli Kasa" oluşturabilmelidir.

FR-5: Kasadaki notlar cihazda uçtan uca şifrelenmeli (Zero-Knowledge) ve sunucuya sadece şifreli bir blok olarak gönderilmelidir. Bu notlar sunucu tarafında aranamaz ve paylaşılamaz olmalıdır.

2.3. Akıllı Birleştirme ve Çevrimdışı Çalışma (Offline-First & CRDT)
FR-6: Kullanıcılar internet bağlantısı olmadan yeni not oluşturabilmeli ve mevcut notları düzenleyebilmelidir (Offline-first mimari).

FR-7: İki farklı cihazda (veya iki farklı kullanıcı tarafından) aynı notta çevrimdışı/çevrimiçi değişiklik yapıldığında, çakışmalar CRDT (Conflict-free Replicated Data Type) algoritması ile satır ve karakter bazında otomatik birleştirilmelidir (Sıfır veri kaybı kuralı).

2.4. Gerçek Zamanlı Ortak Çalışma (Multiplayer)
FR-8: Standart notlar (Kasa dışında kalanlar), e-posta daveti veya paylaşım linki ile diğer kullanıcılarla paylaşılabilmelidir.

FR-9: Aynı notu açan birden fazla kullanıcı, imleçlerini gerçek zamanlı olarak (canlı) görebilmeli ve notu eşzamanlı düzenleyebilmelidir.

FR-10: Not içindeki belirli metin bloklarına yorum (comment) bırakılabilmeli ve @ sembolü ile kullanıcılar etiketlenebilmelidir.

2.5. Hesap ve Abonelik Yönetimi (Bireysel & Kurumsal)
FR-11: Uygulama "Freemium" modelde çalışmalı; temel not alma özellikleri ücretsiz kullanıcılara açık olmalıdır.

FR-12: "Pro" (Bireysel) ve "Team" (Kurumsal) olmak üzere iki farklı premium abonelik katmanı tanımlanmalıdır (Ödeme geçidi entegrasyonu).

FR-13: "Team" katmanındaki kullanıcılar, merkezi bir faturalandırma (admin panel) ile kullanıcı yetkilendirmesi (role-based access) yapabilmelidir.

3. Non-Functional Requirements (Fonksiyonel Olmayan Gereksinimler)
3.1. Performans ve Ölçeklenebilirlik
NFR-1 (Load Time): Uygulamanın (web ve mobil) ilk açılış hızı (Time to Interactive) 1.5 saniyenin altında olmalıdır.

NFR-2 (Real-Time Latency): Ortak çalışma modunda yapılan bir tuş vuruşu, diğer kullanıcıların ekranına en fazla 50 milisaniye (ms) gecikmeyle (WebSocket/WebRTC üzerinden) yansımalıdır.

NFR-3 (Scalability): Sunucu mimarisi, ani trafik artışlarında (örneğin kurumsal bir ekibin aynı anda yüklenmesi) yatay olarak ölçeklenebilir (auto-scaling) olmalıdır.

3.2. Güvenlik ve Uyumluluk (Security & Compliance)
NFR-4 (Encryption in Transit & Rest): Standart notlar uçuş halinde (TLS 1.3) ve sunucuda dinlenirken (AES-256) şifrelenmelidir.

NFR-5 (E2EE Standardı): Şifreli Kasa verileri için istemci tarafında AES-256-GCM (veya eşdeğeri) algoritması kullanılmalı, şifreleme anahtarları asla sunucuya iletilmemelidir.

NFR-6 (Compliance): Kurumsal satışlar hedeflendiği için altyapı GDPR ve SOC-2 veri gizliliği uyumluluklarına baştan hazır olarak tasarlanmalıdır.

3.3. Kullanılabilirlik (Usability)
NFR-7 (Onboarding): Yeni bir kullanıcının kayıt olup ilk notunu yazması arasındaki süreç en fazla 3 tıklama ve 15 saniye sürmelidir.

NFR-8 (Cross-Platform): Ürün deneyimi Web (PWA), iOS ve Android platformlarında arayüz ve özellik seti açısından %100 tutarlı olmalıdır.

4. Success Metrics (Başarı Metrikleri)
4.1. Büyüme ve Dönüşüm (Business & Revenue)
Free-to-Paid Conversion Rate: Ücretsiz kullanıcıların "Pro" veya "Team" paketine geçiş oranı (Hedef: %4-%6 arası).

MRR (Monthly Recurring Revenue): Bireysel SaaS aboneliklerinden elde edilen aylık tekrarlayan gelir.

ARPA (Average Revenue Per Account): Kurumsal (B2B) hesaplardan elde edilen ortalama gelir (Takım büyüklüklerinin artışını takip etmek için).

Net Retention Rate (NRR): Mevcut kurumsal müşterilerin aboneliklerini ne oranda korudukları ve ek lisans alıp almadıkları (Hedef: >%100).

4.2. Kullanıcı Etkileşimi (Engagement & UX)
DAU / MAU Oranı: Günlük aktif kullanıcıların, aylık aktif kullanıcılara oranı (Ürünün ne kadar "günlük bir alışkanlık" haline geldiğini ölçer; Hedef: >%30).

Vault Adoption Rate: "Şifreli Kasa" özelliğini aktif eden (içine en az 1 not koyan) kullanıcıların toplam kullanıcı tabanına oranı.

Multiplayer Session Count: Aynı dokümanda en az iki kullanıcının eşzamanlı aktif olduğu haftalık oturum sayısı (Kurumsal ürün-pazar uyumunun ana göstergesi).

CRDT Conflict Count: Otomatik birleştirme algoritmasının devreye girdiği başarılı senkronizasyon sayısı (Mühendislik kalitesini ölçer).