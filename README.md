# Namlı Turizm AI Chatbot Backend

## 🚀 Proje Hakkında

Bu proje, Namlı Turizm'in 7/24 aktif AI destek asistanı için geliştirilmiş backend sistemidir. 1979'dan beri hizmet veren Namlı Turizm'in tüm hizmetleri hakkında bilgi veren, tur rezervasyonu ve müşteri destek hizmetleri sunan akıllı bir chatbot'tur.

## 🌟 Özellikler

- **AI Destekli Sohbet**: OpenAI GPT-4 ile güçlendirilmiş akıllı asistan
- **Tur Arama**: 50+ tur programı arasında akıllı arama
- **Rezervasyon Sistemi**: Online tur ve hizmet rezervasyonu
- **Çoklu Hizmet Desteği**: Turlar, servis taşımacılığı, transfer, araç kiralama
- **Otomatik Veri Güncelleme**: Web scraping ile güncel bilgiler
- **MongoDB Veritabanı**: Ölçeklenebilir veri depolama

## 🛠️ Teknolojiler

- **Node.js & Express**: Backend framework
- **MongoDB & Mongoose**: Veritabanı
- **OpenAI API**: AI sohbet yetenekleri
- **Cheerio & Axios**: Web scraping
- **dotenv**: Çevre değişkenleri yönetimi

## 📋 Kurulum

1. **Projeyi klonlayın**
```bash
git clone [proje-url]
cd namli-turizm-backend
```

2. **Bağımlılıkları yükleyin**
```bash
npm install
```

3. **production.env dosyasını düzenleyin**
```env
MONGODB_URI=your_mongodb_uri
OPENAI_API_KEY=your_openai_api_key
```

4. **Uygulamayı başlatın**
```bash
npm start
```

## 🌐 API Endpoints

### Chat Endpoint
- **POST /chat**: AI asistan ile sohbet
```json
{
  "message": "Kapadokya turu hakkında bilgi",
  "sessionId": "unique-session-id",
  "history": []
}
```

### Tur Endpoints
- **GET /tours**: Tüm turları listele
- **GET /tours?kategori=konaklamali**: Kategoriye göre filtrele

### Rezervasyon
- **POST /reservation**: Yeni rezervasyon oluştur

### Bilgi Endpoint
- **GET /namli-info**: Namlı Turizm hakkında bilgiler

## 🤖 Chatbot Özellikleri

### Desteklenen Konular:
- ✈️ **Turlar**: Konaklamalı, günübirlik, yurtdışı turlar
- 🚌 **Servis Hizmetleri**: Öğrenci ve personel servisleri
- 🚗 **Transfer**: VIP transfer, havalimanı transferi
- 🚙 **Araç Kiralama**: Günlük araç kiralama hizmetleri
- 📞 **İletişim**: Telefon, adres, departman bilgileri
- 🏢 **Kurumsal**: Tarihçe, kalite politikaları, referanslar

### Örnek Sorular:
- "Kapadokya turları hakkında bilgi verir misiniz?"
- "Öğrenci servisi için başvuru nasıl yapılır?"
- "Havalimanı transferi fiyatları nedir?"
- "GAP turu ne zaman?"
- "İletişim bilgilerinizi alabilir miyim?"

## 📊 Veritabanı Yapısı

### Koleksiyonlar:
- **namli_turlar**: Tur bilgileri
- **namli_araclar**: Araç filosu
- **namli_rezervasyonlar**: Rezervasyon kayıtları
- **namli_chat**: Sohbet geçmişi
- **namliturizminfos**: Web'den çekilen bilgiler

## 🔧 Bakım ve Güncelleme

- Web scraper günlük olarak gece 3'te otomatik çalışır
- Manuel güncelleme için scraper'ı yeniden çalıştırabilirsiniz
- MongoDB bağlantı ayarları optimize edilmiştir

## 📱 İletişim

**Namlı Turizm**
- 📍 Adres: Pelitlibağ Mah. 1126 Sok. No:22 Pamukkale/DENİZLİ
- 📞 Telefon: +90 258 263 33 77
- 📧 E-posta: seyahat@namliturizm.com
- 🌐 Web: www.namliturizm.com

## ⚡ Performans İpuçları

- MongoDB connection pool optimize edilmiştir
- Batch insert kullanılarak veri yazma hızlandırılmıştır
- Cache mekanizması ile tekrarlayan sorgular hızlandırılmıştır

## 🔒 Güvenlik

- Environment değişkenleri production.env dosyasında saklanır
- API anahtarları güvenli şekilde yönetilir
- CORS ayarları yapılandırılmıştır

---

**#NAMLIHERYERDE** 🚌✈️

*1979'dan Günümüze Uzağı Yakın Ederiz...*
