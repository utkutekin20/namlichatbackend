const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { OpenAI } = require("openai");
require('dotenv').config({ path: './production.env' });
const mongoose = require('mongoose');

// Mongoose buffer ayarları
mongoose.set('bufferCommands', false);
const cron = require('node-cron');

// Web Scraper'ları import et
const { NamliTurizmWebScraper, NamliTurizmInfo } = require('./namliTurizmScraper');
const namliTurizmStaticInfo = require('./namliTurizmStaticData');

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Namlı Turizm turları ve araç bilgileri
let namliTurlar = [];
try {
  namliTurlar = JSON.parse(fs.readFileSync('namli_turlar.json', 'utf-8'));
} catch (err) {
  console.log('⚠️ namli_turlar.json bulunamadı, boş liste kullanılıyor');
}

// Tur (Tour) şeması ve modeli
const TurSchema = new mongoose.Schema({
  tur_adi: String,
  kategori: String, // konaklamali, gunubirlik, yurtdisi
  fiyat: Number,
  sure: String,
  kalkis_noktasi: String,
  destinasyon: String,
  ozellikler: [String],
  aktif: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Tur = mongoose.model('Tur', TurSchema, 'namli_turlar');

// Araç (Vehicle) şeması
const AracSchema = new mongoose.Schema({
  marka: String,
  model: String,
  yil: Number,
  tip: String, // otomobil, minibus, otobus
  kapasite: String,
  ozellikler: [String],
  aktif: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Arac = mongoose.model('Arac', AracSchema, 'namli_araclar');

// Rezervasyon şeması
const RezervasyonSchema = new mongoose.Schema({
  musteri_adi: String,
  telefon: String,
  email: String,
  hizmet_tipi: String, // tur, transfer, servis, kiralama
  detaylar: Object,
  tarih: Date,
  durum: { type: String, default: 'beklemede' }, // beklemede, onaylandi, iptal
  notlar: String,
  createdAt: { type: Date, default: Date.now }
});

const Rezervasyon = mongoose.model('Rezervasyon', RezervasyonSchema, 'namli_rezervasyonlar');

// Turları veritabanına yükle
const initializeTours = async () => {
  try {
    const tourCount = await Tur.countDocuments();
    console.log(`📊 Mevcut MongoDB tur sayısı: ${tourCount}`);
    console.log(`📊 JSON dosyasındaki tur sayısı: ${namliTurlar.length}`);
    
    if (tourCount === 0 && namliTurlar.length > 0) {
      console.log('🔄 Turlar MongoDB\'ye aktarılıyor...');
      await Tur.insertMany(namliTurlar);
      console.log(`✅ ${namliTurlar.length} tur başarıyla MongoDB'ye eklendi.`);
    } else {
      console.log('ℹ️ MongoDB\'de zaten turlar var veya JSON dosyası boş');
    }
  } catch (err) {
    console.error('❌ Tur aktarım hatası:', err);
  }
};

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  minPoolSize: 5,
  maxIdleTimeMS: 30000,
  connectTimeoutMS: 30000
})
.then(() => {
  console.log('✅ MongoDB bağlantısı başarılı!');
  initializeTours();
})
.catch(err => console.error('❌ MongoDB bağlantı hatası:', err));

// Chat şeması
const ChatSchema = new mongoose.Schema({
  sessionId: { type: String, index: true },
  userMessage: String,
  assistantResponse: String,
  createdAt: { type: Date, default: Date.now }
});

const Chat = mongoose.model('Chat', ChatSchema, 'namli_chat');

// Türkçe karakter normalleştirme
const normalizeTurkish = (text) => {
  const charMap = {
    'ı': 'i', 'ğ': 'g', 'ü': 'u', 'ş': 's', 'ö': 'o', 'ç': 'c',
    'İ': 'i', 'Ğ': 'g', 'Ü': 'u', 'Ş': 's', 'Ö': 'o', 'Ç': 'c'
  };
  return text.replace(/[ığüşöçİĞÜŞÖÇ]/g, char => charMap[char] || char);
};

// Akıllı mesaj analizi için promptlar
const PROMPTS = {
  intentAnalysis: (message) => `
Sen Namlı Turizm'in AI asistanısın.
Kullanıcının mesajını analiz edip tam olarak ne istediğini anlamalısın.

Mesaj: "${message}"

ÖRNEKLER:
"Kapadokya turuna gitmek istiyorum" → "Kullanıcı Kapadokya turu hakkında bilgi istiyor"
"Otobüs kiralama fiyatları" → "Kullanıcı araç kiralama fiyatları hakkında bilgi istiyor"
"Havalimanı transferi var mı?" → "Kullanıcı VIP transfer hizmeti hakkında bilgi istiyor"
"Öğrenci servisi hakkında bilgi" → "Kullanıcı öğrenci servis taşımacılığı hakkında bilgi istiyor"
"İletişim bilgileri" → "Kullanıcı iletişim bilgilerini istiyor"
"Tur rezervasyonu yapmak istiyorum" → "Kullanıcı tur rezervasyonu yapmak istiyor"

Kullanıcının ne istediğini tek cümleyle açıkla:`,

  tourSearch: (query) => `
Namlı Turizm'in turları arasında arama yap.
Arama kriteri: "${query}"

Şu bilgilere göre filtrele:
- Tur adı
- Kategori (konaklamalı, günübirlik, yurtdışı)
- Destinasyon
- Fiyat aralığı
- Özellikler

En uygun turları listele.`
};

// Intent analizi
const analyzeIntent = async (message) => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Sen bir intent analiz asistanısın." },
        { role: "user", content: PROMPTS.intentAnalysis(message) }
      ],
      temperature: 0.3,
      max_tokens: 100
    });
    
    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('Intent analiz hatası:', error);
    return message;
  }
};

