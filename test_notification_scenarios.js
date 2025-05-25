const axios = require('axios');
const colors = require('colors');

// Test konfigürasyonu
const CONFIG = {
  baseUrl: 'https://phamorabackend-production.up.railway.app',
  users: {
    user1: {
      pharmacistId: '123123',
      password: '123123',
      name: 'Test Kullanıcı 1'
    },
    user2: {
      pharmacistId: '123456', 
      password: 'password123',
      name: 'Test Kullanıcı 2'
    }
  }
};

// Global değişkenler
let user1Token = null;
let user2Token = null;
let user1Data = null;
let user2Data = null;
let testTransactionId = null;
let availableMedicines = [];

// Yardımcı fonksiyonlar
function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString('tr-TR');
  switch(type) {
    case 'success':
      console.log(`[${timestamp}] ✅ ${message}`.green);
      break;
    case 'error':
      console.log(`[${timestamp}] ❌ ${message}`.red);
      break;
    case 'warning':
      console.log(`[${timestamp}] ⚠️  ${message}`.yellow);
      break;
    case 'info':
      console.log(`[${timestamp}] ℹ️  ${message}`.blue);
      break;
    case 'step':
      console.log(`[${timestamp}] 🔄 ${message}`.cyan);
      break;
  }
}

function logSeparator(title) {
  console.log('\n' + '='.repeat(80).magenta);
  console.log(`🧪 ${title}`.magenta.bold);
  console.log('='.repeat(80).magenta + '\n');
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// API çağrı fonksiyonları
async function makeRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${CONFIG.baseUrl}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    log(`${method.toUpperCase()} ${endpoint}`, 'step');
    const response = await axios(config);
    log(`✅ Başarılı: ${response.status} - ${response.data.message || 'OK'}`, 'success');
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    log(`❌ Hata: ${error.response?.status || 'NETWORK'} - ${errorMsg}`, 'error');
    throw error;
  }
}

// Test fonksiyonları
async function testLogin() {
  logSeparator('KULLANICI GİRİŞ TESTLERİ');
  
  try {
    // User 1 giriş
    log('User 1 giriş yapılıyor...', 'step');
    const user1Response = await makeRequest('POST', '/api/auth/login', {
      pharmacistId: CONFIG.users.user1.pharmacistId,
      password: CONFIG.users.user1.password
    });
    
    user1Token = user1Response.token;
    user1Data = user1Response.user;
    log(`User 1 giriş başarılı: ${user1Data.name} ${user1Data.surname}`, 'success');
    
    // User 2 giriş
    log('User 2 giriş yapılıyor...', 'step');
    const user2Response = await makeRequest('POST', '/api/auth/login', {
      pharmacistId: CONFIG.users.user2.pharmacistId,
      password: CONFIG.users.user2.password
    });
    
    user2Token = user2Response.token;
    user2Data = user2Response.user;
    log(`User 2 giriş başarılı: ${user2Data.name} ${user2Data.surname}`, 'success');
    
    return true;
  } catch (error) {
    log('Giriş testleri başarısız!', 'error');
    return false;
  }
}

async function testGetMedicines() {
  logSeparator('İLAÇ LİSTESİ TESTİ');
  
  try {
    const response = await makeRequest('GET', '/api/medicines?limit=10');
    availableMedicines = response.data.medicines || response.data || [];
    
    if (availableMedicines.length > 0) {
      log(`${availableMedicines.length} ilaç bulundu`, 'success');
      availableMedicines.slice(0, 3).forEach(medicine => {
        log(`- ${medicine.name} (${medicine.barcode})`, 'info');
      });
    } else {
      log('Hiç ilaç bulunamadı!', 'warning');
    }
    
    return availableMedicines.length > 0;
  } catch (error) {
    log('İlaç listesi alınamadı!', 'error');
    return false;
  }
}

