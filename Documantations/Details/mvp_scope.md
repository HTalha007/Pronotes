**Ürün Hedefi (MVP):** Kullanıcılara "Sade Arayüz, Güçlü Markdown ve Uçtan Uca Şifreli Gizli Kasa" sunan, bireysel odaklı, çevrimdışı çalışabilen web tabanlı not uygulaması.

### 1. MoSCoW Önceliklendirmesi

**Must-Have (Olmazsa Olmazlar - v1.0 Kapsamı)**

* **UI:** Google Keep benzeri minimalist grid/post-it görünümü.
* **Temel Notlar:** Sunucuda senkronize edilen, hızlı aranabilir metin notları.
* **Şifreli Kasa (E2EE):** Kullanıcının sadece kendi belirlediği bir "Master Password" ile girebildiği, verilerin tarayıcıda AES-256-GCM ile şifrelenip buluta anlamsız veri (blob) olarak gittiği güvenli alan.


* **Zengin Metin (Temel Markdown):** `/` (slash) menüsü olmadan, sadece temel Markdown kuralları (kalın, italik, liste, kod bloğu) destekleyen editör.
* **Çevrimdışı Temel Destek:** İnternet yokken not alabilme; cihaz online olduğunda *Yjs (CRDT)* kütüphanesiyle kendi notlarını çakışmasız senkronize etme.
* **Platform:** Sadece Responsive Web App ve PWA (Progressive Web App).

**Should-Have (Olsa İyi Olur - Hızlı Güncellemeler v1.1)**

* Notları başkalarıyla "Salt Okunur" (Read-only) link olarak paylaşabilme.


* Notları renklendirme ve etiketleme (Tagging).
* Karanlık Mod (Dark Mode).

**Could-Have (Daha Sonra Yapılabilir - v2.0 Kapsamı)**

* Mobil Native Uygulamalar (iOS / Android).


* Yüz tanıma / Parmak izi ile Kasa açılışı.


* Markdown tabloları ve gelişmiş birbirine bağlı not (Backlinking) yapısı.

**Won't-Have (Şu An Kapsam Dışı - Rafa Kalkanlar)**

* Aynı not üzerinde eşzamanlı ortak çalışma (Multiplayer / Canlı İmleçler).


* Not içi yorum yapma ve `@` ile takım arkadaşlarını etiketleme.


* Kurumsal paketler, ekip çalışma alanları, yetki yönetimi (Admin Panel).



### 2. MVP Başarı Metrikleri (Success Metrics)

MVP aşamasında paradan çok, "ürün-pazar uyumunu" (Product-Market Fit) kanıtlamamız gerekir:

* **Aktivasyon (Activation):** Kayıt olan kullanıcıların ilk 24 saat içinde en az 1 not oluşturma oranı (Hedef: >%60).
* **Kasa Kullanımı (Core Value):** Aktif kullanıcıların en az %20'sinin "Şifreli Kasa" özelliğini kullanarak ilk şifreli notunu oluşturması. (Eğer bu olmazsa, ürünün rekabet avantajı yok demektir).
* **Bağlılık (Retention):** 1. Hafta (Day-7) geri dönüş oranı (Hedef: >%25).
* **Performans:** Web uygulamasının ilk yüklenme ve etkileşime hazır olma süresinin 1.5 saniyenin altında kalması.