

**Mimari Vizyon:** Çevrimdışı öncelikli (Offline-First), istemci tarafında şifreleme yapan (Zero-Knowledge), CRDT tabanlı senkronizasyon kullanan ölçeklenebilir not alma altyapısı.

## 1. Sistem Bileşenleri (System Components)

* **Client Core (Shared Library):**
* **Local Storage Manager:** İstemci tarafındaki (IndexedDB/SQLite) verileri yönetir. Tüm okuma/yazma işlemleri önce buraya yapılır.
* **Cryptography Engine:** AES-256-GCM şifreleme ve deşifreleme işlemlerini yapar. Master Password'den anahtar türetir.
* **CRDT Resolver (Yjs):** Yerel ve uzak veriler arasındaki metin tabanlı çakışmaları matematiksel olarak birleştirir.
* **Sync Manager:** Çevrimiçi/Çevrimdışı durumlarını dinler, verileri sıraya (queue) alır ve backend ile haberleşir.


* **Client UI (Presentation):**
* Web/PWA arayüzü. Sadece Core bileşeninin sunduğu arayüzleri tüketir, iş mantığı içermez.




* **Backend Services (Microservices/Modular Monolith):**
* **API Gateway:** Gelen tüm istekleri karşılar, JWT doğrulaması yapar ve ilgili servise yönlendirir.
* **Auth Service:** Kullanıcı kaydı, girişi ve token üretiminden sorumludur.
* **Sync Service (WebSocket):** İstemciler arasındaki CRDT güncellemelerini alır, doğrular ve veritabanına yazar.


* **Veritabanı Katmanı:**
* **Primary DB (NoSQL / Document):** CRDT metadatalarını ve şifreli not blob'larını esnek dökümanlar olarak saklar (örneğin MongoDB veya PostgreSQL JSONB).
* **Cache (Redis):** Aktif WebSocket bağlantı durumlarını ve oturum bilgilerini tutar.



## 2. Veri Akış Diyagramları (Data Flow)

### 2.1. Standart Not Senkronizasyonu (Çevrimdışı -> Çevrimiçi)

1. Kullanıcı internet yokken (offline) bir not yazar.


2. **Client Core:** Değişikliği Yjs (CRDT) formatına çevirir ve yerel veritabanına kaydeder.
3. Kullanıcı internete bağlanır.
4. **Sync Manager:** Bekleyen CRDT güncellemelerini paketler ve Sync Service'e (WebSocket) gönderir.
5. **Sync Service:** Gelen operasyonları alır, Primary DB'deki mevcut not geçmişinin üzerine "yeni operasyonlar" olarak yazar. Diğer aktif cihazlara (varsa) anında push eder.

### 2.2. Şifreli Kasa (Vault) Yazma İşlemi

1. Kullanıcı "Master Password" girer.
2. **Cryptography Engine:** Şifreden (KDF kullanılarak) yerel bir bellek anahtarı (in-memory key) üretir.
3. Kullanıcı notu düzenler. CRDT Resolver bu değişiklikleri bir operasyon vektörüne çevirir.
4. **Cryptography Engine:** CRDT vektörünü AES-256-GCM ile tamamen şifreler.


5. **Sync Manager:** Şifreli blob'u sunucuya gönderir. Sunucu veriyi okuyamaz, sadece depolayıp diğer cihazlara aktarmakla görevlidir.

## 3. Teknik Kısıtlar ve Mimari Sınırlar (Constraints)

* **Sunucu Tarafında Arama Yapılamaz:** Kasa notları E2EE ile şifrelendiği için, metin araması (Search) işlemi sadece kullanıcının cihazında, verilerin şifresi çözüldükten sonra yerel indeksleme ile yapılmak zorundadır.


* **Şifre Kurtarma İmkansızlığı:** Master Password sunucuya iletilmediği için, şifre sıfırlama mekanizması kasadaki veriler için geçerli değildir. Kullanıcı şifreyi unutursa kasa verisi kriptografik olarak kurtarılamaz.


* **Payload Büyüklüğü:** CRDT kullanımı, not metninin kendisinden ziyade karakter bazlı ekleme/silme geçmişini (history) sakladığı için veri boyutu zamanla şişebilir. Client ve Server tarafında periyodik "Garbage Collection" ve CRDT geçmişi sıkıştırma algoritmaları devreye alınmalıdır.
* **Performans Bütçesi:** MVP gereksinimi olan "1.5 saniye altında yüklenme" hedefi için, Client Core modülü (şifreleme ve CRDT) Web Worker'lar içinde asenkron çalıştırılarak ana UI iş parçacığının (Main Thread) bloke olması engellenmelidir.



Bu blueprint, geliştirme ekibinin Web, Mobil ve Backend mimarisini teknoloji bağımsız olarak paralel şekilde inşa etmeye başlaması için gereken tüm altyapı standartlarını belirlemektedir.