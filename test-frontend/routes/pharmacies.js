const express = require('express');
const router = express.Router();
const Pharmacy = require('../models/pharmacy');

// Tüm eczaneleri getir
router.get('/all', async (req, res) => {
    try {
        // Tüm eczaneleri getir
        const pharmacies = await Pharmacy.find({});
        res.json(pharmacies);
    } catch (error) {
        console.error('Eczaneleri getirme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
});

// Nöbetçi eczaneleri getir
router.get('/list', async (req, res) => {
    try {
        const { city, district } = req.query;
        
        // Filtreleme kriterleri
        const filter = { isActive: true };
        
        // Şehir filtreleme
        if (city) {
            filter['address.city'] = city;
        }
        
        // İlçe filtreleme
        if (district) {
            filter['address.district'] = district;
        }
        
        // Nöbetçi eczaneleri filtrele
        filter.isOnDuty = true;
        
        // Eczaneleri getir
        const pharmacies = await Pharmacy.find(filter);
        res.json(pharmacies);
    } catch (error) {
        console.error('Nöbetçi eczaneleri getirme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
});

// En yakın eczaneleri bul
router.get('/nearby', async (req, res) => {
    try {
        const { latitude, longitude, distance = 5 } = req.query;
        
        if (!latitude || !longitude) {
            return res.status(400).json({ message: 'Konum bilgisi gereklidir' });
        }
        
        // GeoJSON query
        const nearbyPharmacies = await Pharmacy.find({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    },
                    $maxDistance: parseFloat(distance) * 1000 // km -> m
                }
            },
            isActive: true
        });
        
        res.json(nearbyPharmacies);
    } catch (error) {
        console.error('Yakındaki eczaneleri getirme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
});

module.exports = router; 