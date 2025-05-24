const Transaction = require('../models/Transaction');
const Inventory = require('../models/Inventory');
const { validationResult } = require('express-validator');

// Yeni işlem oluştur
exports.createTransaction = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veri',
        errors: errors.array()
      });
    }

    const transactionData = req.body;
    transactionData.seller.user = req.user.id;

    // Stok kontrolü
    for (const item of transactionData.items) {
      const inventory = await Inventory.findOne({
        pharmacy: transactionData.seller.pharmacy,
        medicine: item.medicine,
        availableQuantity: { $gte: item.quantity }
      });

      if (!inventory) {
        return res.status(400).json({
          success: false,
          message: `${item.medicine} için yeterli stok bulunmuyor`
        });
      }
    }

    // Toplam tutarı hesapla
    let totalAmount = 0;
    transactionData.items.forEach(item => {
      item.totalPrice = {
        currency: item.unitPrice.currency,
        amount: item.unitPrice.amount * item.quantity
      };
      totalAmount += item.totalPrice.amount;
    });

    transactionData.totalAmount = {
      currency: 'TRY',
      amount: totalAmount
    };

    const transaction = new Transaction(transactionData);
    await transaction.save();
    
    // İlk timeline kaydını ekle
    transaction.timeline.push({
      status: 'pending',
      date: new Date(),
      note: 'İşlem oluşturuldu',
      updatedBy: req.user.id
    });

    await transaction.save();
    await transaction.populate('seller.pharmacy seller.user buyer.pharmacy buyer.user items.medicine');

    res.status(201).json({
      success: true,
      message: 'İşlem başarıyla oluşturuldu',
      data: transaction
    });
  } catch (error) {
    console.error('İşlem oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İşlem oluşturulurken hata oluştu'
    });
  }
};

// İşlem durumunu güncelle
exports.updateTransactionStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { status, note } = req.body;

    const transaction = await Transaction.findById(transactionId);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'İşlem bulunamadı'
      });
    }

    // Yetki kontrolü
    const userPharmacy = req.user.pharmacy;
    if (!transaction.seller.pharmacy.equals(userPharmacy) && 
        !transaction.buyer.pharmacy.equals(userPharmacy)) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlemi güncelleme yetkiniz yok'
      });
    }

    const oldStatus = transaction.status;
    transaction.status = status;
    
    // Timeline'a ekle
    transaction.timeline.push({
      status,
      date: new Date(),
      note: note || `Status changed from ${oldStatus} to ${status}`,
      updatedBy: req.user.id
    });

    // Eğer işlem onaylandıysa stokları rezerve et
    if (status === 'confirmed' && oldStatus === 'pending') {
      for (const item of transaction.items) {
        const inventory = await Inventory.findOne({
          pharmacy: transaction.seller.pharmacy,
          medicine: item.medicine
        });
        
        if (inventory) {
          inventory.reservedQuantity += item.quantity;
          await inventory.save();
        }
      }
    }

    // Eğer işlem tamamlandıysa stokları güncelle
    if (status === 'completed') {
      for (const item of transaction.items) {
        const sellerInventory = await Inventory.findOne({
          pharmacy: transaction.seller.pharmacy,
          medicine: item.medicine
        });
        
        if (sellerInventory) {
          sellerInventory.quantity -= item.quantity;
          sellerInventory.reservedQuantity -= item.quantity;
          await sellerInventory.save();
        }

        // Alıcı eczaneye stok ekle veya güncelle
        let buyerInventory = await Inventory.findOne({
          pharmacy: transaction.buyer.pharmacy,
          medicine: item.medicine
        });

        if (buyerInventory) {
          buyerInventory.quantity += item.quantity;
        } else {
          buyerInventory = new Inventory({
            pharmacy: transaction.buyer.pharmacy,
            medicine: item.medicine,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate
          });
        }
        await buyerInventory.save();
      }
    }

    // Eğer işlem iptal edildiyse rezervasyonları kaldır
    if (status === 'cancelled') {
      for (const item of transaction.items) {
        const inventory = await Inventory.findOne({
          pharmacy: transaction.seller.pharmacy,
          medicine: item.medicine
        });
        
        if (inventory && inventory.reservedQuantity >= item.quantity) {
          inventory.reservedQuantity -= item.quantity;
          await inventory.save();
        }
      }
    }

    await transaction.save();
    await transaction.populate('seller.pharmacy seller.user buyer.pharmacy buyer.user items.medicine');

    res.json({
      success: true,
      message: 'İşlem durumu güncellendi',
      data: transaction
    });
  } catch (error) {
    console.error('İşlem durumu güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İşlem durumu güncellenirken hata oluştu'
    });
  }
};

