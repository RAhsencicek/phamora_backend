const axios = require('axios');
const colors = require('colors');

// Test konfigürasyonu
const CONFIG = {
  baseUrl: 'http://localhost:3000/api',
  users: {
    seller: {
      pharmacistId: '123123',
      password: '123123'
    },
    buyer: {
      pharmacistId: '123456', 
      password: 'password123'
    }
  }
};

// Test sonuçları
let testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// Utility fonksiyonlar
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`.cyan),
  success: (msg) => console.log(`✅ ${msg}`.green),
  error: (msg) => console.log(`❌ ${msg}`.red),
  warning: (msg) => console.log(`⚠️  ${msg}`.yellow),
  step: (msg) => console.log(`\n🔄 ${msg}`.blue.bold),
  result: (msg) => console.log(`📊 ${msg}`.magenta)
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// API çağrı fonksiyonu
async function apiCall(method, endpoint, data = null, headers = {}) {
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
    
    log.info(`${method.toUpperCase()} ${endpoint}`);
    if (data) {
      console.log('📤 Request Data:', JSON.stringify(data, null, 2));
    }
    
    const response = await axios(config);
    
    log.success(`Response: ${response.status} ${response.statusText}`);
    console.log('📥 Response Data:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    log.error(`API Error: ${error.response?.status} ${error.response?.statusText}`);
    if (error.response?.data) {
      console.log('📥 Error Data:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

// Test fonksiyonları
async function testLogin(pharmacistId, password) {
  log.step(`Kullanıcı girişi test ediliyor: ${pharmacistId}`);
  
  try {
    const response = await apiCall('POST', '/auth/login', {
      pharmacistId,
      password
    });
    
         if (response.user && response.token) {
       log.success(`Giriş başarılı: ${response.user.name} ${response.user.surname || ''}`);
       testResults.passed++;
       return response.user;
     } else {
       throw new Error('Giriş başarısız');
     }
  } catch (error) {
    log.error(`Giriş hatası: ${error.message}`);
    testResults.failed++;
    testResults.errors.push(`Login failed for ${pharmacistId}: ${error.message}`);
    throw error;
  }
}

async function testGetNotifications(pharmacistId) {
  log.step(`Bildirimler getiriliyor: ${pharmacistId}`);
  
  try {
    const response = await apiCall('GET', '/notifications?page=1&limit=10', null, {
      pharmacistid: pharmacistId
    });
    
    if (response.success) {
      log.success(`${response.data.length} bildirim bulundu`);
      log.result(`Okunmamış bildirim sayısı: ${response.pagination.unreadCount}`);
      
      response.data.forEach((notification, index) => {
        console.log(`📬 Bildirim ${index + 1}:`.yellow);
        console.log(`   Başlık: ${notification.title}`);
        console.log(`   Mesaj: ${notification.message}`);
        console.log(`   Tür: ${notification.type}`);
        console.log(`   Okundu: ${notification.isRead ? 'Evet' : 'Hayır'}`);
        console.log(`   Tarih: ${new Date(notification.date).toLocaleString('tr-TR')}`);
      });
      
      testResults.passed++;
      return response.data;
    } else {
      throw new Error('Bildirimler getirilemedi');
    }
  } catch (error) {
    log.error(`Bildirim getirme hatası: ${error.message}`);
    testResults.failed++;
    testResults.errors.push(`Get notifications failed for ${pharmacistId}: ${error.message}`);
    return [];
  }
}

async function testGetPharmacies() {
  log.step('Eczaneler getiriliyor');
  
  try {
    const response = await apiCall('GET', '/pharmacies/all', null, {
      pharmacistid: CONFIG.users.seller.pharmacistId
    });
    
         if (response && Array.isArray(response) && response.length > 0) {
       log.success(`${response.length} eczane bulundu`);
       
       response.forEach((pharmacy, index) => {
        console.log(`🏥 Eczane ${index + 1}:`.green);
        console.log(`   ID: ${pharmacy._id}`);
        console.log(`   Ad: ${pharmacy.name}`);
        console.log(`   Sahip: ${pharmacy.owner?.name} ${pharmacy.owner?.surname}`);
        console.log(`   Envanter: ${pharmacy.availableMedications?.length || 0} ilaç`);
             });
       
       testResults.passed++;
       return response;
     } else {
       throw new Error('Eczane bulunamadı');
    }
  } catch (error) {
    log.error(`Eczane getirme hatası: ${error.message}`);
    testResults.failed++;
    testResults.errors.push(`Get pharmacies failed: ${error.message}`);
    return [];
  }
}

async function testGetMedicines() {
  log.step('İlaçlar getiriliyor');
  
  try {
    const response = await apiCall('GET', '/medicines?page=1&limit=10');
    
         if (response.success && response.data && response.data.length > 0) {
       log.success(`${response.data.length} ilaç bulundu`);
       
       response.data.forEach((medicine, index) => {
        console.log(`💊 İlaç ${index + 1}:`.green);
        console.log(`   ID: ${medicine._id}`);
        console.log(`   Ad: ${medicine.name}`);
        console.log(`   Üretici: ${medicine.manufacturer}`);
        console.log(`   Fiyat: ${medicine.price?.amount} ${medicine.price?.currency}`);
      });
      
      testResults.passed++;
      return response.data;
    } else {
      throw new Error('İlaç bulunamadı');
    }
  } catch (error) {
    log.error(`İlaç getirme hatası: ${error.message}`);
    testResults.failed++;
    testResults.errors.push(`Get medicines failed: ${error.message}`);
    return [];
  }
}

async function testCreateTransaction(sellerPharmacyId, buyerPharmacyId, medicine) {
  log.step('Yeni işlem oluşturuluyor');
  
  const transactionData = {
    type: 'transfer',
    seller: sellerPharmacyId,
    buyer: buyerPharmacyId,
    items: [{
      medicine: medicine._id,
      quantity: 5,
      unitPrice: {
        currency: 'TRY',
        amount: medicine.price?.amount || 25.00
      },
      batchNumber: `TEST-${Date.now()}`,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    }],
    paymentMethod: 'bank_transfer',
    notes: 'Test işlemi - Bildirim senaryosu testi',
    transactionId: `TEST-TXN-${Date.now()}`
  };
  
  try {
    const response = await apiCall('POST', '/transactions', transactionData, {
      pharmacistid: CONFIG.users.seller.pharmacistId
    });
    
    if (response.success && response.data) {
      log.success(`İşlem oluşturuldu: ${response.data.transactionId}`);
      log.result(`İşlem ID: ${response.data._id}`);
      log.result(`Durum: ${response.data.status}`);
      
      testResults.passed++;
      return response.data;
    } else {
      throw new Error('İşlem oluşturulamadı');
    }
  } catch (error) {
    log.error(`İşlem oluşturma hatası: ${error.message}`);
    testResults.failed++;
    testResults.errors.push(`Create transaction failed: ${error.message}`);
    throw error;
  }
}

async function testConfirmTransaction(transactionId) {
  log.step(`İşlem onaylanıyor: ${transactionId}`);
  
  try {
    const response = await apiCall('POST', `/transactions/${transactionId}/confirm`, {
      note: 'Test onayı - Bildirim senaryosu testi'
    }, {
      pharmacistid: CONFIG.users.buyer.pharmacistId
    });
    
    if (response.success && response.data) {
      log.success(`İşlem onaylandı: ${response.data.transactionId}`);
      log.result(`Yeni durum: ${response.data.status}`);
      
      testResults.passed++;
      return response.data;
    } else {
      throw new Error('İşlem onaylanamadı');
    }
  } catch (error) {
    log.error(`İşlem onaylama hatası: ${error.message}`);
    testResults.failed++;
    testResults.errors.push(`Confirm transaction failed: ${error.message}`);
    throw error;
  }
}

async function testRejectTransaction(transactionId) {
  log.step(`İşlem reddediliyor: ${transactionId}`);
  
  try {
    const response = await apiCall('POST', `/transactions/${transactionId}/reject`, {
      reason: 'Test reddi - Bildirim senaryosu testi'
    }, {
      pharmacistid: CONFIG.users.buyer.pharmacistId
    });
    
    if (response.success && response.data) {
      log.success(`İşlem reddedildi: ${response.data.transactionId}`);
      log.result(`Yeni durum: ${response.data.status}`);
      
      testResults.passed++;
      return response.data;
    } else {
      throw new Error('İşlem reddedilemedi');
    }
  } catch (error) {
    log.error(`İşlem reddetme hatası: ${error.message}`);
    testResults.failed++;
    testResults.errors.push(`Reject transaction failed: ${error.message}`);
    throw error;
  }
}

async function testUpdateTransactionStatus(transactionId, status, note) {
  log.step(`İşlem durumu güncelleniyor: ${transactionId} -> ${status}`);
  
  try {
    const response = await apiCall('PATCH', `/transactions/${transactionId}/status`, {
      status,
      note: note || `Test durumu: ${status}`
    }, {
      pharmacistid: CONFIG.users.seller.pharmacistId
    });
    
    if (response.success && response.data) {
      log.success(`İşlem durumu güncellendi: ${response.data.status}`);
      
      testResults.passed++;
      return response.data;
    } else {
      throw new Error('İşlem durumu güncellenemedi');
    }
  } catch (error) {
    log.error(`İşlem durumu güncelleme hatası: ${error.message}`);
    testResults.failed++;
    testResults.errors.push(`Update transaction status failed: ${error.message}`);
    throw error;
  }
}

async function testGetTransactions(pharmacistId) {
  log.step(`İşlemler getiriliyor: ${pharmacistId}`);
  
  try {
    const response = await apiCall('GET', '/transactions?page=1&limit=10', null, {
      pharmacistid: pharmacistId
    });
    
    if (response.success) {
      log.success(`${response.data.length} işlem bulundu`);
      
      response.data.forEach((transaction, index) => {
        console.log(`🔄 İşlem ${index + 1}:`.blue);
        console.log(`   ID: ${transaction.transactionId}`);
        console.log(`   Durum: ${transaction.statusText}`);
        console.log(`   Yön: ${transaction.direction}`);
        console.log(`   Karşı taraf: ${transaction.counterparty.pharmacyName}`);
        console.log(`   Toplam: ${transaction.totalAmount.amount} ${transaction.totalAmount.currency}`);
      });
      
      testResults.passed++;
      return response.data;
    } else {
      throw new Error('İşlemler getirilemedi');
    }
  } catch (error) {
    log.error(`İşlem getirme hatası: ${error.message}`);
    testResults.failed++;
    testResults.errors.push(`Get transactions failed for ${pharmacistId}: ${error.message}`);
    return [];
  }
}

// Ana test senaryosu
async function runNotificationTests() {
  console.log('🚀 Bildirim Senaryoları Test Süreci Başlatılıyor'.rainbow.bold);
  console.log('='.repeat(60).gray);
  
  try {
    // 1. Kullanıcı girişleri
    log.step('1. KULLANICI GİRİŞLERİ');
    const sellerUser = await testLogin(CONFIG.users.seller.pharmacistId, CONFIG.users.seller.password);
    await sleep(1000);
    const buyerUser = await testLogin(CONFIG.users.buyer.pharmacistId, CONFIG.users.buyer.password);
    
    // 2. Başlangıç bildirimlerini kontrol et
    log.step('2. BAŞLANGIÇ BİLDİRİMLERİ');
    await testGetNotifications(CONFIG.users.seller.pharmacistId);
    await sleep(1000);
    await testGetNotifications(CONFIG.users.buyer.pharmacistId);
    
    // 3. Eczaneleri getir
    log.step('3. ECZANE BİLGİLERİ');
    const pharmacies = await testGetPharmacies();
    
    if (pharmacies.length < 2) {
      throw new Error('En az 2 eczane gerekli');
    }
    
         // Eczane sahiplerini pharmacistId ile eşleştir
     let sellerPharmacy = null;
     let buyerPharmacy = null;
     
     for (const pharmacy of pharmacies) {
       if (pharmacy.owner && pharmacy.owner.pharmacistId === CONFIG.users.seller.pharmacistId) {
         sellerPharmacy = pharmacy;
       }
       if (pharmacy.owner && pharmacy.owner.pharmacistId === CONFIG.users.buyer.pharmacistId) {
         buyerPharmacy = pharmacy;
       }
     }
    
    if (!sellerPharmacy || !buyerPharmacy) {
      throw new Error('Kullanıcıların eczaneleri bulunamadı');
    }
    
    log.success(`Satıcı eczane: ${sellerPharmacy.name} (${sellerPharmacy._id})`);
    log.success(`Alıcı eczane: ${buyerPharmacy.name} (${buyerPharmacy._id})`);
    
    // 4. İlaçları getir
    log.step('4. İLAÇ BİLGİLERİ');
    const medicines = await testGetMedicines();
    
    if (medicines.length === 0) {
      throw new Error('Test için ilaç bulunamadı');
    }
    
    const testMedicine = medicines[0];
    log.success(`Test ilacı: ${testMedicine.name} (${testMedicine._id})`);
    
    // 5. SENARYO 1: İşlem oluşturma ve pending bildirimi
    log.step('5. SENARYO 1: İŞLEM OLUŞTURMA (PENDING BİLDİRİMİ)');
    const transaction1 = await testCreateTransaction(sellerPharmacy._id, buyerPharmacy._id, testMedicine);
    await sleep(2000);
    
    // Alıcının bildirimlerini kontrol et
    log.info('Alıcının yeni bildirimlerini kontrol ediliyor...');
    await testGetNotifications(CONFIG.users.buyer.pharmacistId);
    
    // 6. SENARYO 2: İşlem onaylama ve confirmed bildirimi
    log.step('6. SENARYO 2: İŞLEM ONAYLAMA (CONFIRMED BİLDİRİMİ)');
    await testConfirmTransaction(transaction1._id);
    await sleep(2000);
    
    // Satıcının bildirimlerini kontrol et
    log.info('Satıcının yeni bildirimlerini kontrol ediliyor...');
    await testGetNotifications(CONFIG.users.seller.pharmacistId);
    
    // 7. SENARYO 3: İşlem durumu güncellemeleri
    log.step('7. SENARYO 3: İŞLEM DURUMU GÜNCELLEMELERİ');
    
    // in_transit durumu
    await testUpdateTransactionStatus(transaction1._id, 'in_transit', 'Kargo ile gönderildi');
    await sleep(2000);
    await testGetNotifications(CONFIG.users.buyer.pharmacistId);
    
    // delivered durumu
    await testUpdateTransactionStatus(transaction1._id, 'delivered', 'Eczaneye teslim edildi');
    await sleep(2000);
    await testGetNotifications(CONFIG.users.buyer.pharmacistId);
    
    // completed durumu
    await testUpdateTransactionStatus(transaction1._id, 'completed', 'İşlem tamamlandı');
    await sleep(2000);
    await testGetNotifications(CONFIG.users.seller.pharmacistId);
    await testGetNotifications(CONFIG.users.buyer.pharmacistId);
    
    // 8. SENARYO 4: İşlem reddetme senaryosu
    log.step('8. SENARYO 4: İŞLEM REDDETME (CANCELLED BİLDİRİMİ)');
    const transaction2 = await testCreateTransaction(sellerPharmacy._id, buyerPharmacy._id, testMedicine);
    await sleep(2000);
    
    await testRejectTransaction(transaction2._id);
    await sleep(2000);
    
    // Satıcının bildirimlerini kontrol et
    log.info('Satıcının red bildirimi kontrol ediliyor...');
    await testGetNotifications(CONFIG.users.seller.pharmacistId);
    
    // 9. İşlem listelerini kontrol et
    log.step('9. İŞLEM LİSTELERİ KONTROLÜ');
    await testGetTransactions(CONFIG.users.seller.pharmacistId);
    await sleep(1000);
    await testGetTransactions(CONFIG.users.buyer.pharmacistId);
    
    // 10. Son bildirim durumları
    log.step('10. SON BİLDİRİM DURUMLARI');
    log.info('Satıcının final bildirimleri:');
    await testGetNotifications(CONFIG.users.seller.pharmacistId);
    
    log.info('Alıcının final bildirimleri:');
    await testGetNotifications(CONFIG.users.buyer.pharmacistId);
    
  } catch (error) {
    log.error(`Test süreci hatası: ${error.message}`);
    testResults.failed++;
    testResults.errors.push(`Main test process failed: ${error.message}`);
  }
}

// Test sonuçlarını göster
function showTestResults() {
  console.log('\n' + '='.repeat(60).gray);
  console.log('📊 TEST SONUÇLARI'.rainbow.bold);
  console.log('='.repeat(60).gray);
  
  log.result(`Toplam Başarılı Test: ${testResults.passed}`);
  log.result(`Toplam Başarısız Test: ${testResults.failed}`);
  log.result(`Başarı Oranı: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(2)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ HATALAR:'.red.bold);
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`.red);
    });
  }
  
  if (testResults.failed === 0) {
    console.log('\n🎉 TÜM TESTLER BAŞARILI!'.green.bold);
  } else {
    console.log('\n⚠️  BAZI TESTLER BAŞARISIZ OLDU!'.yellow.bold);
  }
  
  console.log('='.repeat(60).gray);
}

// Ana fonksiyon
async function main() {
  console.log('🧪 Phamora Backend - Bildirim Senaryoları Test Süreci'.rainbow.bold);
  console.log(`📅 Test Zamanı: ${new Date().toLocaleString('tr-TR')}`);
  console.log(`🌐 Base URL: ${CONFIG.baseUrl}`);
  console.log(`👥 Test Kullanıcıları: ${CONFIG.users.seller.pharmacistId} & ${CONFIG.users.buyer.pharmacistId}`);
  console.log('='.repeat(60).gray);
  
  try {
    await runNotificationTests();
  } catch (error) {
    log.error(`Ana test hatası: ${error.message}`);
  } finally {
    showTestResults();
  }
}

// Programı çalıştır
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  runNotificationTests,
  testResults,
  CONFIG
}; 