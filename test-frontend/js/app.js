document.addEventListener('DOMContentLoaded', function() {
    // DOM elemanları
    const loginContainer = document.getElementById('login-container');
    const mapContainer = document.getElementById('map-container');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const pharmacistIdInput = document.getElementById('pharmacistId');
    const passwordInput = document.getElementById('password');
    const loginError = document.getElementById('login-error');
    
    // Harita değişkenleri
    let map = null;
    let currentUser = null;
    let pharmacyMarkers = [];
    
    // Giriş butonuna tıklandığında
    loginBtn.addEventListener('click', async function() {
        const pharmacistId = pharmacistIdInput.value.trim();
        const password = passwordInput.value.trim();
        
        if (!pharmacistId || !password) {
            loginError.textContent = 'Eczacı ID ve şifre gereklidir';
            return;
        }
        
        try {
            loginError.textContent = 'Giriş yapılıyor...';
            
            // API'den giriş yap
            const userData = await ApiService.login(pharmacistId, password);
            currentUser = userData;
            
            // Kullanıcı bilgisi sessionStorage'a kaydet
            sessionStorage.setItem('currentUser', JSON.stringify(userData));
            sessionStorage.setItem('pharmacistId', pharmacistId);
            
            // Giriş ekranını gizle, harita ekranını göster
            loginContainer.classList.add('hidden');
            mapContainer.classList.remove('hidden');
            
            // Haritayı başlat
            initMap();
            
            // Eczane verilerini yükle
            loadPharmacyData(pharmacistId);
            
        } catch (error) {
            loginError.textContent = 'Giriş başarısız. Lütfen kimlik bilgilerinizi kontrol edin.';
            console.error('Giriş hatası:', error);
        }
    });
    
    // Çıkış butonuna tıklandığında
    logoutBtn.addEventListener('click', function() {
        // Session temizle
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('pharmacistId');
        
        // Harita temizle
        if (map) {
            map.remove();
            map = null;
        }
        
        // Harita ekranını gizle, giriş ekranını göster
        mapContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
        
        // Hata mesajlarını temizle
        loginError.textContent = '';
    });
    
    // Haritayı başlat
    function initMap() {
        if (map) {
            map.remove();
        }
        
        // Elazığ merkezinde bir nokta (varsayılan başlangıç noktası)
        const elazig = [38.6741, 39.2237]; // [latitude, longitude]
        
        // Harita oluştur
        map = L.map('map').setView(elazig, 13);
        
        // OpenStreetMap arka planı ekle
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        // Eğer kullanıcının konum bilgisi varsa haritayı oraya merkezle
        if (currentUser && currentUser.location && currentUser.location.coordinates) {
            const userCoords = currentUser.location.coordinates;
            // MongoDB'de koordinatlar [longitude, latitude] olarak saklanır
            // Leaflet [latitude, longitude] bekler
            map.setView([userCoords[1], userCoords[0]], 13);
            
            // Kullanıcının konumuna marker ekle
            const userMarker = L.marker([userCoords[1], userCoords[0]], {
                icon: L.divIcon({
                    className: 'user-marker',
                    html: '<div class="marker-icon current-user"></div>',
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                })
            }).addTo(map);
            
            userMarker.bindPopup(`<b>${currentUser.name} ${currentUser.surname}</b><br>Şu anki konumunuz`).openPopup();
        }
    }
    
    // Eczane verilerini yükle
    async function loadPharmacyData(pharmacistId) {
        try {
            // Daha önce eklenen markerları temizle
            clearMarkers();
            
            // Kullanıcıları ve eczaneleri yükle
            const users = await ApiService.getAllUsers(pharmacistId);
            const pharmacies = await ApiService.getAllPharmacies(pharmacistId);
            
            // Kullanıcılar ve eczaneler arasında ilişki kur
            if (users && users.length && pharmacies && pharmacies.length) {
                displayPharmacies(users, pharmacies);
            } else {
                console.error('Kullanıcı veya eczane verisi bulunamadı');
            }
        } catch (error) {
            console.error('Veri yükleme hatası:', error);
        }
    }
    
    // Eczaneleri haritada göster
    function displayPharmacies(users, pharmacies) {
        users.forEach(user => {
            // Kullanıcının eczanesini bul
            const userPharmacy = pharmacies.find(pharmacy => 
                pharmacy._id === (user.pharmacy ? user.pharmacy.toString() : '')
            );
            
            if (user.location && user.location.coordinates && userPharmacy) {
                // MongoDB'de koordinatlar [longitude, latitude] olarak saklanır
                // Leaflet [latitude, longitude] bekler
                const coords = [user.location.coordinates[1], user.location.coordinates[0]];
                
                // Mevcut kullanıcı ise farklı bir simge kullan
                const isCurrentUser = user._id === currentUser._id;
                
                // Marker oluştur
                const marker = L.marker(coords, {
                    icon: L.divIcon({
                        className: 'pharmacy-marker',
                        html: `<div class="marker-icon ${isCurrentUser ? 'current-user' : ''}"></div>`,
                        iconSize: [30, 30],
                        iconAnchor: [15, 15]
                    })
                }).addTo(map);
                
                // Popup ekle
                marker.bindPopup(`
                    <h3>${userPharmacy.name}</h3>
                    <p><strong>Eczacı:</strong> ${user.name} ${user.surname}</p>
                    <p><strong>Adres:</strong> ${userPharmacy.address.fullAddress || userPharmacy.address.street}</p>
                    <p><strong>Telefon:</strong> ${userPharmacy.phone}</p>
                    ${userPharmacy.isOnDuty ? '<p class="duty-status on-duty">Nöbetçi</p>' : '<p class="duty-status">Nöbetçi Değil</p>'}
                `);
                
                // Marker'ı diziye ekle
                pharmacyMarkers.push(marker);
            }
        });
        
        // Tüm markerları görecek şekilde haritayı ayarla (eğer markerlar varsa)
        if (pharmacyMarkers.length > 0) {
            const group = new L.featureGroup(pharmacyMarkers);
            map.fitBounds(group.getBounds().pad(0.1));
        }
    }
    
    // Markerları temizle
    function clearMarkers() {
        pharmacyMarkers.forEach(marker => {
            map.removeLayer(marker);
        });
        pharmacyMarkers = [];
    }
    
    // Oturum kontrolü - sayfa yüklendiğinde önceki oturumu kontrol et
    function checkSession() {
        const savedUser = sessionStorage.getItem('currentUser');
        const savedPharmacistId = sessionStorage.getItem('pharmacistId');
        
        if (savedUser && savedPharmacistId) {
            currentUser = JSON.parse(savedUser);
            
            // Giriş ekranını gizle, harita ekranını göster
            loginContainer.classList.add('hidden');
            mapContainer.classList.remove('hidden');
            
            // Haritayı başlat
            initMap();
            
            // Eczane verilerini yükle
            loadPharmacyData(savedPharmacistId);
        }
    }
    
    // Sayfa yüklendiğinde oturum kontrolü yap
    checkSession();
}); 