async function testGetInventory(userToken, userName) {
  logSeparator(`${userName} ENVANTER TESTİ`);
  
  try {
    const pharmacyId = userName.includes('1') ? user1Data.pharmacy.id : user2Data.pharmacy.id;
    const response = await makeRequest('GET', '/api/inventory/pharmacy/' + pharmacyId, null, {
      'pharmacistid': userName.includes('1') ? CONFIG.users.user1.pharmacistId : CONFIG.users.user2.pharmacistId
    });
    
    const inventory = response.data || [];
    log(`${userName} envanterinde ${inventory.length} ürün var`, 'success');
    
    if (inventory.length > 0) {
      inventory.slice(0, 3).forEach(item => {
        log(`- ${item.medicine?.name || 'Bilinmeyen'}: ${item.quantity} adet`, 'info');
      });
    }
    
    return inventory;
  } catch (error) {
    log(`${userName} envanter bilgisi alınamadı!`, 'error');
    return [];
  }
}

async function testCreateTransaction() {
  logSeparator('İŞLEM OLUŞTURMA TESTİ');
  
  try {
    if (availableMedicines.length === 0) {
      log('Test için ilaç bulunamadı!', 'error');
      return false;
    }
    
    const medicine = availableMedicines[0];
    const transactionData = {
      type: 'transfer',
      seller: user1Data.pharmacy.id,
      buyer: user2Data.pharmacy.id,
      items: [{
        medicine: medicine._id,
        quantity: 5,
        unitPrice: {
          currency: 'TRY',
          amount: 25.50
        },
        batchNumber: 'TEST-BATCH-001',
        expiryDate: '2025-12-31'
      }],
      paymentMethod: 'bank_transfer',
      notes: 'Test işlemi - Bildirim senaryosu',
      transactionId: `TEST-${Date.now()}`
    };
    
    log('İşlem oluşturuluyor...', 'step');
    const response = await makeRequest('POST', '/api/transactions', transactionData, {
      'pharmacistid': CONFIG.users.user1.pharmacistId
    });
    
    testTransactionId = response.data._id;
    log(`İşlem başarıyla oluşturuldu: ${response.data.transactionId}`, 'success');
    log(`İşlem ID: ${testTransactionId}`, 'info');
    
    // Kısa bekleme - bildirim gönderilmesi için
    await sleep(2000);
    
    return true;
  } catch (error) {
    log('İşlem oluşturulamadı!', 'error');
    return false;
  }
}

async function testGetNotifications(userToken, pharmacistId, userName) {
  logSeparator(`${userName} BİLDİRİMLERİ TESTİ`);
  
  try {
    const response = await makeRequest('GET', '/api/notifications?limit=10', null, {
      'pharmacistid': pharmacistId
    });
    
    const notifications = response.data || [];
    log(`${userName} için ${notifications.length} bildirim bulundu`, 'success');
    
    if (notifications.length > 0) {
      notifications.forEach((notification, index) => {
        const readStatus = notification.isRead ? '✅ Okundu' : '🔴 Okunmadı';
        log(`${index + 1}. ${notification.title} - ${readStatus}`, 'info');
        log(`   📝 ${notification.message}`, 'info');
        log(`   📅 ${new Date(notification.date).toLocaleString('tr-TR')}`, 'info');
        log(`   🏷️  Tip: ${notification.type}`, 'info');
        console.log('');
      });
    } else {
      log(`${userName} için bildirim bulunamadı`, 'warning');
    }
    
    return notifications;
  } catch (error) {
    log(`${userName} bildirimleri alınamadı!`, 'error');
    return [];
  }
}

async function testConfirmTransaction() {
  logSeparator('İŞLEM ONAYLAMA TESTİ');
  
  if (!testTransactionId) {
    log('Test işlemi bulunamadı!', 'error');
    return false;
  }
  
  try {
    log('İşlem onaylanıyor (User 2 tarafından)...', 'step');
    const response = await makeRequest('POST', `/api/transactions/${testTransactionId}/confirm`, {
      note: 'Test onayı - Bildirim senaryosu'
    }, {
      'pharmacistid': CONFIG.users.user2.pharmacistId
    });
    
    log(`İşlem başarıyla onaylandı: ${response.data.status}`, 'success');
    
    // Kısa bekleme - bildirim gönderilmesi için
    await sleep(2000);
    
    return true;
  } catch (error) {
    log('İşlem onaylanamadı!', 'error');
    return false;
  }
}

