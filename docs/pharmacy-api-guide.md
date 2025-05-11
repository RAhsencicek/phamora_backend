# Nöbetçi Eczane API Kullanım Kılavuzu

Bu doküman, Eczane Yönetim Sistemi'ndeki Nöbetçi Eczane API'sinin nasıl kullanılacağını açıklamaktadır.

## Genel Bilgiler

- Tüm API istekleri için base URL: `https://phamorabackend-production.up.railway.app/api/pharmacy`
- API, NosyAPI servisini kullanarak Türkiye ve KKTC'deki nöbetçi eczane verilerini sunar
- Tüm endpointler kimlik doğrulama olmadan da kullanılabilir (opsiyonel auth)
- Varsayılan olarak uygulama, dahili API anahtarını kullanır

## Endpointler

### 1. İlleri Listeleme

Türkiye'deki tüm illeri listeler.

**Endpoint:** `GET /cities`

**Örnek İstek:**
```bash
curl -X GET https://phamorabackend-production.up.railway.app/api/pharmacy/cities
```

**Örnek Yanıt:**
```json
{
  "status": "success",
  "message": "ok",
  "messageTR": "ok",
  "systemTime": 1705868163,
  "endpoint": "pharmacies-on-duty/cities",
  "rowCount": 82,
  "creditUsed": 82,
  "data": [
    {
      "cities": "Adana",
      "slug": "adana"
    },
    {
      "cities": "Adıyaman",
      "slug": "adiyaman"
    },
    // ... diğer iller
  ]
}
```

### 2. Nöbetçi Eczaneleri Listeleme

Belirli bir il veya ilçedeki nöbetçi eczaneleri listeler.

**Endpoint:** `GET /list`

**Parametreler:**
- `city` (Opsiyonel): İl adı (örn. "İstanbul")
- `district` (Opsiyonel): İlçe adı (örn. "Kadıköy")

**Örnek İstek:**
```bash
curl -X GET "https://phamorabackend-production.up.railway.app/api/pharmacy/list?city=İstanbul&district=Kadıköy"
```

**Örnek İstek (JavaScript - Fetch API):**
```javascript
const response = await fetch('https://phamorabackend-production.up.railway.app/api/pharmacy/list?city=İstanbul&district=Kadıköy');
const data = await response.json();
console.log(data);
```

**Örnek Yanıt:**
```json
{
  "status": "success",
  "message": "ok",
  "messageTR": "ok",
  "systemTime": 1705870028,
  "endpoint": "pharmacies-on-duty",
  "rowCount": 3,
  "creditUsed": 1,
  "data": [
    {
      "pharmacyID": 12345,
      "pharmacyName": "Merkez Eczanesi",
      "address": "Caferağa Mah., Moda Cad. No:15/A Kadıköy/ İstanbul",
      "city": "İstanbul",
      "district": "Kadıköy",
      "town": null,
      "directions": "Moda İlkokulu karşısı",
      "phone": "0(216)123-45-67",
      "phone2": null,
      "pharmacyDutyStart": "2024-01-21 09:00:00",
      "pharmacyDutyEnd": "2024-01-22 09:00:00",
      "latitude": 40.9881,
      "longitude": 29.0271
    }
    // ... diğer eczaneler
  ]
}
```

### 3. En Yakın Nöbetçi Eczaneleri Bulma

Belirtilen konuma en yakın 20 nöbetçi eczaneyi listeler.

**Endpoint:** `GET /nearby`

**Parametreler:**
- `latitude` (Zorunlu): Enlem değeri (örn. 41.0082)
- `longitude` (Zorunlu): Boylam değeri (örn. 28.9784)

**Örnek İstek:**
```bash
curl -X GET "https://phamorabackend-production.up.railway.app/api/pharmacy/nearby?latitude=41.0082&longitude=28.9784"
```