// Kullanıcının işlemlerini getir
exports.getUserTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;
    const userPharmacy = req.user.pharmacy;

    let query = {
      $or: [
        { 'seller.pharmacy': userPharmacy },
        { 'buyer.pharmacy': userPharmacy }
      ]
    };

    if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .populate('seller.pharmacy seller.user buyer.pharmacy buyer.user items.medicine')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: transactions.length,
        totalItems: total
      }
    });
  } catch (error) {
    console.error('İşlem listesi getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İşlem listesi alınırken hata oluştu'
    });
  }
};

// İşlem detayını getir
exports.getTransactionById = async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    const transaction = await Transaction.findById(transactionId)
      .populate('seller.pharmacy seller.user buyer.pharmacy buyer.user items.medicine timeline.updatedBy');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'İşlem bulunamadı'
      });
    }

    // Yetki kontrolü
    const userPharmacy = req.user.pharmacy;
    if (!transaction.seller.pharmacy._id.equals(userPharmacy) && 
        !transaction.buyer.pharmacy._id.equals(userPharmacy)) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlemi görüntüleme yetkiniz yok'
      });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('İşlem detayı getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İşlem detayı alınırken hata oluştu'
    });
  }
};

// İşlem değerlendirmesi ekle
exports.addTransactionRating = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { rating, comment, ratingType } = req.body; // ratingType: 'seller' or 'buyer'

    const transaction = await Transaction.findById(transactionId);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'İşlem bulunamadı'
      });
    }

    if (transaction.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Sadece tamamlanmış işlemler için değerlendirme yapılabilir'
      });
    }

    const userPharmacy = req.user.pharmacy;

    if (ratingType === 'seller' && transaction.buyer.pharmacy.equals(userPharmacy)) {
      transaction.rating.sellerRating = rating;
      transaction.rating.sellerComment = comment;
    } else if (ratingType === 'buyer' && transaction.seller.pharmacy.equals(userPharmacy)) {
      transaction.rating.buyerRating = rating;
      transaction.rating.buyerComment = comment;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Bu değerlendirmeyi yapma yetkiniz yok'
      });
    }

    await transaction.save();

    res.json({
      success: true,
      message: 'Değerlendirme başarıyla eklendi',
      data: transaction.rating
    });
  } catch (error) {
    console.error('Değerlendirme ekleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Değerlendirme eklenirken hata oluştu'
    });
  }
};

// İşlem istatistikleri
exports.getTransactionStats = async (req, res) => {
  try {
    const userPharmacy = req.user.pharmacy;
    
    // Genel istatistikler
    const totalSales = await Transaction.countDocuments({
      'seller.pharmacy': userPharmacy,
      status: 'completed'
    });

    const totalPurchases = await Transaction.countDocuments({
      'buyer.pharmacy': userPharmacy,
      status: 'completed'
    });

    const pendingTransactions = await Transaction.countDocuments({
      $or: [
        { 'seller.pharmacy': userPharmacy },
        { 'buyer.pharmacy': userPharmacy }
      ],
      status: { $in: ['pending', 'confirmed'] }
    });

    // Aylık satış tutarı
    const monthlySales = await Transaction.aggregate([
      {
        $match: {
          'seller.pharmacy': userPharmacy,
          status: 'completed',
          createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 12)) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalAmount: { $sum: '$totalAmount.amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // En çok satılan ilaçlar
    const topSellingMedicines = await Transaction.aggregate([
      { $match: { 'seller.pharmacy': userPharmacy, status: 'completed' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.medicine',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPrice.amount' }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'medicines',
          localField: '_id',
          foreignField: '_id',
          as: 'medicineInfo'
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalSales,
        totalPurchases,
        pendingTransactions,
        monthlySales,
        topSellingMedicines
      }
    });
  } catch (error) {
    console.error('İşlem istatistikleri hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İşlem istatistikleri alınırken hata oluştu'
    });
  }
}; 