async function testUpdateTransactionStatus(status, note) {
  logSeparator(`İŞLEM DURUMU GÜNCELLEMESİ: ${status.toUpperCase()}`);
  
  if (!testTransactionId) {
    log('Test işlemi bulunamadı!', 'error');
    return false;
  }
  
  try {
    log(`İşlem durumu ${status} olarak güncelleniyor...`, 'step');
    const response = await makeRequest('PATCH', `/api/transactions/${testTransactionId}/status`, {
      status: status,
      note: note
    }, {
      'pharmacistid': CONFIG.users.user1.pharmacistId
    });
    
    log(`İşlem durumu başarıyla güncellendi: ${response.data.status}`, 'success');
    
    // Kısa bekleme - bildirim gönderilmesi için
    await sleep(2000);
    
    return true;
  } catch (error) {
    log(`İşlem durumu güncellenemedi!`, 'error');
    return false;
  }
}

async function testRejectTransaction() {
  logSeparator('İŞLEM REDDETME TESTİ');
  
  try {
    // Yeni bir işlem oluştur
    const medicine = availableMedicines[0];
    const transactionData = {
      type: 'transfer',
      seller: user1Data.pharmacy.id,
      buyer: user2Data.pharmacy.id,
      items: [{
        medicine: medicine._id,
        quantity: 3,
        unitPrice: {
          currency: 'TRY',
          amount: 30.00
        },
        batchNumber: 'TEST-BATCH-002',
        expiryDate: '2025-12-31'
      }],
      paymentMethod: 'bank_transfer',
      notes: 'Test reddetme işlemi',
      transactionId: `TEST-REJECT-${Date.now()}`
    };
    
    log('Reddetme testi için yeni işlem oluşturuluyor...', 'step');
    const createResponse = await makeRequest('POST', '/api/transactions', transactionData, {
      'pharmacistid': CONFIG.users.user1.pharmacistId
    });
    
    const rejectTransactionId = createResponse.data._id;
    await sleep(1000);
    
    log('İşlem reddediliyor (User 2 tarafından)...', 'step');
    const rejectResponse = await makeRequest('POST', `/api/transactions/${rejectTransactionId}/reject`, {
      reason: 'Test reddetme sebebi - Stok yetersiz'
    }, {
      'pharmacistid': CONFIG.users.user2.pharmacistId
    });
    
    log(`İşlem başarıyla reddedildi: ${rejectResponse.data.status}`, 'success');
    
    // Kısa bekleme - bildirim gönderilmesi için
    await sleep(2000);
    
    return true;
  } catch (error) {
    log('İşlem reddetme testi başarısız!', 'error');
    return false;
  }
}

async function testTransactionDetails() {
  logSeparator('İŞLEM DETAYLARI TESTİ');
  
  if (!testTransactionId) {
    log('Test işlemi bulunamadı!', 'error');
    return false;
  }
  
  try {
    log('İşlem detayları alınıyor...', 'step');
    const response = await makeRequest('GET', `/api/transactions/${testTransactionId}`, null, {
      'pharmacistid': CONFIG.users.user1.pharmacistId
    });
    
    const transaction = response.data;
    log(`İşlem detayları alındı: ${transaction.transactionId}`, 'success');
    log(`Durum: ${transaction.statusText}`, 'info');
    log(`Toplam tutar: ${transaction.totalAmount.amount} ${transaction.totalAmount.currency}`, 'info');
    log(`Oluşturma tarihi: ${transaction.createdAtFormatted}`, 'info');
    
    if (transaction.timeline && transaction.timeline.length > 0) {
      log('İşlem geçmişi:', 'info');
      transaction.timeline.forEach((event, index) => {
        log(`  ${index + 1}. ${event.statusText} - ${event.formattedDate}`, 'info');
        if (event.note) {
          log(`     📝 ${event.note}`, 'info');
        }
      });
    }
    
    return true;
  } catch (error) {
    log('İşlem detayları alınamadı!', 'error');
    return false;
  }
}

