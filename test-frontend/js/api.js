// API Servisleri
const ApiService = {
    // Kullanıcı girişi
    login: async function(pharmacistId, password) {
        try {
            const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.login}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    pharmacistId: pharmacistId,
                    password: password
                })
            });
            
            if (!response.ok) {
                throw new Error('Giriş başarısız');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Giriş hatası:', error);
            throw error;
        }
    },
    
    // Tüm kullanıcıları getir
    getAllUsers: async function(pharmacistId) {
        try {
            const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.users}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'pharmacistid': pharmacistId
                }
            });
            
            if (!response.ok) {
                throw new Error('Kullanıcılar getirilemedi');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Kullanıcıları getirme hatası:', error);
            throw error;
        }
    },
    
    // Tüm eczaneleri getir
    getAllPharmacies: async function(pharmacistId) {
        try {
            const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.pharmacies}/all`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'pharmacistid': pharmacistId
                }
            });
            
            if (!response.ok) {
                throw new Error('Eczaneler getirilemedi');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Eczaneleri getirme hatası:', error);
            throw error;
        }
    }
}; 