// Intent'e göre kategori belirleme
const categorizeIntent = (intent) => {
  const lowerIntent = intent.toLowerCase();
  
  // Tur aramaları
  if (lowerIntent.includes('tur') || lowerIntent.includes('gezi') || 
      lowerIntent.includes('seyahat') || lowerIntent.includes('tatil')) {
    return { type: 'tur', description: intent };
  }
  
  // Hizmet sorguları
  if (lowerIntent.includes('servis') || lowerIntent.includes('transfer') || 
      lowerIntent.includes('kiralama') || lowerIntent.includes('araç')) {
    return { type: 'hizmet', description: intent };
  }
  
  // Rezervasyon
  if (lowerIntent.includes('rezervasyon') || lowerIntent.includes('kayıt') || 
      lowerIntent.includes('başvuru')) {
    return { type: 'rezervasyon', description: intent };
  }
  
  // İletişim
  if (lowerIntent.includes('iletişim') || lowerIntent.includes('telefon') || 
      lowerIntent.includes('adres') || lowerIntent.includes('ulaş')) {
    return { type: 'iletisim', description: intent };
  }
  
  // Kurumsal
  if (lowerIntent.includes('hakkında') || lowerIntent.includes('tarihçe') || 
      lowerIntent.includes('kurumsal') || lowerIntent.includes('namlı turizm nedir')) {
    return { type: 'kurumsal', description: intent };
  }
  
  // Fiyat
  if (lowerIntent.includes('fiyat') || lowerIntent.includes('ücret') || 
      lowerIntent.includes('maliyet') || lowerIntent.includes('kaç tl')) {
    return { type: 'fiyat', description: intent };
  }
  
  return { type: 'genel', description: intent };
};

// Tur arama fonksiyonu
const searchTours = async (query) => {
  try {
    const normalizedQuery = normalizeTurkish(query.toLowerCase());
    console.log('🔍 Tur arama sorgusu:', normalizedQuery);
    
    // Özel arama kelimeleri çıkar
    const searchWords = normalizedQuery.split(' ').filter(word => 
      word.length > 2 && !['bana', 'misin', 'verir', 'var', 'mi', 'tur', 'turu'].includes(word)
    );
    
    console.log('🔎 Arama kelimeleri:', searchWords);
    
    // Her kelime için arama koşulları oluştur
    const orConditions = [];
    searchWords.forEach(word => {
      orConditions.push(
        { tur_adi: { $regex: word, $options: 'i' } },
        { destinasyon: { $regex: word, $options: 'i' } },
        { kategori: { $regex: word, $options: 'i' } }
      );
    });
    
    // Eğer hiç kelime yoksa boş dön
    if (orConditions.length === 0) {
      // Genel tur listesi dön
      const tours = await Tur.find({ aktif: true }).limit(10);
      console.log(`✅ ${tours.length} tur bulundu (genel liste)`);
      return tours;
    }
    
    // Veritabanında arama yap
    const searchConditions = { $or: orConditions };
    
    const tours = await Tur.find(searchConditions).limit(10);
    console.log(`✅ ${tours.length} tur bulundu`);
    
    return tours;
  } catch (error) {
    console.error('❌ Tur arama hatası:', error);
    return [];
  }
};