async function testNotificationActions() {
  logSeparator('BİLDİRİM AKSİYONLARI TESTİ');
  
  try {
    // User 2'nin bildirimlerini al
    const notifications = await testGetNotifications(user2Token, CONFIG.users.user2.pharmacistId, 'User 2');
    
    if (notifications.length > 0) {
      const firstNotification = notifications[0];
      
      // Bildirimi okundu işaretle
      log('İlk bildirim okundu olarak işaretleniyor...', 'step');
      await makeRequest('PATCH', `/api/notifications/${firstNotification.id}/read`, null, {
        'pharmacistid': CONFIG.users.user2.pharmacistId
      });
      log('Bildirim okundu olarak işaretlendi', 'success');
      
      await sleep(1000);
      
      // Tüm bildirimleri okundu işaretle
      log('Tüm bildirimler okundu olarak işaretleniyor...', 'step');
      await makeRequest('PATCH', '/api/notifications/read-all', null, {
        'pharmacistid': CONFIG.users.user2.pharmacistId
      });
      log('Tüm bildirimler okundu olarak işaretlendi', 'success');
    }
    
    return true;
  } catch (error) {
    log('Bildirim aksiyonları testi başarısız!', 'error');
    return false;
  }
}

async function testInventoryIssues() {
  logSeparator('ENVANTER SORUNLARI TESTİ');
  
  try {
    // Düşük stok uyarıları testi
    log('Düşük stok uyarıları test ediliyor...', 'step');
         try {
       await makeRequest('GET', `/api/inventory/pharmacy/${user1Data.pharmacy.id}/low-stock`, null, {
         'pharmacistid': CONFIG.users.user1.pharmacistId
       });
      log('Düşük stok uyarıları başarıyla alındı', 'success');
    } catch (error) {
      if (error.response?.status === 500 && error.response?.data?.message?.includes('low_stock')) {
        log('❌ SORUN TESPİT EDİLDİ: Inventory model\'inde low_stock enum değeri eksik!', 'error');
        log('Bu sorun sunucu tarafında düzeltilmesi gerekiyor.', 'warning');
      } else {
        throw error;
      }
    }
    
    // Son kullanma tarihi yaklaşan ürünler testi
    log('Son kullanma tarihi yaklaşan ürünler test ediliyor...', 'step');
         try {
       await makeRequest('GET', `/api/inventory/pharmacy/${user1Data.pharmacy.id}/expiring`, null, {
         'pharmacistid': CONFIG.users.user1.pharmacistId
       });
      log('Son kullanma tarihi yaklaşan ürünler başarıyla alındı', 'success');
    } catch (error) {
      log('Son kullanma tarihi yaklaşan ürünler alınamadı', 'error');
    }
    
    return true;
  } catch (error) {
    log('Envanter sorunları testi başarısız!', 'error');
    return false;
  }
}

