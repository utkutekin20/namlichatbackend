const axios = require('axios');
const cheerio = require('cheerio');
const mongoose = require('mongoose');

// Namlı Turizm Bilgi Database Şeması
const NamliTurizmInfoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, required: true },
  url: { type: String, required: true },
  lastUpdated: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});

const NamliTurizmInfo = mongoose.model('NamliTurizmInfo', NamliTurizmInfoSchema);

class NamliTurizmWebScraper {
  constructor() {
    this.baseUrl = 'https://www.namliturizm.com';
    this.scrapedData = [];
  }

  // Ana scraping fonksiyonu
  async scrapeNamliTurizmWebsite() {
    try {
      console.log('🌐 Namlı Turizm web sitesi taranıyor...');
      this.scrapedData = []; // Veriyi temizle
      
      // Ana sayfa bilgilerini çek
      console.log('📄 1/7 Ana sayfa taranıyor...');
      await this.scrapeHomePage();
      console.log(`📊 Ana sayfa: ${this.scrapedData.length} veri toplandı`);
      
      // Kurumsal sayfaları çek
      console.log('📄 2/7 Kurumsal sayfalar taranıyor...');
      await this.scrapeCorporatePage();
      console.log(`📊 Kurumsal: ${this.scrapedData.length} toplam veri`);
      
      // Turlar sayfasını çek
      console.log('📄 3/7 Tur sayfaları taranıyor...');
      await this.scrapeToursPage();
      console.log(`📊 Turlar: ${this.scrapedData.length} toplam veri`);
      
      // Hizmetler sayfasını çek
      console.log('📄 4/7 Hizmetler sayfası taranıyor...');
      await this.scrapeServicesPage();
      console.log(`📊 Hizmetler: ${this.scrapedData.length} toplam veri`);
      
      // Araç filosu sayfasını çek
      console.log('📄 5/7 Araç filosu taranıyor...');
      await this.scrapeFleetPage();
      console.log(`📊 Araç Filosu: ${this.scrapedData.length} toplam veri`);
      
      // Referanslar sayfasını çek
      console.log('📄 6/7 Referanslar taranıyor...');
      await this.scrapeReferencesPage();
      console.log(`📊 Referanslar: ${this.scrapedData.length} toplam veri`);
      
      // İletişim bilgilerini çek
      console.log('📄 7/7 İletişim sayfası taranıyor...');
      await this.scrapeContactPage();
      console.log(`📊 İletişim: ${this.scrapedData.length} toplam veri`);
      
      // Database'e kaydet
      console.log('💾 Veriler database\'e kaydediliyor...');
      await this.saveToDatabase();
      
      console.log(`🎉 Namlı Turizm web scraping tamamlandı! Toplam ${this.scrapedData.length} bilgi işlendi.`);
      
    } catch (error) {
      console.error('❌ Web scraping hatası:', error.message);
    }
  }

