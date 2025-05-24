const Inventory = require('../models/Inventory');
const Medicine = require('../models/Medicine');
const Pharmacy = require('../models/Pharmacy');
const { validationResult } = require('express-validator');

// Eczaneye ait tüm stokları getir
exports.getInventory = async (req, res) => {
  try {
    const { pharmacyId } = req.params;
    const { page = 1, limit = 20, status, search } = req.query;

    let query = { pharmacy: pharmacyId };
    
    if (status) {
      query.status = status;
    }

    let inventoryQuery = Inventory.find(query)
      .populate('medicine', 'name genericName manufacturer barcode dosageForm')
      .populate('pharmacy', 'name')
      .sort({ updatedAt: -1 });

    if (search) {
      const medicines = await Medicine.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { genericName: { $regex: search, $options: 'i' } },
          { manufacturer: { $regex: search, $options: 'i' } },
          { barcode: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      query.medicine = { $in: medicines.map(m => m._id) };
      inventoryQuery = Inventory.find(query)
        .populate('medicine', 'name genericName manufacturer barcode dosageForm')
        .populate('pharmacy', 'name')
        .sort({ updatedAt: -1 });
    }

    const total = await Inventory.countDocuments(query);
    const inventory = await inventoryQuery
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json({
      success: true,
      data: inventory,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: inventory.length,
        totalItems: total
      }
    });
  } catch (error) {
    console.error('Stok getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Stok bilgileri alınırken hata oluştu'
    });
  }
};

// Yeni stok ekle
exports.addInventory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veri',
        errors: errors.array()
      });
    }

    const inventoryData = req.body;
    inventoryData.pharmacy = req.params.pharmacyId;

    // Aynı eczane ve ilaç için mevcut stok var mı kontrol et
    const existingInventory = await Inventory.findOne({
      pharmacy: inventoryData.pharmacy,
      medicine: inventoryData.medicine
    });

    if (existingInventory) {
      // Mevcut stok varsa güncelle
      existingInventory.quantity += inventoryData.quantity;
      existingInventory.unitPrice = inventoryData.unitPrice;
      existingInventory.costPrice = inventoryData.costPrice;
      existingInventory.batchNumber = inventoryData.batchNumber;
      existingInventory.expiryDate = inventoryData.expiryDate;
      existingInventory.lastRestockDate = new Date();
      
      const updatedInventory = await existingInventory.save();
      await updatedInventory.populate('medicine pharmacy');
      
      return res.status(200).json({
        success: true,
        message: 'Mevcut stok güncellendi',
        data: updatedInventory
      });
    }

    const inventory = new Inventory(inventoryData);
    inventory.lastRestockDate = new Date();
    await inventory.save();
    await inventory.populate('medicine pharmacy');

    res.status(201).json({
      success: true,
      message: 'Stok başarıyla eklendi',
      data: inventory
    });
  } catch (error) {
    console.error('Stok ekleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Stok eklenirken hata oluştu'
    });
  }
};

// Stok güncelle
exports.updateInventory = async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const updateData = req.body;
    
    const inventory = await Inventory.findByIdAndUpdate(
      inventoryId,
      updateData,
      { new: true, runValidators: true }
    ).populate('medicine pharmacy');

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Stok bulunamadı'
      });
    }

    res.json({
      success: true,
      message: 'Stok başarıyla güncellendi',
      data: inventory
    });
  } catch (error) {
    console.error('Stok güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Stok güncellenirken hata oluştu'
    });
  }
};

// Stok sil
exports.deleteInventory = async (req, res) => {
  try {
    const { inventoryId } = req.params;
    
    const inventory = await Inventory.findByIdAndDelete(inventoryId);

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Stok bulunamadı'
      });
    }

    res.json({
      success: true,
      message: 'Stok başarıyla silindi'
    });
  } catch (error) {
    console.error('Stok silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Stok silinirken hata oluştu'
    });
  }
};

// Düşük stok uyarıları
exports.getLowStockAlerts = async (req, res) => {
  try {
    const { pharmacyId } = req.params;
    
    const lowStockItems = await Inventory.find({
      pharmacy: pharmacyId,
      $expr: { $lte: ['$quantity', '$minStockLevel'] },
      status: { $in: ['in_stock', 'low_stock'] }
    })
    .populate('medicine', 'name genericName manufacturer barcode')
    .sort({ quantity: 1 });

    res.json({
      success: true,
      data: lowStockItems,
      count: lowStockItems.length
    });
  } catch (error) {
    console.error('Düşük stok uyarıları hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Düşük stok uyarıları alınırken hata oluştu'
    });
  }
};

// Son kullanma tarihi yaklaşan ürünler
exports.getExpiringItems = async (req, res) => {
  try {
    const { pharmacyId } = req.params;
    const { days = 30 } = req.query;
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + parseInt(days));

    const expiringItems = await Inventory.find({
      pharmacy: pharmacyId,
      expiryDate: { $lte: futureDate, $gte: new Date() },
      quantity: { $gt: 0 }
    })
    .populate('medicine', 'name genericName manufacturer barcode')
    .sort({ expiryDate: 1 });

    res.json({
      success: true,
      data: expiringItems,
      count: expiringItems.length
    });
  } catch (error) {
    console.error('Son kullanma tarihi uyarıları hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Son kullanma tarihi uyarıları alınırken hata oluştu'
    });
  }
};

// İlaç arama (eczaneler arası ticaret için)
exports.searchMedicineInOtherPharmacies = async (req, res) => {
  try {
    const { medicineId } = req.params;
    const { latitude, longitude, maxDistance = 50 } = req.query;
    const currentPharmacyId = req.user.pharmacy; // JWT'den gelen eczane ID'si

    let query = {
      medicine: medicineId,
      pharmacy: { $ne: currentPharmacyId },
      availableQuantity: { $gt: 0 },
      isAvailableForTrade: true,
      status: 'in_stock'
    };

    let inventoryQuery = Inventory.find(query)
      .populate('medicine', 'name genericName manufacturer barcode dosageForm')
      .populate('pharmacy', 'name phone email address location');

    // Eğer konum verilmişse, yakındaki eczaneleri öncelikle göster
    if (latitude && longitude) {
      inventoryQuery = inventoryQuery.sort({
        'pharmacy.location': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            $maxDistance: maxDistance * 1000 // km to meters
          }
        }
      });
    }

    const availableStock = await inventoryQuery;

    res.json({
      success: true,
      data: availableStock,
      count: availableStock.length
    });
  } catch (error) {
    console.error('İlaç arama hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İlaç arama işlemi sırasında hata oluştu'
    });
  }
};

// Stok rezerve et (sipariş sırasında)
exports.reserveStock = async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const { quantity } = req.body;

    const inventory = await Inventory.findById(inventoryId);
    
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Stok bulunamadı'
      });
    }

    if (inventory.availableQuantity < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Yeterli stok bulunmuyor'
      });
    }

    inventory.reservedQuantity += quantity;
    await inventory.save();

    res.json({
      success: true,
      message: 'Stok rezerve edildi',
      data: inventory
    });
  } catch (error) {
    console.error('Stok rezerve etme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Stok rezerve edilirken hata oluştu'
    });
  }
}; 