# 📬 Phamora Bildirim Sistemi - Postman Test Rehberi

## 🎯 Genel Bakış

Bu rehber, Phamora eczane yönetim sisteminin bildirim özelliklerini Postman ile nasıl test edeceğinizi adım adım gösterir. Sistem, eczaneler arası işlemlerde gerçek zamanlı bildirimler gönderir.

## 🔧 Ön Hazırlık

### 1. Test Kullanıcıları
```
Satıcı Eczane:
- pharmacistId: 123123
- password: 123123

Alıcı Eczane:
- pharmacistId: 123456
- password: password123
```

### 2. Postman Ortam Değişkenleri
```
baseUrl: http://localhost:3000/api
```

## 📋 Test Senaryoları

### 🔐 ADIM 1: Kullanıcı Girişleri

#### 1.1 Satıcı Eczane Girişi
```http
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "pharmacistId": "123123",
  "password": "123123"
}
```

#### 1.2 Alıcı Eczane Girişi
```http
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "pharmacistId": "123456",
  "password": "password123"
}
```

### 📬 ADIM 2: Başlangıç Bildirimlerini Kontrol Et

#### 2.1 Satıcının Bildirimlerini Getir
```http
GET {{baseUrl}}/notifications?page=1&limit=10
pharmacistid: 123123
```

#### 2.2 Alıcının Bildirimlerini Getir
```http
GET {{baseUrl}}/notifications?page=1&limit=10
pharmacistid: 123456
```

**Beklenen Sonuç:** Her iki kullanıcının mevcut bildirimlerini görürsünüz.

### 🏥 ADIM 3: Eczane ve İlaç Bilgilerini Al

#### 3.1 Eczaneleri Listele
```http
GET {{baseUrl}}/pharmacies/all
pharmacistid: 123123
```

#### 3.2 İlaçları Listele
```http
GET {{baseUrl}}/medicines?page=1&limit=10
```

**Not:** Yanıtlardan eczane ID'lerini ve ilaç ID'lerini not alın.

### 🔄 ADIM 4: İşlem Oluştur (Pending Bildirimi)

#### 4.1 Yeni İşlem Oluştur
```http
POST {{baseUrl}}/transactions
pharmacistid: 123123
Content-Type: application/json

{
  "type": "transfer",
  "seller": "SATICI_ECZANE_ID",
  "buyer": "ALICI_ECZANE_ID",
  "items": [{
    "medicine": "ILAC_ID",
    "quantity": 5,
    "unitPrice": {
      "currency": "TRY",
      "amount": 25.00
    },
    "batchNumber": "TEST-BATCH-001",
    "expiryDate": "2025-12-31T00:00:00.000Z"
  }],
  "paymentMethod": "bank_transfer",
  "notes": "Test işlemi - Bildirim testi",
  "transactionId": "TEST-TXN-001"
}
```

#### 4.2 Alıcının Yeni Bildirimlerini Kontrol Et
```http
GET {{baseUrl}}/notifications?isRead=false
pharmacistid: 123456
```

**Beklenen Sonuç:** Alıcı eczane yeni bir "offer" türünde bildirim almalı.

### ✅ ADIM 5: İşlem Onaylama (Confirmed Bildirimi)

#### 5.1 İşlemi Onayla
```http
POST {{baseUrl}}/transactions/TRANSACTION_ID/confirm
pharmacistid: 123456
Content-Type: application/json

{
  "note": "İşlem onaylandı - Test"
}
```

#### 5.2 Satıcının Yeni Bildirimlerini Kontrol Et
```http
GET {{baseUrl}}/notifications?isRead=false
pharmacistid: 123123
```

**Beklenen Sonuç:** Satıcı eczane "transaction" türünde onay bildirimi almalı.

### 🚚 ADIM 6: İşlem Durumu Güncellemeleri

#### 6.1 Sevkiyat Durumu
```http
PATCH {{baseUrl}}/transactions/TRANSACTION_ID/status
pharmacistid: 123123
Content-Type: application/json

{
  "status": "in_transit",
  "note": "Kargo ile gönderildi"
}
```

#### 6.2 Alıcının Bildirimlerini Kontrol Et
```http
GET {{baseUrl}}/notifications?type=transaction
pharmacistid: 123456
```

#### 6.3 Teslimat Durumu
```http
PATCH {{baseUrl}}/transactions/TRANSACTION_ID/status
pharmacistid: 123123
Content-Type: application/json

{
  "status": "delivered",
  "note": "Eczaneye teslim edildi"
}
```

#### 6.4 Tamamlanma Durumu
```http
PATCH {{baseUrl}}/transactions/TRANSACTION_ID/status
pharmacistid: 123123
Content-Type: application/json

{
  "status": "completed",
  "note": "İşlem tamamlandı"
}
```

### ❌ ADIM 7: İşlem Reddetme Senaryosu

#### 7.1 Yeni İşlem Oluştur
```http
POST {{baseUrl}}/transactions
pharmacistid: 123123
Content-Type: application/json

{
  "type": "transfer",
  "seller": "SATICI_ECZANE_ID",
  "buyer": "ALICI_ECZANE_ID",
  "items": [{
    "medicine": "ILAC_ID",
    "quantity": 3,
    "unitPrice": {
      "currency": "TRY",
      "amount": 30.00
    },
    "batchNumber": "TEST-BATCH-002",
    "expiryDate": "2025-12-31T00:00:00.000Z"
  }],
  "paymentMethod": "bank_transfer",
  "notes": "Test reddetme senaryosu",
  "transactionId": "TEST-TXN-002"
}
```