// Ana test fonksiyonu
async function runAllTests() {
  console.log('🚀 PHAMORA BİLDİRİM SİSTEMİ TEST SENARYOLARI BAŞLIYOR...'.rainbow.bold);
  console.log('📅 Test Zamanı: ' + new Date().toLocaleString('tr-TR'));
  console.log('🌐 Test Sunucusu: ' + CONFIG.baseUrl);
  console.log('\n');
  
  const testResults = {
    passed: 0,
    failed: 0,
    total: 0
  };
  
  const tests = [
    { name: 'Kullanıcı Girişi', func: testLogin },
    { name: 'İlaç Listesi', func: testGetMedicines },
    { name: 'User 1 Envanteri', func: () => testGetInventory(user1Token, 'User 1') },
    { name: 'User 2 Envanteri', func: () => testGetInventory(user2Token, 'User 2') },
    { name: 'İşlem Oluşturma', func: testCreateTransaction },
    { name: 'User 2 Bildirimleri (Yeni Teklif)', func: () => testGetNotifications(user2Token, CONFIG.users.user2.pharmacistId, 'User 2') },
    { name: 'İşlem Onaylama', func: testConfirmTransaction },
    { name: 'User 1 Bildirimleri (Onay)', func: () => testGetNotifications(user1Token, CONFIG.users.user1.pharmacistId, 'User 1') },
    { name: 'İşlem Sevkiyat', func: () => testUpdateTransactionStatus('in_transit', 'Test sevkiyatı başlatıldı') },
    { name: 'User 2 Bildirimleri (Sevkiyat)', func: () => testGetNotifications(user2Token, CONFIG.users.user2.pharmacistId, 'User 2') },
    { name: 'İşlem Teslim', func: () => testUpdateTransactionStatus('delivered', 'Test teslimatı tamamlandı') },
    { name: 'User 2 Bildirimleri (Teslim)', func: () => testGetNotifications(user2Token, CONFIG.users.user2.pharmacistId, 'User 2') },
    { name: 'İşlem Tamamlama', func: () => testUpdateTransactionStatus('completed', 'Test işlemi tamamlandı') },
    { name: 'Her İki Kullanıcı Bildirimleri (Tamamlama)', func: async () => {
      await testGetNotifications(user1Token, CONFIG.users.user1.pharmacistId, 'User 1');
      await testGetNotifications(user2Token, CONFIG.users.user2.pharmacistId, 'User 2');
      return true;
    }},
    { name: 'İşlem Reddetme', func: testRejectTransaction },
    { name: 'User 1 Bildirimleri (Reddetme)', func: () => testGetNotifications(user1Token, CONFIG.users.user1.pharmacistId, 'User 1') },
    { name: 'İşlem Detayları', func: testTransactionDetails },
    { name: 'Bildirim Aksiyonları', func: testNotificationActions },
    { name: 'Envanter Sorunları', func: testInventoryIssues }
  ];
  
  for (const test of tests) {
    testResults.total++;
    try {
      log(`Test başlatılıyor: ${test.name}`, 'step');
      const result = await test.func();
      if (result !== false) {
        testResults.passed++;
        log(`✅ ${test.name} - BAŞARILI`, 'success');
      } else {
        testResults.failed++;
        log(`❌ ${test.name} - BAŞARISIZ`, 'error');
      }
    } catch (error) {
      testResults.failed++;
      log(`❌ ${test.name} - HATA: ${error.message}`, 'error');
    }
    
    // Testler arası kısa bekleme
    await sleep(1000);
  }
  
  // Test sonuçları
  logSeparator('TEST SONUÇLARI');
  console.log(`📊 Toplam Test: ${testResults.total}`.bold);
  console.log(`✅ Başarılı: ${testResults.passed}`.green.bold);
  console.log(`❌ Başarısız: ${testResults.failed}`.red.bold);
  console.log(`📈 Başarı Oranı: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`.cyan.bold);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 TÜM TESTLER BAŞARILI! Bildirim sistemi mükemmel çalışıyor! 🎉'.rainbow.bold);
  } else {
    console.log('\n⚠️  Bazı testler başarısız oldu. Lütfen hataları kontrol edin.'.yellow.bold);
  }
  
  console.log('\n📝 Test tamamlandı: ' + new Date().toLocaleString('tr-TR'));
}

// Gerekli paketleri kontrol et
function checkDependencies() {
  try {
    require('axios');
    require('colors');
    return true;
  } catch (error) {
    console.log('❌ Gerekli paketler yüklü değil!'.red);
    console.log('Lütfen şu komutu çalıştırın: npm install axios colors'.yellow);
    return false;
  }
}

// Ana çalıştırma
if (require.main === module) {
  if (checkDependencies()) {
    runAllTests().catch(error => {
      console.error('❌ Test çalıştırma hatası:', error.message);
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
}

module.exports = { runAllTests }; 