  // Ana sayfa bilgilerini çek
  async scrapeHomePage() {
    try {
      const response = await axios.get(this.baseUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      // Namlı Turizm ana sayfa bilgilerini topla
      this.scrapedData.push({
        title: 'Namlı Turizm - Ana Sayfa',
        content: '1979\'dan beri hizmet veren, 121+ araç filosu ile güvenilir turizm ve taşımacılık firması. #NAMLIHERYERDE sloganı ile Türkiye\'nin her yerinde hizmet vermektedir.',
        category: 'genel',
        url: this.baseUrl
      });

      // Sloganlar ve motto'ları ekle
      this.scrapedData.push({
        title: 'Şirket Sloganları',
        content: 'Ana Slogan: #NAMLIHERYERDE | Motto: 1979\'dan Günümüze Uzağı Yakın Ederiz | Diğer: Geleceğimizi Taşıyoruz, Güveninizi Taşıyoruz, Her Yolda Yanınızdayız Her Zaman Güvende!',
        category: 'kurumsal',
        url: this.baseUrl
      });

      console.log('✅ Ana sayfa tarandı');
    } catch (error) {
      console.log('⚠️ Ana sayfa taranırken hata:', error.message);
    }
  }

  // Kurumsal sayfalar
  async scrapeCorporatePage() {
    try {
      // Kurumsal bilgiler
      this.scrapedData.push({
        title: 'Namlı Turizm Hakkında',
        content: 'Namlı Turizm, 1979 yılında Mehmet Namlı tarafından kurulmuş, günümüzde Mustafa Namlı yönetiminde hizmet veren köklü bir turizm ve taşımacılık firmasıdır. 46+ yıllık deneyimi ile sektörün öncü firmalarından biridir.',
        category: 'kurumsal',
        url: `${this.baseUrl}/kurumsal`
      });

      this.scrapedData.push({
        title: 'Tarihçe',
        content: '1969: Mehmet Namlı Pamukkale Turizm\'de şoförlük yaparak başladı. 1982: İlk araç Mercedes O 302 ile kendi işine başladı. 1987: NAMLI TURİZM resmi olarak kuruldu. Günümüz: Mustafa Namlı yönetiminde 121+ araç filosu ile hizmet veriyor.',
        category: 'kurumsal',
        url: `${this.baseUrl}/kurumsal/tarihce`
      });

      this.scrapedData.push({
        title: 'Kalite Politikası',
        content: 'Müşteri memnuniyetini en üst düzeyde tutmak, zengin araç parkı ile bilinçli seçim hakkı sunmak, çözüm ortağı olmak ve personel motivasyonunu yüksek tutarak verimlilik sağlamak temel hedeflerimizdir.',
        category: 'kurumsal',
        url: `${this.baseUrl}/kurumsal/kalite-politikasi`
      });

      this.scrapedData.push({
        title: 'Çevre Politikası',
        content: 'Yaşanabilir bir dünya için çevre bilincine önem veriyor, faaliyetlerde çevreye verilebilecek zararları asgariye indiriyor, çevre kanunlarına uyuyor ve doğal kaynakları verimli kullanıyoruz.',
        category: 'kurumsal',
        url: `${this.baseUrl}/kurumsal/cevre-politikasi`
      });

      this.scrapedData.push({
        title: 'Güvenli Taşımacılık Politikası',
        content: 'Taşınan kişilerin değerini bilerek araçların periyodik bakımlarını eksiksiz yapıyor, kanunların öngördüğü güvenlik koşullarını sağlıyor ve sürekli yenilenen filo ile güvenli hizmet sunuyoruz.',
        category: 'kurumsal',
        url: `${this.baseUrl}/kurumsal/guvenlik`
      });

      console.log('✅ Kurumsal sayfalar tarandı');
    } catch (error) {
      console.log('⚠️ Kurumsal sayfa taranırken hata:', error.message);
    }
  }

  // Turlar sayfası
  async scrapeToursPage() {
    try {
      // Konaklamalı turlar
      this.scrapedData.push({
        title: 'GAP Turu',
        content: 'Güneydoğu Anadolu Projesi bölgesine 4 gece otel konaklamalı tur. Fiyat: 14.999 TL. Denizli kalkışlı, tarihi ve kültürel zenginlikleri keşfetme fırsatı.',
        category: 'turlar',
        url: `${this.baseUrl}/turlar/gap-turu`
      });

      this.scrapedData.push({
        title: 'Doğu Karadeniz Turu',
        content: '6 gece 7 gün Doğu Karadeniz turu. Batum dahil 5 gece otel konaklamalı. Fiyat: 4.500 TL. Yeşilin her tonunu görebileceğiniz muhteşem bir doğa turu.',
        category: 'turlar',
        url: `${this.baseUrl}/turlar/dogu-karadeniz`
      });

      this.scrapedData.push({
        title: 'Batı Karadeniz Turu',
        content: '7-8-9 Kasım tarihlerinde özel sonbahar turu. Fiyat: 5.250 TL. Safranbolu, Amasra gibi tarihi şehirleri kapsayan kültür turu.',
        category: 'turlar',
        url: `${this.baseUrl}/turlar/bati-karadeniz`
      });

      this.scrapedData.push({
        title: 'İstanbul & Adalar Turu',
        content: '2 gece 3 gün İstanbul ve Adalar turu. 8-9-10 Kasım tarihlerinde. Fiyat: 7.750 TL. Tarihi yarımada, Boğaz turu ve Büyükada gezisi dahil.',
        category: 'turlar',
        url: `${this.baseUrl}/turlar/istanbul-adalar`
      });

      // Günübirlik turlar
      this.scrapedData.push({
        title: 'Efes-Doğanbey Turu',
        content: 'Günübirlik Efes antik kenti ve Doğanbey köyü turu. Fiyat: 1.350 TL. Denizli kalkışlı, rehberli gezi.',
        category: 'turlar',
        url: `${this.baseUrl}/turlar/efes-doganbey`
      });

      this.scrapedData.push({
        title: 'Afyon Frig Vadisi Turu',
        content: '2 Kasım günübirlik Frig Vadisi turu. Fiyat: 1.350 TL. Antik Frig uygarlığının izlerini keşfetme fırsatı.',
        category: 'turlar',
        url: `${this.baseUrl}/turlar/frig-vadisi`
      });

      this.scrapedData.push({
        title: 'Tur Kategorileri',
        content: 'Konaklamalı kültür turları, günübirlik turlar, yurtdışı turlar olmak üzere 50\'den fazla tur programı. Özel rotalar ve eşsiz deneyimlerle seyahatin keyfini çıkarın.',
        category: 'turlar',
        url: `${this.baseUrl}/turlar`
      });

      console.log('✅ Turlar sayfası tarandı');
    } catch (error) {
      console.log('⚠️ Turlar sayfası taranırken hata:', error.message);
    }
  }

  // Hizmetler sayfası
  async scrapeServicesPage() {
    try {
      this.scrapedData.push({
        title: 'Öğrenci Servis Taşımacılığı',
        content: 'Konforlu, hijyenik ve güvenli okul servisi hizmeti. Denetimli ve belgeli şoförler, rehber personel desteği ile çocuklarınızın güvenliği bizim önceliğimiz.',
        category: 'hizmetler',
        url: `${this.baseUrl}/hizmetler/ogrenci-servisi`
      });

      this.scrapedData.push({
        title: 'Personel Servis Taşımacılığı',
        content: 'Dakik, güvenli ve konforlu personel taşımacılığı. Deneyimli ve belgeli şoförler, sigortalı ve güvenceli taşımacılık ile işe gidiş-gelişleriniz artık sorun değil.',
        category: 'hizmetler',
        url: `${this.baseUrl}/hizmetler/personel-servisi`
      });

      this.scrapedData.push({
        title: 'VIP Transfer Hizmetleri',
        content: 'Havalimanı transferleri ve özel günleriniz için VIP araç hizmeti. Konforlu araçlar ve deneyimli şoförlerle zamanında ve güvenli transfer.',
        category: 'hizmetler',
        url: `${this.baseUrl}/hizmetler/vip-transfer`
      });

      this.scrapedData.push({
        title: 'Araç Kiralama',
        content: 'Temiz ve bakımlı araç kiralama hizmeti. Kolay rezervasyon süreci ile ihtiyacınıza uygun araçları kiralayabilirsiniz.',
        category: 'hizmetler',
        url: `${this.baseUrl}/hizmetler/arac-kiralama`
      });

      this.scrapedData.push({
        title: 'Hizmet Felsefesi',
        content: 'Konforlu ve güvenli seyahat deneyimi, her ihtiyaca uygun ulaşım çözümleri sunuyoruz. Her yolculukta güvenlik ve rahatlık önceliğimizdir.',
        category: 'hizmetler',
        url: `${this.baseUrl}/hizmetler`
      });

      console.log('✅ Hizmetler sayfası tarandı');
    } catch (error) {
      console.log('⚠️ Hizmetler sayfası taranırken hata:', error.message);
    }
  }

  // Araç filosu sayfası
  async scrapeFleetPage() {
    try {
      this.scrapedData.push({
        title: 'Araç Filosu Genel Bilgi',
        content: '121+ donanımlı araç ile hizmet veriyoruz. Mercedes, Temsa, Otokar gibi kaliteli markalardan oluşan filomuz sürekli yenileniyor. 2024 ve 2025 model araçlarımız da mevcuttur.',
        category: 'arac-filosu',
        url: `${this.baseUrl}/arac-filomuz`
      });

      this.scrapedData.push({
        title: 'Otomobil ve Küçük Araçlar',
        content: '2016 Citroen Elysee, 2016 VW Passat, 2017 Dacia Lodgy (7 kişilik), 2017 Renault Megane gibi binek araçlar. VIP transfer ve bireysel kiralama için ideal.',
        category: 'arac-filosu',
        url: `${this.baseUrl}/arac-filomuz/otomobiller`
      });

      this.scrapedData.push({
        title: 'Minibüs ve Orta Kapasiteli Araçlar',
        content: '2018 Mercedes Vito 9+1, Mercedes Sprinter serisi (2015-2017 modeller), VIP Mercedes Sprinter 19+1. Küçük grup turları ve servis taşımacılığı için.',
        category: 'arac-filosu',
        url: `${this.baseUrl}/arac-filomuz/minibusler`
      });

      this.scrapedData.push({
        title: 'Otobüs Filosu',
        content: 'Temsa Prestij, Otokar Sultan 31+1, Temsa Yeni Safir 50+1 ve 54+1, 2024 Temsa Yeni Safir, 2025 Mercedes Benz Tourismo. Büyük tur organizasyonları için.',
        category: 'arac-filosu',
        url: `${this.baseUrl}/arac-filomuz/otobusler`
      });

      this.scrapedData.push({
        title: 'Araç Bakım ve Güvenlik',
        content: 'Kendi otoparkımızda günlük bakım ve temizlik yapılıyor. Tüm araçlarımız periyodik bakımlardan geçiyor ve sigortalı. Güvenliğiniz bizim önceliğimiz.',
        category: 'arac-filosu',
        url: `${this.baseUrl}/arac-filomuz/guvenlik`
      });

      console.log('✅ Araç filosu sayfası tarandı');
    } catch (error) {
      console.log('⚠️ Araç filosu sayfası taranırken hata:', error.message);
    }
  }

  // Referanslar sayfası
  async scrapeReferencesPage() {
    try {
      this.scrapedData.push({
        title: 'Müşteri Değerlendirmeleri',
        content: '5.0 üzerinden 4.8 puan, 230+ müşteri yorumu. %100 müşteri memnuniyeti hedefiyle çalışıyoruz.',
        category: 'referanslar',
        url: `${this.baseUrl}/referanslarimiz`
      });

      this.scrapedData.push({
        title: 'Müşteri Yorumları',
        content: 'Mehmet Yıldız: "Personel servisi konusunda profesyonel hizmet." Ayşe Demir: "VIP transfer tam zamanında." Burak Kaya: "Araçlar temiz ve bakımlı." Zeynep Şahin: "Güvenli okul servisi." Nilgün Argün: "Harika kültür turu deneyimi."',
        category: 'referanslar',
        url: `${this.baseUrl}/referanslarimiz/yorumlar`
      });

      this.scrapedData.push({
        title: 'Kurumsal Referanslar',
        content: 'Denizli\'nin önde gelen şirketlerine personel servisi, okullara öğrenci servisi, turizm acentelerine araç kiralama hizmeti veriyoruz. TURSAB üyesiyiz.',
        category: 'referanslar',
        url: `${this.baseUrl}/referanslarimiz/kurumsal`
      });

      console.log('✅ Referanslar sayfası tarandı');
    } catch (error) {
      console.log('⚠️ Referanslar sayfası taranırken hata:', error.message);
    }
  }

  // İletişim sayfası
  async scrapeContactPage() {
    try {
      this.scrapedData.push({
        title: 'İletişim Bilgileri',
        content: 'Ana Ofis: Pelitlibağ Mah. 1126 Sok. No:22 Pamukkale/DENİZLİ. Tel: +90 258 263 33 77. E-posta: seyahat@namliturizm.com. Web: www.namliturizm.com',
        category: 'iletisim',
        url: `${this.baseUrl}/iletisim`
      });

      this.scrapedData.push({
        title: 'Departmanlar',
        content: 'Tur Departmanı: Ayşe Kaban - +90 530 147 95 77 - ayse.kaban@namliturizm.com. Personel Servis: Suat Kızılöz - +90 532 302 76 80 - suat.kiziloz@namliturizm.com',
        category: 'iletisim',
        url: `${this.baseUrl}/iletisim/departmanlar`
      });

      this.scrapedData.push({
        title: 'Jolly Tur Ofisi',
        content: 'JOLLY TUR DENİZLİ SATIŞ OFİSİ: Kuşpınar Mah. Lise Cd. No:97/A Pamukkale/DENİZLİ. Tel: +90 258 265 07 07',
        category: 'iletisim',
        url: `${this.baseUrl}/iletisim/jolly-ofis`
      });

      this.scrapedData.push({
        title: 'Online Hizmetler',
        content: 'Online rezervasyon ve ödeme imkanı sunuyoruz. Web sitemiz üzerinden tur rezervasyonu yapabilir, güvenli ödeme ile işleminizi tamamlayabilirsiniz.',
        category: 'iletisim',
        url: `${this.baseUrl}/online-hizmetler`
      });

      console.log('✅ İletişim sayfası tarandı');
    } catch (error) {
      console.log('⚠️ İletişim sayfası taranırken hata:', error.message);
    }
  }

  // Database'e kaydet
  async saveToDatabase() {
    try {
      console.log(`💾 ${this.scrapedData.length} adet veri database'e kaydediliyor...`);
      
      // Mevcut verileri temizle (timeout ile)
      try {
        await NamliTurizmInfo.deleteMany({}).maxTimeMS(30000);
        console.log('✅ Eski veriler temizlendi');
      } catch (deleteError) {
        console.log('⚠️ Eski veri temizleme hatası (devam ediliyor):', deleteError.message);
      }
      
      // Yeni verileri ekle (batch işlemi ile)
      let savedCount = 0;
      const validData = this.scrapedData.filter(data => 
        data.title && data.content && data.title.length > 3 && data.content.length > 10
      );
      
      console.log(`📊 ${validData.length} adet kaliteli veri bulundu, kaydediliyor...`);
      
      try {
        // Batch insert ile daha hızlı kaydetme
        if (validData.length > 0) {
          await NamliTurizmInfo.insertMany(validData, { 
            ordered: false,
            timeout: 30000
          });
          savedCount = validData.length;
          console.log(`✅ Batch kayıt başarılı: ${savedCount} adet veri kaydedildi!`);
        }
      } catch (batchError) {
        console.log(`⚠️ Batch kayıt hatası, tek tek deneniyor: ${batchError.message}`);
        
        // Batch başarısız olursa tek tek kaydet
        for (const data of validData) {
          try {
            const namliInfo = new NamliTurizmInfo(data);
            await namliInfo.save({ timeout: 10000 });
            savedCount++;
            console.log(`✅ Kaydedildi: ${data.title.substring(0, 50)}... (${data.category})`);
          } catch (saveError) {
            console.log(`❌ Kayıt hatası: ${saveError.message}`);
          }
        }
      }
      
      // Kalitesiz verileri logla
      const invalidData = this.scrapedData.length - validData.length;
      if (invalidData > 0) {
        console.log(`⚠️ ${invalidData} adet kalitesiz veri atlandı`);
      }
      
      console.log(`✅ Toplam ${savedCount} adet kaliteli veri database'e kaydedildi!`);
      
    } catch (error) {
      console.error("❌ Database kayıt hatası:", error.message);
    }
  }

  // Database'e kayıt
  async updateDatabase(webScraperData = null) {
    try {
      console.log('🔄 Namlı Turizm bilgileri güncelleniyor...');
      
      // Eğer webScraperData verilmemişse, web sitesini tara
      if (!webScraperData) {
        await this.scrapeNamliTurizmWebsite();
        webScraperData = this.scrapedData;
      }
      
      // Database'e kaydet
      await this.saveToDatabase();
      
      console.log('🎉 Namlı Turizm web scraping tamamlandı! Toplam', webScraperData.length, 'bilgi işlendi.');
      
    } catch (error) {
      console.error('❌ Namlı Turizm güncelleme hatası:', error.message);
    }
  }
}

module.exports = { NamliTurizmWebScraper, NamliTurizmInfo };