// Akıllı yanıt üretimi için sistem prompt
const systemPrompt = `
Sen Namlı Turizm'in (${namliTurizmStaticInfo.fullName}) resmi AI asistanısın.
Her zaman kibar, yardımsever ve profesyonel ol. Müşterilere "Sayın misafirimiz" diye hitap et.

🏢 NAMLI TURİZM HAKKINDA:
- Kuruluş: ${namliTurizmStaticInfo.history.foundingYear}
- Slogan: ${namliTurizmStaticInfo.slogan}
- Motto: ${namliTurizmStaticInfo.motto}
- Deneyim: ${namliTurizmStaticInfo.statistics.experience}
- Araç Filosu: ${namliTurizmStaticInfo.statistics.fleet}
- Merkez: ${namliTurizmStaticInfo.contact.mainOffice.address}

📞 İLETİŞİM:
- Telefon: ${namliTurizmStaticInfo.contact.mainOffice.phone}
- E-posta: ${namliTurizmStaticInfo.contact.mainOffice.email}
- Web: ${namliTurizmStaticInfo.contact.website}

🎯 HİZMETLERİMİZ:
1. TURLAR: Konaklamalı kültür turları, günübirlik turlar, yurtdışı turlar
2. SERVİS: Öğrenci ve personel servis taşımacılığı
3. TRANSFER: VIP transfer ve havalimanı transferleri
4. KİRALAMA: Araç kiralama hizmetleri

⚠️ LINK FORMATLAMA:
- SADECE HTML formatında link ver: <a href="URL" target="_blank">Metin</a>
- Markdown veya düz URL kullanma!

YANIT KURALLARI:
1. Kısa, net ve çözüm odaklı cevaplar ver
2. Gerçek veritabanı verilerini kullan
3. Fiyat bilgisi varsa mutlaka belirt
4. İletişim bilgilerini her fırsatta paylaş
5. Rezervasyon için yönlendir

Müşteri memnuniyeti bizim önceliğimiz!`;

// Ana sohbet endpoint'i - Frontend'in beklediği endpoint
app.post('/api/ask', async (req, res) => {
  try {
    const { message, sessionId, history = [] } = req.body;
    console.log('\n🔵 Yeni mesaj alındı:', message);
    
    // Intent analizi
    const intent = await analyzeIntent(message);
    console.log('🎯 Tespit edilen intent:', intent);
    
    // Intent kategorisi
    const category = categorizeIntent(intent);
    console.log('📁 Kategori:', category.type);
    
    // Veritabanından ilgili bilgileri çek
    let relevantData = [];
    let tours = [];
    
    // Tur araması
    if (category.type === 'tur' || message.toLowerCase().includes('tur')) {
      tours = await searchTours(message);
      
      // NamliTurizmInfo'dan da bilgi çek
      const turInfo = await NamliTurizmInfo.find({
        category: 'turlar',
        $or: [
          { title: { $regex: message, $options: 'i' } },
          { content: { $regex: message, $options: 'i' } }
        ]
      }).limit(5);
      
      relevantData = [...relevantData, ...turInfo];
    }
    
    // Diğer bilgileri çek
    const generalInfo = await NamliTurizmInfo.find({
          $or: [
        { category: category.type },
            { content: { $regex: message, $options: 'i' } }
          ]
    }).limit(10);
    
    relevantData = [...relevantData, ...generalInfo];
    
    // Context oluştur
    let context = `KULLANICI TALEBİ: ${intent}\n\n`;
    
    if (tours.length > 0) {
      context += 'BULUNAN TURLAR:\n';
      tours.forEach(tur => {
        context += `- ${tur.tur_adi}: ${tur.sure}, ${tur.destinasyon}`;
        if (tur.fiyat > 0) context += `, Fiyat: ${tur.fiyat} TL`;
        context += '\n';
      });
      context += '\n';
    }
    
    if (relevantData.length > 0) {
      context += 'İLGİLİ BİLGİLER:\n';
      relevantData.forEach(info => {
        context += `- ${info.title}: ${info.content.substring(0, 200)}...\n`;
      });
    }
    
    // Mesaj geçmişini hazırla
  const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-6),
      { role: "user", content: context + '\n\nKullanıcı mesajı: ' + message }
    ];
    
    // OpenAI'dan yanıt al
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages,
      temperature: 0.7,
      max_tokens: 800
    });
    
    const aiResponse = completion.choices[0].message.content;

    // Aksiyon butonları ekle
    const buttons = getActionButtons(category.type, tours);
    
    // Chat'i kaydet
    await Chat.create({
      sessionId,
      userMessage: message,
      assistantResponse: aiResponse
    });
    
    // Frontend'in beklediği formata uygun response
    res.json({
      answer: aiResponse,
      suggestions: buttons.map(btn => btn.text),
      response: aiResponse, // Geriye uyumluluk için
      buttons,
      category: category.type,
      tours: tours.slice(0, 3) // İlk 3 turu göster
    });
    
  } catch (error) {
    console.error('❌ Chat hatası:', error);
    res.status(500).json({
      answer: 'Üzgünüm, bir hata oluştu. Lütfen daha sonra tekrar deneyin veya bizi arayın: ' + namliTurizmStaticInfo.contact.mainOffice.phone,
      response: 'Üzgünüm, bir hata oluştu. Lütfen daha sonra tekrar deneyin veya bizi arayın: ' + namliTurizmStaticInfo.contact.mainOffice.phone,
      error: error.message
    });
  }
});

