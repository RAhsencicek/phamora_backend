const Medicine = require('../models/Medicine');
const { validationResult } = require('express-validator');

// Tüm ilaçları getir
exports.getAllMedicines = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category, dosageForm, manufacturer } = req.query;

    let query = { isActive: true };

    // Arama filtresi
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { genericName: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
        { 'activeIngredients.name': { $regex: search, $options: 'i' } }
      ];
    }

    // Kategori filtresi
    if (category) {
      query.categories = { $in: [category] };
    }

    // Dozaj formu filtresi
    if (dosageForm) {
      query.dosageForm = dosageForm;
    }

    // Üretici filtresi
    if (manufacturer) {
      query.manufacturer = { $regex: manufacturer, $options: 'i' };
    }

    const total = await Medicine.countDocuments(query);
    const medicines = await Medicine.find(query)
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json({
      success: true,
      data: medicines,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: medicines.length,
        totalItems: total
      }
    });
  } catch (error) {
    console.error('İlaç listesi getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İlaç listesi alınırken hata oluştu'
    });
  }
};

// ID ile ilaç getir
exports.getMedicineById = async (req, res) => {
  try {
    const { medicineId } = req.params;
    
    const medicine = await Medicine.findById(medicineId);
    
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'İlaç bulunamadı'
      });
    }

    res.json({
      success: true,
      data: medicine
    });
  } catch (error) {
    console.error('İlaç getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İlaç bilgisi alınırken hata oluştu'
    });
  }
};

// Barkod ile ilaç getir
exports.getMedicineByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;
    
    const medicine = await Medicine.findOne({ barcode, isActive: true });
    
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Bu barkod ile eşleşen ilaç bulunamadı'
      });
    }

    res.json({
      success: true,
      data: medicine
    });
  } catch (error) {
    console.error('Barkod ile ilaç getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İlaç bilgisi alınırken hata oluştu'
    });
  }
};

// Yeni ilaç ekle
exports.addMedicine = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veri',
        errors: errors.array()
      });
    }

    // Barkod kontrol et
    const existingMedicine = await Medicine.findOne({ barcode: req.body.barcode });
    if (existingMedicine) {
      return res.status(409).json({
        success: false,
        message: 'Bu barkod ile kayıtlı ilaç zaten mevcut'
      });
    }

    const medicine = new Medicine(req.body);
    await medicine.save();

    res.status(201).json({
      success: true,
      message: 'İlaç başarıyla eklendi',
      data: medicine
    });
  } catch (error) {
    console.error('İlaç ekleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İlaç eklenirken hata oluştu'
    });
  }
};

// İlaç güncelle
exports.updateMedicine = async (req, res) => {
  try {
    const { medicineId } = req.params;
    const updateData = req.body;

    // Barkod değiştiriliyorsa kontrol et
    if (updateData.barcode) {
      const existingMedicine = await Medicine.findOne({ 
        barcode: updateData.barcode,
        _id: { $ne: medicineId }
      });
      
      if (existingMedicine) {
        return res.status(409).json({
          success: false,
          message: 'Bu barkod ile kayıtlı başka bir ilaç mevcut'
        });
      }
    }

    const medicine = await Medicine.findByIdAndUpdate(
      medicineId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'İlaç bulunamadı'
      });
    }

    res.json({
      success: true,
      message: 'İlaç başarıyla güncellendi',
      data: medicine
    });
  } catch (error) {
    console.error('İlaç güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İlaç güncellenirken hata oluştu'
    });
  }
};

// İlaç sil (soft delete)
exports.deleteMedicine = async (req, res) => {
  try {
    const { medicineId } = req.params;
    
    const medicine = await Medicine.findByIdAndUpdate(
      medicineId,
      { isActive: false },
      { new: true }
    );

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'İlaç bulunamadı'
      });
    }

    res.json({
      success: true,
      message: 'İlaç başarıyla silindi'
    });
  } catch (error) {
    console.error('İlaç silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İlaç silinirken hata oluştu'
    });
  }
};

// İlaç kategorilerini getir
exports.getCategories = async (req, res) => {
  try {
    const categories = await Medicine.distinct('categories', { isActive: true });
    
    res.json({
      success: true,
      data: categories.sort()
    });
  } catch (error) {
    console.error('Kategori getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Kategoriler alınırken hata oluştu'
    });
  }
};

// İlaç üreticilerini getir
exports.getManufacturers = async (req, res) => {
  try {
    const manufacturers = await Medicine.distinct('manufacturer', { isActive: true });
    
    res.json({
      success: true,
      data: manufacturers.sort()
    });
  } catch (error) {
    console.error('Üretici getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Üreticiler alınırken hata oluştu'
    });
  }
};

// Dozaj formlarını getir
exports.getDosageForms = async (req, res) => {
  try {
    const dosageForms = await Medicine.distinct('dosageForm', { isActive: true });
    
    res.json({
      success: true,
      data: dosageForms.sort()
    });
  } catch (error) {
    console.error('Dozaj formu getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Dozaj formları alınırken hata oluştu'
    });
  }
};

// İlaç istatistikleri
exports.getMedicineStats = async (req, res) => {
  try {
    const totalMedicines = await Medicine.countDocuments({ isActive: true });
    const totalCategories = (await Medicine.distinct('categories', { isActive: true })).length;
    const totalManufacturers = (await Medicine.distinct('manufacturer', { isActive: true })).length;
    
    // En çok kullanılan dozaj formları
    const dosageFormStats = await Medicine.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$dosageForm', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // En çok ilaç üreten şirketler
    const manufacturerStats = await Medicine.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$manufacturer', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        totalMedicines,
        totalCategories,
        totalManufacturers,
        dosageFormStats,
        manufacturerStats
      }
    });
  } catch (error) {
    console.error('İlaç istatistikleri hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İlaç istatistikleri alınırken hata oluştu'
    });
  }
}; 