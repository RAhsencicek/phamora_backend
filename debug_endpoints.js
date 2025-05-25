const axios = require('axios');

async function debugEndpoints() {
  try {
    // Giriş yap
    console.log('🔐 Giriş yapılıyor...');
    const loginResponse = await axios.post('https://phamorabackend-production.up.railway.app/api/auth/login', {
      pharmacistId: '123456',
      password: 'password123'
    });
    
    console.log('✅ Giriş başarılı');
    
    // İlaç listesini al
    console.log('\n💊 İlaç listesi alınıyor...');
    const medicinesResponse = await axios.get('https://phamorabackend-production.up.railway.app/api/medicines?limit=5');
    const medicines = medicinesResponse.data.data.medicines || medicinesResponse.data.data || [];
    
    if (medicines.length === 0) {
      console.log('❌ İlaç bulunamadı!');
      return;
    }
    
    const medicine = medicines[0];
    console.log('✅ İlaç bulundu:', medicine.name, medicine._id);
    
    // İşlem oluştur
    console.log('\n📝 Test işlemi oluşturuluyor...');
    const transactionResponse = await axios.post('https://phamorabackend-production.up.railway.app/api/transactions', {
      type: 'transfer',
      seller: '683253ac937a416bd272ab67',
      buyer: '68324ddc937a416bd272ab06',
      items: [{
        medicine: medicine._id,
        quantity: 2,
        unitPrice: { currency: 'TRY', amount: 20.00 },
        batchNumber: 'DEBUG-001',
        expiryDate: '2025-12-31'
      }],
      paymentMethod: 'bank_transfer',
      notes: 'Debug test işlemi',
      transactionId: `DEBUG-${Date.now()}`
    }, {
      headers: { 'pharmacistid': '123123' }
    });
    
    const transactionId = transactionResponse.data.data._id;
    console.log('✅ İşlem oluşturuldu:', transactionId);
    
    // Confirm endpoint'ini test et
    console.log('\n🔍 Confirm endpoint test ediliyor...');
    try {
      const confirmResponse = await axios.post(`https://phamorabackend-production.up.railway.app/api/transactions/${transactionId}/confirm`, {
        note: 'Debug onay testi'
      }, {
        headers: { 'pharmacistid': '123456' }
      });
      console.log('✅ Confirm endpoint çalışıyor:', confirmResponse.status);
    } catch (error) {
      console.log('❌ Confirm endpoint hatası:', error.response?.status, error.response?.data?.message || error.message);
      
      // Endpoint'in var olup olmadığını kontrol et
      try {
        const optionsResponse = await axios.options(`https://phamorabackend-production.up.railway.app/api/transactions/${transactionId}/confirm`);
        console.log('🔍 OPTIONS response:', optionsResponse.status);
      } catch (optError) {
        console.log('❌ OPTIONS da çalışmıyor:', optError.response?.status);
      }
    }
    
    // Reject endpoint'ini test et
    console.log('\n🔍 Reject endpoint test ediliyor...');
    try {
      const rejectResponse = await axios.post(`https://phamorabackend-production.up.railway.app/api/transactions/${transactionId}/reject`, {
        reason: 'Debug red testi'
      }, {
        headers: { 'pharmacistid': '123456' }
      });
      console.log('✅ Reject endpoint çalışıyor:', rejectResponse.status);
    } catch (error) {
      console.log('❌ Reject endpoint hatası:', error.response?.status, error.response?.data?.message || error.message);
    }
    
    // Mevcut endpoint'leri listele
    console.log('\n🔍 Mevcut transaction endpoint\'leri test ediliyor...');
    
    // GET /api/transactions (liste)
    try {
      const listResponse = await axios.get('https://phamorabackend-production.up.railway.app/api/transactions', {
        headers: { 'pharmacistid': '123123' }
      });
      console.log('✅ GET /api/transactions çalışıyor');
    } catch (error) {
      console.log('❌ GET /api/transactions hatası:', error.response?.status);
    }
    
    // GET /api/transactions/:id (detay)
    try {
      const detailResponse = await axios.get(`https://phamorabackend-production.up.railway.app/api/transactions/${transactionId}`, {
        headers: { 'pharmacistid': '123123' }
      });
      console.log('✅ GET /api/transactions/:id çalışıyor');
    } catch (error) {
      console.log('❌ GET /api/transactions/:id hatası:', error.response?.status);
    }
    
    // PATCH /api/transactions/:id/status
    try {
      const statusResponse = await axios.patch(`https://phamorabackend-production.up.railway.app/api/transactions/${transactionId}/status`, {
        status: 'in_transit',
        note: 'Debug status update'
      }, {
        headers: { 'pharmacistid': '123123' }
      });
      console.log('✅ PATCH /api/transactions/:id/status çalışıyor');
    } catch (error) {
      console.log('❌ PATCH /api/transactions/:id/status hatası:', error.response?.status);
    }
    
  } catch (error) {
    console.error('❌ Debug hatası:', error.response?.data?.message || error.message);
  }
}

debugEndpoints(); 