#### 7.2 İşlemi Reddet
```http
POST {{baseUrl}}/transactions/TRANSACTION_ID/reject
pharmacistid: 123456
Content-Type: application/json

{
  "reason": "Stok yetersiz - Test reddi"
}
```

#### 7.3 Satıcının Red Bildirimini Kontrol Et
```http
GET {{baseUrl}}/notifications?type=transaction
pharmacistid: 123123
```

**Beklenen Sonuç:** Satıcı eczane red bildirimi almalı.

## 🔍 Bildirim Yönetimi Testleri

### 📊 Bildirim İstatistikleri
```http
GET {{baseUrl}}/notifications/stats
pharmacistid: 123123
```

### 👁️ Bildirimi Okundu İşaretle
```http
PATCH {{baseUrl}}/notifications/NOTIFICATION_ID/read
pharmacistid: 123123
```

### 📚 Tüm Bildirimleri Okundu İşaretle
```http
PATCH {{baseUrl}}/notifications/read-all
pharmacistid: 123123
```

### 🗑️ Bildirim Sil
```http
DELETE {{baseUrl}}/notifications/NOTIFICATION_ID
pharmacistid: 123123
```

### 🗑️ Çoklu Bildirim Sil
```http
DELETE {{baseUrl}}/notifications
pharmacistid: 123123
Content-Type: application/json

{
  "notificationIds": [
    "NOTIFICATION_ID_1",
    "NOTIFICATION_ID_2"
  ]
}
```

## 🎯 Filtreleme Örnekleri

### Sadece Okunmamış Bildirimler
```http
GET {{baseUrl}}/notifications?isRead=false&limit=50
pharmacistid: 123123
```

### Sadece İşlem Bildirimleri
```http
GET {{baseUrl}}/notifications?type=offer&type=transaction&type=purchase
pharmacistid: 123123
```

### Son 24 Saatin Bildirimleri
```http
GET {{baseUrl}}/notifications?page=1&limit=20&sort=date&order=desc
pharmacistid: 123123
```

## 📋 Bildirim Türleri ve Anlamları

| Tür | Açıklama | Ne Zaman Oluşur |
|-----|----------|-----------------|
| `offer` | Yeni işlem teklifi | Başka eczane size ilaç satmak istediğinde |
| `purchase` | Satın alma bildirimi | İşlem onaylandığında |
| `transaction` | İşlem durumu güncellemesi | İşlem durumu değiştiğinde |
| `expiry` | Son kullanma tarihi uyarısı | İlaçlar expire olmaya yaklaştığında |
| `system` | Sistem bildirimi | Sistem güncellemeleri için |

## 📊 Bildirim Data Formatı

### Offer Bildirimi (Yeni Teklif)
```json
{
  "id": "notification_id",
  "title": "Yeni İşlem Teklifi",
  "message": "HARPUT ECZANESİ eczanesinden Aspirin (5 adet) için yeni bir teklif aldınız.",
  "type": "offer",
  "isRead": false,
  "date": "2025-05-26T03:57:11.123Z",
  "data": {
    "transactionId": "transaction_id",
    "medicineNames": "Aspirin",
    "totalItems": 5,
    "totalAmount": {
      "currency": "TRY",
      "amount": 125.00
    },
    "sellerPharmacy": "HARPUT ECZANESİ"
  }
}
```

### Transaction Bildirimi (İşlem Onaylandı)
```json
{
  "id": "notification_id",
  "title": "İşlem Onaylandı",
  "message": "Merkez Eczanesi Aspirin (3 adet) için teklifinizi onayladı.",
  "type": "transaction",
  "isRead": false,
  "date": "2025-05-26T03:58:22.456Z",
  "data": {
    "transactionId": "transaction_id",
    "medicineNames": "Aspirin",
    "totalItems": 3,
    "totalAmount": {
      "currency": "TRY",
      "amount": 75.00
    },
    "buyerPharmacy": "Merkez Eczanesi"
  }
}
```

## 🔄 Bildirim Akışı

```
1. İşlem Oluşturma
   ↓
2. Alıcıya "offer" bildirimi gönderilir
   ↓
3. Alıcı onaylar/reddeder
   ↓
4. Satıcıya "transaction" bildirimi gönderilir
   ↓
5. Durum güncellemeleri
   ↓
6. Her güncelleme için bildirim gönderilir
```

## ⚠️ Önemli Notlar

1. **pharmacistid Header'ı:** Her istekte mutlaka doğru pharmacistid header'ını kullanın
2. **ID'leri Kopyalama:** Gerçek ID'leri yanıtlardan kopyalayıp yapıştırın
3. **Sıralı Test:** Testleri sırayla yapın, çünkü her adım bir öncekine bağlı
4. **Bildirim Kontrolü:** Her işlemden sonra bildirimleri kontrol edin
5. **Zaman Aralığı:** İşlemler arasında 1-2 saniye bekleyin

## 🎉 Başarı Kriterleri

✅ Her işlem sonrası ilgili taraflara bildirim gitmeli
✅ Bildirimler doğru türde olmalı (offer, transaction, vb.)
✅ Bildirim içerikleri anlamlı olmalı
✅ Okundu/silinme işlemleri çalışmalı
✅ Filtreleme seçenekleri doğru çalışmalı

## 🐛 Hata Durumları

- **401 Unauthorized:** pharmacistid header'ı eksik veya yanlış
- **404 Not Found:** İşlem veya bildirim bulunamadı
- **400 Bad Request:** Geçersiz veri formatı
- **403 Forbidden:** Yetki hatası (başkasının işlemini değiştirmeye çalışma)

Bu rehberi takip ederek Phamora bildirim sisteminin tüm özelliklerini test edebilirsiniz! 🚀 