**Örnek İstek (React Native - Mevcut Konumla):**
```javascript
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

const NearbyPharmaciesScreen = () => {
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        alert('Konum izni gerekli!');
        return;
      }
      
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      try {
        const response = await fetch(
          `https://phamorabackend-production.up.railway.app/api/pharmacy/nearby?latitude=${latitude}&longitude=${longitude}`
        );
        const result = await response.json();
        
        if (result.status === 'success') {
          setPharmacies(result.data);
        }
      } catch (error) {
        console.error('Hata:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Geri kalan komponent kodu...
};
```

**Örnek Yanıt:**
```json
{
  "status": "success",
  "message": "ok",
  "messageTR": "ok",
  "systemTime": 1705870138,
  "endpoint": "pharmacies-on-duty/locations",
  "rowCount": 20,
  "creditUsed": 1,
  "data": [
    {
      "pharmacyID": 15171,
      "pharmacyName": "Berrin Eczanesi",
      "address": "1456 Sokak No:98/A Alsancak Konak / İzmir",
      "city": "İzmir",
      "district": "Konak",
      "town": "Alsancak",
      "directions": "",
      "phone": "0(232)463-40-86",
      "phone2": "",
      "pharmacyDutyStart": "2024-01-21 09:00:00",
      "pharmacyDutyEnd": "2024-01-22 09:00:00",
      "latitude": 38.435937,
      "longitude": 27.144759,
      "distanceMt": 391,
      "distanceKm": 0.391,
      "distanceMil": 0.243
    }
    // ... diğer eczaneler
  ]
}
```

### 4. İl ve İlçe Bazında Eczane Sayılarını Getirme

Her ildeki nöbetçi eczane sayılarını listeler.

**Endpoint:** `GET /counts`

**Örnek İstek:**
```bash
curl -X GET https://phamorabackend-production.up.railway.app/api/pharmacy/counts
```

**Örnek Yanıt:**
```json
{
  "status": "success",
  "message": "ok",
  "messageTR": "ok",
  "systemTime": 1722722087,
  "endpoint": "pharmacies-on-duty/count-cities",
  "rowCount": 82,
  "creditUsed": 1,
  "data": [
    {
      "cities": "Adana",
      "slug": "adana",
      "dutyPharmacyCount": 36
    },
    {
      "cities": "Adıyaman",
      "slug": "adiyaman",
      "dutyPharmacyCount": 6
    }
    // ... diğer iller
  ]
}
```

### 5. Tüm Nöbetçi Eczaneleri Getirme

Türkiye ve KKTC'deki tüm nöbetçi eczaneleri tek bir istekte getirir.

**Not:** Bu endpoint büyük veri döndürür ve API kredisi kullanımı yüksektir.

**Endpoint:** `GET /all`

**Örnek İstek:**
```bash
curl -X GET https://phamorabackend-production.up.railway.app/api/pharmacy/all
```

**Örnek Yanıt:**
```json
{
  "status": "success",
  "message": "ok",
  "messageTR": "ok",
  "systemTime": 1705870080,
  "endpoint": "pharmacies-on-duty/all",
  "rowCount": 1281,
  "creditUsed": 81,
  "data": [
    {
      "pharmacyID": 15,
      "pharmacyName": "Hürriyet Eczanesi",
      "address": "Hürriyet Sağlık Ocağı karşısı Ceyhan / Adana",
      "city": "Adana",
      "district": "Ceyhan",
      "town": "",
      "directions": "",
      "phone": "0(322)613-18-01",
      "phone2": "",
      "pharmacyDutyStart": "2024-01-21 08:00:00",
      "pharmacyDutyEnd": "2024-01-22 08:00:00",
      "latitude": 37.035023,
      "longitude": 35.821181
    }
    // ... diğer eczaneler
  ]
}
```

### 6. Veritabanı Güncelleme Durumunu Kontrol Etme

Nöbetçi eczane verilerinin en son güncellendiği tarihi gösterir.

**Endpoint:** `GET /status`

**Örnek İstek:**
```bash
curl -X GET https://phamorabackend-production.up.railway.app/api/pharmacy/status
```

**Örnek Yanıt:**
```json
{
  "status": "success",
  "message": "ok",
  "messageTR": "ok",
  "systemTime": 1714429601,
  "endpoint": "pharmacies-on-duty/status",
  "rowCount": 1,
  "creditUsed": 0,
  "data": {
    "lastupdated": "2024-04-30 10:00:00"
  }
}
```

## Hata Durumları

API, aşağıdaki durumlarda hata yanıtları döndürebilir:

- **400 Bad Request:** Gerekli parametreler eksik
- **500 Internal Server Error:** Sunucu veya harici API hatası

Hata yanıtı örneği:
```json
{
  "success": false,
  "message": "Enlem ve boylam değerleri gereklidir"
}
```

## API Kullanımı İçin Tavsiyeler

1. **Önbellek (Cache) Kullanımı:** Nöbetçi eczane verileri günde bir kez güncellenir. Ön belleğe alma stratejisi uygulayarak gereksiz API çağrılarından kaçının.

2. **Bölgesel İstek Kullanımı:** `/all` endpoint'i yerine mümkün olduğunca `/list` endpoint'ini il ve ilçe parametreleriyle kullanın.

3. **Coğrafi Optimizasyon:** Yakın eczaneleri bulmak için önce kullanıcının konumuna en yakın eczaneyi bulmak üzere `/nearby` endpoint'ini kullanın.

4. **Hata İşleme:** İstek hatalarını düzgün şekilde yakalayın ve kullanıcılara anlamlı geri bildirim sağlayın.

## Geliştirici Notları

Bu API, [NosyAPI](https://www.nosyapi.com/)'nin nöbetçi eczane servisini kullanmaktadır. API anahtarı, uygulama yapılandırmasında veya çevresel değişkenlerde tanımlanmalıdır:

```javascript
// .env dosyasında
NOSY_API_KEY=XAkQiDBCyrf4bBmd90RDsswsLS1X0j6IJkyGoYyQ5x4qf9BsNvKuLNiLrJ5A
```

Özel API anahtarınız yoksa, sistem varsayılan API anahtarını kullanacaktır. 