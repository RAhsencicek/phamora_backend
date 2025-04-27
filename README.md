# Eczane Yönetim Sistemi API

Bu proje, eczaneler için geliştirilmiş bir yönetim sistemi API'sidir.

## Özellikler

- Eczacı kaydı ve girişi
- JWT tabanlı kimlik doğrulama
- MongoDB veritabanı entegrasyonu
- Konum bazlı sorgulama desteği

## Teknolojiler

- Node.js
- Express.js
- MongoDB
- JWT
- Express Validator

## Kurulum

1. Projeyi klonlayın:
```bash
git clone [repo-url]
cd [repo-name]
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Çevresel değişkenleri ayarlayın:
```bash
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
PORT=3000
```

4. Uygulamayı başlatın:
```bash
# Geliştirme modu
npm run dev

# Prodüksiyon modu
npm start
```

## API Endpoints

### Auth Routes
- `POST /api/auth/register` - Yeni eczacı kaydı
- `POST /api/auth/login` - Eczacı girişi

## Test

```bash
npm test
```

## Deployment

Bu proje Railway.app üzerinde çalışacak şekilde yapılandırılmıştır. Deployment için özel bir konfigürasyon gerekmemektedir.

## Lisans

MIT 