const axios = require('axios');

async function quickTest() {
  try {
    console.log('🔍 User 1 giriş testi...');
    const user1Response = await axios.post('https://phamorabackend-production.up.railway.app/api/auth/login', {
      pharmacistId: '123123',
      password: '123123'
    });
    
    console.log('✅ User 1 giriş başarılı');
    console.log('📋 User 1 Data:', JSON.stringify(user1Response.data.user, null, 2));
    
    console.log('\n🔍 User 2 giriş testi...');
    const user2Response = await axios.post('https://phamorabackend-production.up.railway.app/api/auth/login', {
      pharmacistId: '123456',
      password: 'password123'
    });
    
    console.log('✅ User 2 giriş başarılı');
    console.log('📋 User 2 Data:', JSON.stringify(user2Response.data.user, null, 2));
    
    // Eczane ID'lerini kontrol et
    const user1PharmacyId = user1Response.data.user.pharmacy?._id;
    const user2PharmacyId = user2Response.data.user.pharmacy?._id;
    
    console.log('\n🏥 Eczane ID Kontrolü:');
    console.log('User 1 Pharmacy ID:', user1PharmacyId || 'UNDEFINED!');
    console.log('User 2 Pharmacy ID:', user2PharmacyId || 'UNDEFINED!');
    
    if (user1PharmacyId) {
      console.log('\n🔍 User 1 envanter testi...');
      try {
        const inventoryResponse = await axios.get(`https://phamorabackend-production.up.railway.app/api/inventory/pharmacy/${user1PharmacyId}`, {
          headers: { 'pharmacistid': '123123' }
        });
        console.log('✅ User 1 envanter başarılı:', inventoryResponse.data.length, 'ürün');
      } catch (error) {
        console.log('❌ User 1 envanter hatası:', error.response?.data?.message || error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test hatası:', error.response?.data?.message || error.message);
  }
}

quickTest(); 