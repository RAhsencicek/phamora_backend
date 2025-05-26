const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// Test kullanıcı bilgileri
const SELLER = {
  pharmacistId: '123456',
  password: 'password123'
};

const BUYER = {
  pharmacistId: '123123',
  password: '123123'
};

let sellerToken = '';
let buyerToken = '';
let sellerPharmacyId = '';
let buyerPharmacyId = '';
let transactionId = '';

// Yardımcı fonksiyonlar
async function login(pharmacistId, password) {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      pharmacistId,
      password
    });
    
    if (response.data.token) {
      console.log(`✅ ${pharmacistId} başarıyla giriş yaptı`);
      return {
        token: response.data.token,
        pharmacyId: response.data.user.pharmacy.id
      };
    } else {
      throw new Error('Token alınamadı');
    }
  } catch (error) {
    console.error(`❌ ${pharmacistId} giriş hatası:`, error.response?.data?.message || error.message);
    return null;
  }
}

async function getNotifications(token, pharmacistId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/notifications`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'pharmacistid': pharmacistId
      }
    });
    
    return response.data.data || [];
  } catch (error) {
    console.error(`❌ ${pharmacistId} bildirim alma hatası:`, error.response?.data?.message || error.message);
    return [];
  }
}

async function createTransaction(token, pharmacistId, transactionData) {
  try {
    const response = await axios.post(`${API_BASE_URL}/transactions`, transactionData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'pharmacistid': pharmacistId,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`❌ İşlem oluşturma hatası:`, error.response?.data?.message || error.message);
    return null;
  }
}

async function updateTransactionStatus(token, pharmacistId, transactionId, status, note) {
  try {
    const response = await axios.patch(`${API_BASE_URL}/transactions/${transactionId}/status`, {
      status,
      note
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'pharmacistid': pharmacistId,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`❌ İşlem durumu güncelleme hatası:`, error.response?.data?.message || error.message);
    return null;
  }
}

async function getInventory(token, pharmacistId, pharmacyId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/inventory/pharmacy/${pharmacyId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'pharmacistid': pharmacistId
      }
    });
    
    return response.data.data || [];
  } catch (error) {
    console.error(`❌ Stok bilgisi alma hatası:`, error.response?.data?.message || error.message);
    return [];
  }
}

// Ana test fonksiyonu
async function runTransactionTest() {
  console.log('🚀 Eczaneler Arası Satış İşlemi Testi Başlıyor...\n');
  
  // 1. Kullanıcı girişleri
  console.log('📝 1. ADIM: Kullanıcı Girişleri');
  console.log('================================');
  
  const sellerAuth = await login(SELLER.pharmacistId, SELLER.password);
  if (!sellerAuth) {
    console.log('❌ Satıcı girişi başarısız, test sonlandırılıyor');
    return;
  }
  sellerToken = sellerAuth.token;
  sellerPharmacyId = sellerAuth.pharmacyId;
  
  const buyerAuth = await login(BUYER.pharmacistId, BUYER.password);
  if (!buyerAuth) {
    console.log('❌ Alıcı girişi başarısız, test sonlandırılıyor');
    return;
  }
  buyerToken = buyerAuth.token;
  buyerPharmacyId = buyerAuth.pharmacyId;
  
  console.log('✅ Her iki kullanıcı da başarıyla giriş yaptı\n');
  
  // 2. Başlangıç stok durumunu kontrol et
  console.log('📦 2. ADIM: Başlangıç Stok Durumu');
  console.log('==================================');
  
  const sellerInventory = await getInventory(sellerToken, SELLER.pharmacistId, sellerPharmacyId);
  const buyerInventory = await getInventory(buyerToken, BUYER.pharmacistId, buyerPharmacyId);
  
  console.log(`Satıcı stoğu: ${sellerInventory.length} farklı ilaç`);
  console.log(`Alıcı stoğu: ${buyerInventory.length} farklı ilaç`);
  
  // Xanax'ı bul
  const xanaxInSeller = sellerInventory.find(item => item.medicine.name === 'Xanax');
  const xanaxInBuyer = buyerInventory.find(item => item.medicine.name === 'Xanax');
  
  if (!xanaxInSeller || xanaxInSeller.availableQuantity < 5) {
    console.log('❌ Satıcıda yeterli Xanax stoğu yok, test sonlandırılıyor');
    return;
  }
  
  console.log(`Satıcıda Xanax: ${xanaxInSeller.availableQuantity} adet (${xanaxInSeller.unitPrice.amount} TL)`);
  console.log(`Alıcıda Xanax: ${xanaxInBuyer ? xanaxInBuyer.availableQuantity : 0} adet\n`);
  
  // 3. Başlangıç bildirim durumunu kontrol et
  console.log('🔔 3. ADIM: Başlangıç Bildirim Durumu');
  console.log('=====================================');
  
  const sellerNotificationsBefore = await getNotifications(sellerToken, SELLER.pharmacistId);
  const buyerNotificationsBefore = await getNotifications(buyerToken, BUYER.pharmacistId);
  
  console.log(`Satıcının bildirimleri: ${sellerNotificationsBefore.length} adet`);
  console.log(`Alıcının bildirimleri: ${buyerNotificationsBefore.length} adet\n`);
  
  // 4. Alıcı satın alma talebi oluştur
  console.log('💰 4. ADIM: Satın Alma Talebi Oluşturma');
  console.log('========================================');
  
  const transactionData = {
    seller: sellerPharmacyId,
    buyer: buyerPharmacyId,
    type: 'purchase',
    items: [
      {
        medicine: xanaxInSeller.medicine._id,
        quantity: 5,
        unitPrice: {
          currency: 'TRY',
          amount: xanaxInSeller.unitPrice.amount
        }
      }
    ],
    paymentMethod: 'bank_transfer',
    notes: 'Test için Xanax satın alma talebi'
  };
  
  console.log('Satın alma talebi gönderiliyor...');
  const transactionResult = await createTransaction(buyerToken, BUYER.pharmacistId, transactionData);
  
  if (!transactionResult || !transactionResult.success) {
    console.log('❌ İşlem oluşturulamadı, test sonlandırılıyor');
    return;
  }
  
  transactionId = transactionResult.data._id;
  console.log(`✅ İşlem başarıyla oluşturuldu: ${transactionResult.data.transactionId}`);
  console.log(`   İşlem ID: ${transactionId}`);
  console.log(`   Durum: ${transactionResult.data.status}`);
  console.log(`   Toplam Tutar: ${transactionResult.data.totalAmount.amount} TL\n`);
  
  // 5. Satıcının bildirimlerini kontrol et
  console.log('🔔 5. ADIM: Satıcının Bildirimlerini Kontrol');
  console.log('=============================================');
  
  // Biraz bekle ki bildirim oluşsun
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const sellerNotificationsAfter = await getNotifications(sellerToken, SELLER.pharmacistId);
  const newSellerNotifications = sellerNotificationsAfter.filter(notif => 
    !sellerNotificationsBefore.some(oldNotif => oldNotif.id === notif.id)
  );
  
  console.log(`Satıcının yeni bildirimleri: ${newSellerNotifications.length} adet`);
  
  if (newSellerNotifications.length > 0) {
    console.log('✅ Satıcıya yeni bildirim geldi:');
    newSellerNotifications.forEach(notif => {
      console.log(`   - ${notif.title}: ${notif.message}`);
      console.log(`   - Tip: ${notif.type}, Okundu: ${notif.isRead}`);
    });
  } else {
    console.log('❌ Satıcıya bildirim gelmedi!');
  }
  
  console.log('');
  
  // 6. Alıcının bildirimlerini kontrol et (hata varsa)
  console.log('🔔 6. ADIM: Alıcının Bildirimlerini Kontrol');
  console.log('===========================================');
  
  const buyerNotificationsAfter = await getNotifications(buyerToken, BUYER.pharmacistId);
  const newBuyerNotifications = buyerNotificationsAfter.filter(notif => 
    !buyerNotificationsBefore.some(oldNotif => oldNotif.id === notif.id)
  );
  
  console.log(`Alıcının yeni bildirimleri: ${newBuyerNotifications.length} adet`);
  
  if (newBuyerNotifications.length > 0) {
    console.log('⚠️ Alıcıya da bildirim geldi (bu hatalı olabilir):');
    newBuyerNotifications.forEach(notif => {
      console.log(`   - ${notif.title}: ${notif.message}`);
      console.log(`   - Tip: ${notif.type}, Okundu: ${notif.isRead}`);
    });
  } else {
    console.log('✅ Alıcıya bildirim gelmedi (doğru davranış)');
  }
  
  console.log('');
  
  // 7. Satıcı işlemi onaylar
  console.log('✅ 7. ADIM: Satıcı İşlemi Onaylıyor');
  console.log('===================================');
  
  console.log('Satıcı işlemi onaylıyor...');
  const confirmResult = await updateTransactionStatus(
    sellerToken, 
    SELLER.pharmacistId, 
    transactionId, 
    'confirmed',
    'Satıcı tarafından onaylandı'
  );
  
  if (!confirmResult || !confirmResult.success) {
    console.log('❌ İşlem onaylanamadı');
    return;
  }
  
  console.log(`✅ İşlem başarıyla onaylandı`);
  console.log(`   Yeni Durum: ${confirmResult.data.status}\n`);
  
  // 8. Alıcının bildirimlerini tekrar kontrol et
  console.log('🔔 8. ADIM: Onay Sonrası Alıcının Bildirimleri');
  console.log('===============================================');
  
  // Biraz bekle ki bildirim oluşsun
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const buyerNotificationsFinal = await getNotifications(buyerToken, BUYER.pharmacistId);
  const finalNewBuyerNotifications = buyerNotificationsFinal.filter(notif => 
    !buyerNotificationsAfter.some(oldNotif => oldNotif.id === notif.id)
  );
  
  console.log(`Alıcının onay sonrası yeni bildirimleri: ${finalNewBuyerNotifications.length} adet`);
  
  if (finalNewBuyerNotifications.length > 0) {
    console.log('✅ Alıcıya onay bildirimi geldi:');
    finalNewBuyerNotifications.forEach(notif => {
      console.log(`   - ${notif.title}: ${notif.message}`);
      console.log(`   - Tip: ${notif.type}, Okundu: ${notif.isRead}`);
    });
  } else {
    console.log('❌ Alıcıya onay bildirimi gelmedi!');
  }
  
  console.log('');
  
  // 9. Final stok durumunu kontrol et
  console.log('📦 9. ADIM: Final Stok Durumu');
  console.log('==============================');
  
  const sellerInventoryFinal = await getInventory(sellerToken, SELLER.pharmacistId, sellerPharmacyId);
  const buyerInventoryFinal = await getInventory(buyerToken, BUYER.pharmacistId, buyerPharmacyId);
  
  const xanaxInSellerFinal = sellerInventoryFinal.find(item => item.medicine.name === 'Xanax');
  const xanaxInBuyerFinal = buyerInventoryFinal.find(item => item.medicine.name === 'Xanax');
  
  console.log(`Satıcıda Xanax (final): ${xanaxInSellerFinal ? xanaxInSellerFinal.availableQuantity : 0} adet`);
  console.log(`Alıcıda Xanax (final): ${xanaxInBuyerFinal ? xanaxInBuyerFinal.availableQuantity : 0} adet`);
  
  // Rezervasyon kontrolü
  if (xanaxInSellerFinal && xanaxInSellerFinal.reservedQuantity > 0) {
    console.log(`✅ Satıcıda ${xanaxInSellerFinal.reservedQuantity} adet rezerve edildi`);
  }
  
  console.log('\n🎉 TEST TAMAMLANDI!');
  console.log('===================');
  console.log('Test sonuçları:');
  console.log(`- İşlem oluşturuldu: ✅`);
  console.log(`- Satıcıya bildirim gitti: ${newSellerNotifications.length > 0 ? '✅' : '❌'}`);
  console.log(`- Alıcıya yanlış bildirim gitti: ${newBuyerNotifications.length > 0 ? '❌' : '✅'}`);
  console.log(`- Satıcı onayladı: ✅`);
  console.log(`- Alıcıya onay bildirimi gitti: ${finalNewBuyerNotifications.length > 0 ? '✅' : '❌'}`);
  console.log(`- Stok rezerve edildi: ${xanaxInSellerFinal && xanaxInSellerFinal.reservedQuantity > 0 ? '✅' : '❌'}`);
}

// Test'i çalıştır
runTransactionTest().catch(error => {
  console.error('❌ Test hatası:', error.message);
}); 