// Aksiyon butonları
const getActionButtons = (category, tours = []) => {
  const baseButtons = [
    { text: "📞 Hemen Ara", action: "call" },
    { text: "💬 WhatsApp", action: "whatsapp" },
    { text: "📧 E-posta Gönder", action: "email" }
  ];
  
  switch(category) {
    case 'tur':
      return [
        { text: "🎫 Tur Rezervasyonu", action: "reservation" },
        { text: "📋 Tüm Turları Gör", action: "all-tours" },
        ...baseButtons
      ];
    
    case 'hizmet':
      return [
        { text: "🚌 Araç Kiralama", action: "car-rental" },
        { text: "🎓 Servis Başvurusu", action: "service-application" },
        ...baseButtons
      ];
    
    case 'rezervasyon':
      return [
        { text: "📝 Rezervasyon Formu", action: "reservation-form" },
        { text: "✅ Rezervasyon Takibi", action: "track-reservation" },
        ...baseButtons
      ];
    
    default:
      return [
        { text: "🏢 Kurumsal", action: "corporate" },
        { text: "🗺️ Turlarımız", action: "tours" },
        { text: "🚌 Hizmetlerimiz", action: "services" },
        ...baseButtons
      ];
  }
};

// Turları listele endpoint'i
app.get('/tours', async (req, res) => {
  try {
    const { kategori, min_fiyat, max_fiyat } = req.query;
    let query = { aktif: true };
    
    if (kategori) query.kategori = kategori;
    if (min_fiyat || max_fiyat) {
      query.fiyat = {};
      if (min_fiyat) query.fiyat.$gte = Number(min_fiyat);
      if (max_fiyat) query.fiyat.$lte = Number(max_fiyat);
    }
    
    const tours = await Tur.find(query).sort({ fiyat: 1 });
    res.json({ success: true, data: tours });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Araç filosu endpoint'i
app.get('/fleet', async (req, res) => {
  try {
    const { tip } = req.query;
    let query = { aktif: true };
    
    if (tip) query.tip = tip;
    
    const vehicles = await Arac.find(query).sort({ yil: -1 });
    res.json({ success: true, data: vehicles });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Rezervasyon endpoint'i
app.post('/reservation', async (req, res) => {
  try {
    const rezervasyon = new Rezervasyon(req.body);
    await rezervasyon.save();
    
    res.json({
      success: true,
      message: 'Rezervasyonunuz alındı. En kısa sürede size dönüş yapacağız.',
      rezervasyon_no: rezervasyon._id
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Namlı Turizm bilgilerini getir
app.get('/namli-info', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = {};
    
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    
    const data = await NamliTurizmInfo.find(query).sort({ lastUpdated: -1 });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Web scraper'ı günlük çalıştır (gece 3'te)
cron.schedule('0 3 * * *', async () => {
  console.log('🔄 Günlük Namlı Turizm veri güncelleme başlatılıyor...');
  try {
    const scraper = new NamliTurizmWebScraper();
    await scraper.updateDatabase();
    console.log('✅ Günlük veri güncelleme tamamlandı');
  } catch (error) {
    console.error('❌ Günlük güncelleme hatası:', error);
  }
});

// İlk başlatmada veri çek
setTimeout(async () => {
  try {
    console.log('🚀 İlk Namlı Turizm veri çekme işlemi başlatılıyor...');
    const scraper = new NamliTurizmWebScraper();
    await scraper.updateDatabase();
    console.log('✅ İlk veri çekme tamamlandı!');
  } catch (error) {
    console.log('⚠️ İlk veri çekme hatası:', error.message);
  }
}, 5000); // 5 saniye sonra başlat

app.listen(3000, () => console.log('✅ Namlı Turizm backend http://localhost:3000 üzerinde çalışıyor!'));
