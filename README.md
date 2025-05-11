# Eczane Yönetim Sistemi API

Bu proje, eczaneler için geliştirilmiş kapsamlı bir yönetim sistemi API'sidir.

## Özellikler

- Eczacı kaydı ve kimlik doğrulama sistemi
- JWT tabanlı güvenli oturum yönetimi
- İlaç bilgisi sorgulama ve arama
- Konum bazlı eczacı/eczane arama
- İlaç yan etki ve geri çağırma bildirimleri
- FDA (Food and Drug Administration) ilaç veritabanı entegrasyonu
- Türkiye ve KKTC'deki nöbetçi eczanelerin listelenmesi
- Konuma göre en yakın nöbetçi eczanelerin bulunması
- MongoDB ile verimli veri depolama
- İki faktörlü kimlik doğrulama desteği

## Teknolojiler

- Node.js
- Express.js
- MongoDB
- JWT (JSON Web Tokens)
- Express Validator
- Axios (Harici API istekleri için)
- Bcrypt.js (Şifre güvenliği)
- CORS desteği
- NosyAPI (Nöbetçi eczane verileri için)

## Proje Yapısı

```
src/
  ├── controllers/         # İş mantığı kontrolörleri
  ├── middleware/          # Ara yazılım fonksiyonları
  ├── models/              # Mongoose modelleri
  ├── routes/              # API rotaları
  ├── __tests__/           # Test dosyaları
  └── index.js             # Uygulama giriş noktası
```

## Kurulum

1. Projeyi klonlayın:
```bash
git clone https://github.com/kullaniciadi/eczane-backend.git
cd eczane-backend
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Çevresel değişkenleri ayarlayın (.env dosyası oluşturun):
```bash
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
PORT=3000
NOSY_API_KEY=your_nosy_api_key  # Opsiyonel, varsayılan key de çalışır
```

4. Uygulamayı başlatın:
```bash
# Geliştirme modu
npm run dev

# Prodüksiyon modu
npm start
```

## API Endpoints

### Kimlik Doğrulama
- `POST /api/auth/register` - Yeni eczacı kaydı
- `POST /api/auth/login` - Eczacı girişi

### FDA İlaç Bilgileri
- `GET /api/fda/drugs` - İlaç bilgisi sorgulama
- `GET /api/fda/drugs/:drugId` - İlaç detayları görüntüleme
- `GET /api/fda/adverse-events` - İlaç yan etki raporları
- `GET /api/fda/drug-recalls` - İlaç geri çağırma bildirimleri

### Nöbetçi Eczane Bilgileri
- `GET /api/pharmacy/cities` - Tüm illeri listeleme
- `GET /api/pharmacy/list` - Nöbetçi eczaneleri listeleme (il/ilçe parametreleri opsiyonel)
- `GET /api/pharmacy/nearby` - Konuma göre en yakın nöbetçi eczaneleri bulma
- `GET /api/pharmacy/counts` - İl ve ilçelerdeki nöbetçi eczane sayılarını getirme
- `GET /api/pharmacy/all` - Tüm Türkiye ve KKTC'deki nöbetçi eczaneleri listeleme
- `GET /api/pharmacy/status` - Nöbetçi eczane verilerinin son güncellenme tarihini görüntüleme

## Geliştirme

```bash
# Testleri çalıştır
npm test
```

## Deployment

Bu proje Railway.app üzerinde çalışacak şekilde yapılandırılmıştır. Deployment için özel bir konfigürasyon gerekmemektedir.

## Lisans

MIT 