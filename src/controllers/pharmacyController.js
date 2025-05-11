const axios = require('axios');
const API_KEY = process.env.NOSY_API_KEY || 'XAkQiDBCyrf4bBmd90RDsswsLS1X0j6IJkyGoYyQ5x4qf9BsNvKuLNiLrJ5A';
const BASE_URL = 'https://www.nosyapi.com/apiv2/service/pharmacies-on-duty';

// Tüm illeri getiren fonksiyon
exports.getCities = async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/cities`, {
      params: { apiKey: API_KEY }
    });

    return res.json(response.data);
  } catch (error) {
    console.error('Şehirler alınırken hata oluştu:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Şehirler alınırken bir hata oluştu'
    });
  }
};

// Nöbetçi eczaneleri getiren fonksiyon
exports.getPharmacies = async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}`, {
      params: { 
        apiKey: API_KEY,
        city: req.query.city,
        district: req.query.district
      }
    });

    return res.json(response.data);
  } catch (error) {
    console.error('Nöbetçi eczaneler alınırken hata oluştu:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Nöbetçi eczaneler alınırken bir hata oluştu'
    });
  }
};

// Konuma göre en yakın eczaneleri getiren fonksiyon
exports.getNearbyPharmacies = async (req, res) => {
  const { latitude, longitude } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({
      success: false,
      message: 'Enlem ve boylam değerleri gereklidir'
    });
  }

  try {
    const response = await axios.get(`${BASE_URL}/locations`, {
      params: { 
        apiKey: API_KEY,
        latitude,
        longitude
      }
    });

    return res.json(response.data);
  } catch (error) {
    console.error('Yakındaki eczaneler alınırken hata oluştu:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Yakındaki eczaneler alınırken bir hata oluştu'
    });
  }
};

// İl ve ilçelerdeki nöbetçi eczane sayılarını getiren fonksiyon
exports.getPharmacyCounts = async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/count-cities`, {
      params: { apiKey: API_KEY }
    });

    return res.json(response.data);
  } catch (error) {
    console.error('Eczane sayıları alınırken hata oluştu:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Eczane sayıları alınırken bir hata oluştu'
    });
  }
};

// Tüm Türkiye ve Kıbrıs'taki nöbetçi eczaneleri getiren fonksiyon
exports.getAllPharmacies = async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/all`, {
      params: { apiKey: API_KEY }
    });

    return res.json(response.data);
  } catch (error) {
    console.error('Tüm eczaneler alınırken hata oluştu:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Tüm eczaneler alınırken bir hata oluştu'
    });
  }
};

// Nöbetçi eczane verilerinin son güncelleme zamanını getiren fonksiyon
exports.getPharmacyStatus = async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/status`, {
      params: { apiKey: API_KEY }
    });

    return res.json(response.data);
  } catch (error) {
    console.error('Durum bilgisi alınırken hata oluştu:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Durum bilgisi alınırken bir hata oluştu'
    });
  }
}; 