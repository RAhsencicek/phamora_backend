const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function simpleTest() {
  try {
    // 1. Alıcı giriş yap
    console.log('🔐 Alıcı giriş yapıyor...');
    const buyerLogin = await axios.post(`${API_BASE_URL}/auth/login`, {
      pharmacistId: '123123',
      password: '123123'
    });
    
    console.log('✅ Alıcı giriş başarılı');
    console.log('Alıcı Eczane ID:', buyerLogin.data.user.pharmacy.id);
    
    // 2. Satıcı giriş yap
    console.log('\n🔐 Satıcı giriş yapıyor...');
    const sellerLogin = await axios.post(`${API_BASE_URL}/auth/login`, {
      pharmacistId: '123456',
      password: 'password123'
    });
    
    console.log('✅ Satıcı giriş başarılı');
    console.log('Satıcı Eczane ID:', sellerLogin.data.user.pharmacy.id);
    
    // 3. Satıcının stoklarını kontrol et
    console.log('\n📦 Satıcının stoklarını kontrol ediliyor...');
    const sellerInventory = await axios.get(`${API_BASE_URL}/inventory/pharmacy/${sellerLogin.data.user.pharmacy.id}`, {
      headers: {
        'Authorization': `Bearer ${sellerLogin.data.token}`,
        'pharmacistid': '123456'
      }
    });
    
    console.log(`Satıcı stoğu: ${sellerInventory.data.data.length} farklı ilaç`);
    
    // Xanax'ı bul
    const xanax = sellerInventory.data.data.find(item => item.medicine.name === 'Xanax');
    if (!xanax) {
      console.log('❌ Xanax bulunamadı');
      return;
    }
    
    console.log(`Xanax bulundu: ${xanax.availableQuantity} adet, ${xanax.unitPrice.amount} TL`);
    console.log(`İlaç ID: ${xanax.medicine._id}`);
    
    // 4. Transaction oluştur
    console.log('\n💰 Transaction oluşturuluyor...');
    
    const transactionData = {
      seller: sellerLogin.data.user.pharmacy.id,
      buyer: buyerLogin.data.user.pharmacy.id,
      type: 'purchase',
      items: [
        {
          medicine: xanax.medicine._id,
          quantity: 3,
          unitPrice: {
            currency: 'TRY',
            amount: xanax.unitPrice.amount
          }
        }
      ],
      paymentMethod: 'bank_transfer',
      notes: 'Test transaction'
    };
    
    console.log('Transaction Data:', JSON.stringify(transactionData, null, 2));
    
    const transactionResponse = await axios.post(`${API_BASE_URL}/transactions`, transactionData, {
      headers: {
        'Authorization': `Bearer ${buyerLogin.data.token}`,
        'pharmacistid': '123123',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Transaction başarıyla oluşturuldu!');
    console.log('Transaction ID:', transactionResponse.data.data._id);
    console.log('Transaction Status:', transactionResponse.data.data.status);
    
  } catch (error) {
    console.error('❌ Hata:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

simpleTest(); 