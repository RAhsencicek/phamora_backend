const Transaction = require('../models/Transaction');
const Inventory = require('../models/Inventory');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const notificationController = require('./notificationController');

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

    // Kullanıcı ID'sini al
    const pharmacistId = req.headers.pharmacistid;
    
    console.log(`Yeni işlem oluşturma isteği: Kullanıcı ID: ${pharmacistId}`);
    
    if (!pharmacistId) {
      return res.status(400).json({
        success: false,
        message: 'PharmacistId header parametresi eksik'
      });
    }
    
    // User'ı direkt olarak pharmacistId ile bul
    const user = await User.findOne({ pharmacistId }).populate('pharmacy');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `${pharmacistId} ID'li kullanıcı bulunamadı`
      });
    }
    
    console.log(`Kullanıcı bulundu: ${user.name} ${user.surname}`);
    
    // Kullanıcının eczanesini kontrol et
    if (!user.pharmacy) {
      return res.status(400).json({
        success: false,
        message: 'Bu kullanıcıya atanmış bir eczane bulunamadı'
      });
    }
    
    console.log(`Kullanıcının eczanesi: ${user.pharmacy.name}, ID: ${user.pharmacy._id}`);

    const transactionData = req.body;
    
    // Eczane ID'sini al - ObjectId kullanarak
    const userPharmacy = user.pharmacy._id;
    
    // Eczane ID'sinin string veya ObjectId olup olmadığını kontrol et
    const pharmacyId = userPharmacy instanceof ObjectId ? userPharmacy : new ObjectId(userPharmacy.toString());
    
    // Eğer belirtilmemişse, satıcı eczanesini kullanıcının eczanesi olarak ayarla
    if (!transactionData.seller) {
      transactionData.seller = pharmacyId;
    } else {
      // String olarak gelen eczane ID'sini ObjectId'ye dönüştür
      transactionData.seller = transactionData.seller instanceof ObjectId ? 
        transactionData.seller : new ObjectId(transactionData.seller.toString());
    }
    
    // Buyer eczane ID'sini ObjectId'ye dönüştür
    if (transactionData.buyer) {
      transactionData.buyer = transactionData.buyer instanceof ObjectId ?
        transactionData.buyer : new ObjectId(transactionData.buyer.toString());
    }
    
    console.log(`İşlem verileri: Satıcı: ${transactionData.seller}, Alıcı: ${transactionData.buyer}`);

    // Stok kontrolü
    for (const item of transactionData.items) {
      console.log(`Stok kontrolü: İlaç ID: ${item.medicine}, Miktar: ${item.quantity}`);
      
      const inventory = await Inventory.findOne({
        pharmacy: transactionData.seller,
        medicine: item.medicine
      });
      
      if (!inventory) {
        return res.status(400).json({
          success: false,
          message: `${item.medicine} ilacı için stok kaydı bulunamadı`
        });
      }
      
      if (inventory.availableQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `${item.medicine} için yeterli stok bulunmuyor. Mevcut: ${inventory.availableQuantity}, İstenen: ${item.quantity}`
        });
      }
      
      console.log(`Stok mevcut: ${inventory.availableQuantity} adet`);
    }

    // Toplam tutarı hesapla
    let totalAmount = 0;
    transactionData.items.forEach(item => {
      item.totalPrice = {
        currency: item.unitPrice.currency || 'TRY',
        amount: item.unitPrice.amount * item.quantity
      };
      totalAmount += item.totalPrice.amount;
      
      console.log(`İlaç: ${item.medicine}, Birim Fiyat: ${item.unitPrice.amount}, Miktar: ${item.quantity}, Toplam: ${item.totalPrice.amount}`);
    });

    transactionData.totalAmount = {
      currency: 'TRY',
      amount: totalAmount
    };
    
    console.log(`Toplam Tutar: ${totalAmount} TL`);

    const transaction = new Transaction(transactionData);
    await transaction.save();
    
    // İlk timeline kaydını ekle
    transaction.timeline.push({
      status: 'pending',
      date: new Date(),
      note: 'İşlem oluşturuldu',
      updatedBy: user._id
    });

    await transaction.save();
    await transaction.populate('seller buyer items.medicine');
    
    console.log(`İşlem başarıyla oluşturuldu: ID: ${transaction._id}, Transaction ID: ${transaction.transactionId}`);

    // İşlem oluşturulduğunda alıcıya bildirim gönder
    await notificationController.createTransactionNotification(req, transaction, 'pending');

    res.status(201).json({
      success: true,
      message: 'İşlem başarıyla oluşturuldu',
      data: transaction
    });
  } catch (error) {
    console.error('İşlem oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İşlem oluşturulurken hata oluştu',
      error: error.message
    });
  }
};

// İşlem durumunu güncelle
exports.updateTransactionStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { status, note } = req.body;

    // Kullanıcı ID'sini al
    const pharmacistId = req.headers.pharmacistid;
    
    console.log(`İşlem durumu güncelleme isteği: İşlem ID: ${transactionId}, Yeni Durum: ${status}, Kullanıcı ID: ${pharmacistId}`);
    
    if (!pharmacistId) {
      return res.status(400).json({
        success: false,
        message: 'PharmacistId header parametresi eksik'
      });
    }
    
    // User'ı direkt olarak pharmacistId ile bul
    const user = await User.findOne({ pharmacistId }).populate('pharmacy');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `${pharmacistId} ID'li kullanıcı bulunamadı`
      });
    }
    
    console.log(`Kullanıcı bulundu: ${user.name} ${user.surname}`);
    
    // Kullanıcının eczanesini kontrol et
    if (!user.pharmacy) {
      return res.status(400).json({
        success: false,
        message: 'Bu kullanıcıya atanmış bir eczane bulunamadı'
      });
    }
    
    console.log(`Kullanıcının eczanesi: ${user.pharmacy.name}, ID: ${user.pharmacy._id}`);
    
    // Eczane ID'sini al - ObjectId kullanarak
    const userPharmacy = user.pharmacy._id;
    
    // Eczane ID'sinin string veya ObjectId olup olmadığını kontrol et
    const pharmacyId = userPharmacy instanceof ObjectId ? userPharmacy : new ObjectId(userPharmacy.toString());

    const transaction = await Transaction.findById(transactionId);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'İşlem bulunamadı'
      });
    }

    // Yetki kontrolü
    if (!transaction.seller.equals(pharmacyId) && 
        !transaction.buyer.equals(pharmacyId)) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlemi güncelleme yetkiniz yok'
      });
    }

    const oldStatus = transaction.status;
    transaction.status = status;
    
    console.log(`İşlem durumu değiştiriliyor: ${oldStatus} -> ${status}`);
    
    // Timeline'a ekle
    transaction.timeline.push({
      status,
      date: new Date(),
      note: note || `Durum ${oldStatus} -> ${status} olarak değiştirildi`,
      updatedBy: user._id
    });

    // Eğer işlem onaylandıysa stokları rezerve et
    if (status === 'confirmed' && oldStatus === 'pending') {
      console.log('Stoklar rezerve ediliyor...');
      for (const item of transaction.items) {
        const inventory = await Inventory.findOne({
          pharmacy: transaction.seller,
          medicine: item.medicine
        });
        
        if (inventory) {
          inventory.reservedQuantity += item.quantity;
          await inventory.save();
          console.log(`${item.medicine} ilacından ${item.quantity} adet rezerve edildi`);
        }
      }
    }

    // Eğer işlem tamamlandıysa stokları güncelle
    if (status === 'completed') {
      console.log('İşlem tamamlandı, stoklar aktarılıyor...');
      for (const item of transaction.items) {
        const sellerInventory = await Inventory.findOne({
          pharmacy: transaction.seller,
          medicine: item.medicine
        });
        
        if (sellerInventory) {
          sellerInventory.quantity -= item.quantity;
          sellerInventory.reservedQuantity -= item.quantity;
          await sellerInventory.save();
          console.log(`Satıcı stoğundan ${item.quantity} adet düşüldü`);
        }

        // Alıcı eczaneye stok ekle veya güncelle
        let buyerInventory = await Inventory.findOne({
          pharmacy: transaction.buyer,
          medicine: item.medicine
        });

        if (buyerInventory) {
          buyerInventory.quantity += item.quantity;
          console.log(`Alıcı stoğuna ${item.quantity} adet eklendi`);
        } else {
          buyerInventory = new Inventory({
            pharmacy: transaction.buyer,
            medicine: item.medicine,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate
          });
          console.log(`Alıcı için yeni stok kaydı oluşturuldu: ${item.quantity} adet`);
        }
        await buyerInventory.save();
      }
    }

    // Eğer işlem iptal edildiyse rezervasyonları kaldır
    if (status === 'cancelled') {
      console.log('İşlem iptal edildi, rezervasyonlar kaldırılıyor...');
      for (const item of transaction.items) {
        const inventory = await Inventory.findOne({
          pharmacy: transaction.seller,
          medicine: item.medicine
        });
        
        if (inventory && inventory.reservedQuantity >= item.quantity) {
          inventory.reservedQuantity -= item.quantity;
          await inventory.save();
          console.log(`${item.medicine} ilacındaki ${item.quantity} adet rezervasyon kaldırıldı`);
        }
      }
    }

    await transaction.save();
    await transaction.populate('seller buyer items.medicine');
    
    // Durum değişikliğinde bildirim gönder
    await notificationController.createTransactionNotification(req, transaction, status);

    res.json({
      success: true,
      message: 'İşlem durumu güncellendi',
      data: transaction
    });
  } catch (error) {
    console.error('İşlem durumu güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İşlem durumu güncellenirken hata oluştu',
      error: error.message
    });
  }
};

// Kullanıcının işlemlerini getir
exports.getUserTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type, startDate, endDate } = req.query;
    
    // Kullanıcı ID'sini al
    const pharmacistId = req.headers.pharmacistid;
    
    console.log(`İşlem listeleme isteği: Kullanıcı ID: ${pharmacistId}`);
    
    if (!pharmacistId) {
      return res.status(400).json({
        success: false,
        message: 'PharmacistId header parametresi eksik'
      });
    }
    
    // User'ı direkt olarak pharmacistId ile bul
    const user = await User.findOne({ pharmacistId }).populate('pharmacy');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `${pharmacistId} ID'li kullanıcı bulunamadı`
      });
    }
    
    console.log(`Kullanıcı bulundu: ${user.name} ${user.surname}`);
    
    // Kullanıcının eczanesini kontrol et
    if (!user.pharmacy) {
      return res.status(400).json({
        success: false,
        message: 'Bu kullanıcıya atanmış bir eczane bulunamadı'
      });
    }
    
    console.log(`Kullanıcının eczanesi: ${user.pharmacy.name}, ID: ${user.pharmacy._id}`);
    
    // Eczane ID'sini al - ObjectId kullanarak
    const userPharmacy = user.pharmacy._id;
    
    // Eczane ID'sinin string veya ObjectId olup olmadığını kontrol et
    const pharmacyId = userPharmacy instanceof ObjectId ? userPharmacy : new ObjectId(userPharmacy.toString());
    
    // Filtreleme kriterleri oluşturalım - Veritabanı yapısı doğrudan seller ve buyer ID'lerini içeriyor
    let query = {
      $or: [
        { 'seller': pharmacyId },
        { 'buyer': pharmacyId }
      ]
    };

    // Durum filtresi
    if (status) {
      query.status = status;
    }

    // İşlem tipi filtresi
    if (type) {
      query.type = type;
    }
    
    // Tarih aralığı filtresi
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Sorgu için log
    console.log('MongoDB Sorgusu:', JSON.stringify(query, null, 2));

    // Toplam kayıt sayısını öğrenelim
    const total = await Transaction.countDocuments(query);
    
    console.log(`Toplam bulunan işlem sayısı: ${total}`);
    
    if (total === 0) {
      // Eczane için hiç işlem yoksa boş liste dön
      return res.json({
        success: true,
        message: 'Bu eczane için işlem kaydı bulunamadı',
        data: [],
        pagination: {
          current: parseInt(page),
          total: 0,
          count: 0,
          totalItems: 0
        }
      });
    }
    
    // Daha detaylı veri için populate işlemlerini genişletelim
    const transactions = await Transaction.find(query)
      .populate({
        path: 'seller',
        select: 'name address phone email licenseNumber isActive isOnDuty workingHours owner'
      })
      .populate({
        path: 'buyer',
        select: 'name address phone email licenseNumber isActive isOnDuty workingHours owner'
      })
      .populate({
        path: 'items.medicine',
        select: 'name genericName manufacturer barcode dosageForm strength packageSize unit description price images activeIngredients categories'
      })
      .populate({
        path: 'timeline.updatedBy',
        select: 'name surname pharmacistId'
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    console.log(`Bulunan işlem sayısı: ${transactions.length}`);

    // İşlemler bulunduğunda eczane sahiplerini de çekelim
    const sellerOwnerIds = transactions.map(t => t.seller.owner).filter(id => id);
    const buyerOwnerIds = transactions.map(t => t.buyer.owner).filter(id => id);
    const uniqueOwnerIds = [...new Set([...sellerOwnerIds, ...buyerOwnerIds])];
    
    // Eczane sahiplerini çekelim
    const owners = uniqueOwnerIds.length > 0 ? 
      await User.find({ _id: { $in: uniqueOwnerIds } }).select('name surname email phone') : [];
    
    // Owner ID -> Owner bilgisi için bir Map oluşturalım
    const ownersMap = new Map();
    owners.forEach(owner => {
      ownersMap.set(owner._id.toString(), owner);
    });

    // Veriyi kullanıcıya daha anlamlı bir şekilde sunalım
    const formattedTransactions = transactions.map(transaction => {
      // Kullanıcının alıcı mı satıcı mı olduğunu belirleyelim
      const isUserSeller = transaction.seller._id.toString() === userPharmacy.toString();
      
      // İşlem tipini Türkçe olarak belirleyelim
      let transactionTypeText;
      switch(transaction.type) {
        case 'sale': transactionTypeText = 'Satış'; break;
        case 'purchase': transactionTypeText = 'Satın Alma'; break;
        case 'exchange': transactionTypeText = 'Takas'; break;
        case 'transfer': transactionTypeText = 'Transfer'; break;
        default: transactionTypeText = transaction.type;
      }
      
      // İşlem durumunu Türkçe olarak belirleyelim
      let statusText;
      switch(transaction.status) {
        case 'pending': statusText = 'Beklemede'; break;
        case 'confirmed': statusText = 'Onaylandı'; break;
        case 'in_transit': statusText = 'Taşınıyor'; break;
        case 'delivered': statusText = 'Teslim Edildi'; break;
        case 'completed': statusText = 'Tamamlandı'; break;
        case 'cancelled': statusText = 'İptal Edildi'; break;
        case 'refunded': statusText = 'İade Edildi'; break;
        default: statusText = transaction.status;
      }
      
      // İşlem yönü
      const direction = isUserSeller ? 'Giden' : 'Gelen';
      
      // Karşı taraf bilgisi
      const counterpartyPharmacy = isUserSeller ? transaction.buyer : transaction.seller;
      
      // Karşı taraf kullanıcısı (varsa)
      const counterpartyOwnerId = counterpartyPharmacy.owner ? counterpartyPharmacy.owner.toString() : null;
      const counterpartyOwner = counterpartyOwnerId ? ownersMap.get(counterpartyOwnerId) : null;
      
      // İlaç detayları
      const itemDetails = transaction.items.map(item => ({
        medicine: {
          id: item.medicine._id,
          name: item.medicine.name,
          genericName: item.medicine.genericName,
          manufacturer: item.medicine.manufacturer,
          barcode: item.medicine.barcode,
          dosageForm: item.medicine.dosageForm,
          strength: item.medicine.strength,
          packageSize: item.medicine.packageSize,
          unit: item.medicine.unit,
          description: item.medicine.description,
          price: item.medicine.price
        },
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('tr-TR') : null
      }));
      
      // Son durum güncellemesi
      const lastStatusUpdate = transaction.timeline && transaction.timeline.length 
        ? transaction.timeline[transaction.timeline.length - 1]
        : { date: transaction.createdAt, status: transaction.status };
      
      // İşlem özeti
      return {
        id: transaction._id,
        transactionId: transaction.transactionId,
        type: transaction.type,
        typeText: transactionTypeText,
        direction,
        status: transaction.status,
        statusText,
        counterparty: {
          pharmacyName: counterpartyPharmacy.name,
          pharmacyAddress: counterpartyPharmacy.address.fullAddress || 
                           `${counterpartyPharmacy.address.street}, ${counterpartyPharmacy.address.district}/${counterpartyPharmacy.address.city}`,
          pharmacyPhone: counterpartyPharmacy.phone,
          contactPerson: counterpartyOwner ? `${counterpartyOwner.name} ${counterpartyOwner.surname}` : 'Bilinmiyor',
          contactPhone: counterpartyOwner ? counterpartyOwner.phone : '',
          contactEmail: counterpartyOwner ? counterpartyOwner.email : ''
        },
        items: itemDetails,
        totalItems: transaction.items.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: transaction.totalAmount,
        paymentMethod: transaction.paymentMethod,
        paymentStatus: transaction.paymentStatus,
        notes: transaction.notes,
        createdAt: transaction.createdAt,
        lastUpdate: {
          status: lastStatusUpdate.status,
          date: lastStatusUpdate.date,
          note: lastStatusUpdate.note
        },
        completedAt: transaction.completedAt,
        timeline: transaction.timeline
      };
    });

    res.json({
      success: true,
      data: formattedTransactions,
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
      message: 'İşlem listesi alınırken hata oluştu',
      error: error.message
    });
  }
};

// İşlem detayını getir
exports.getTransactionById = async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    // Kullanıcı ID'sini al
    const pharmacistId = req.headers.pharmacistid;
    
    console.log(`İşlem detayı isteği: İşlem ID: ${transactionId}, Kullanıcı ID: ${pharmacistId}`);
    
    if (!pharmacistId) {
      return res.status(400).json({
        success: false,
        message: 'PharmacistId header parametresi eksik'
      });
    }
    
    // User'ı direkt olarak pharmacistId ile bul
    const user = await User.findOne({ pharmacistId }).populate('pharmacy');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `${pharmacistId} ID'li kullanıcı bulunamadı`
      });
    }
    
    console.log(`Kullanıcı bulundu: ${user.name} ${user.surname}`);
    
    // Kullanıcının eczanesini kontrol et
    if (!user.pharmacy) {
      return res.status(400).json({
        success: false,
        message: 'Bu kullanıcıya atanmış bir eczane bulunamadı'
      });
    }
    
    console.log(`Kullanıcının eczanesi: ${user.pharmacy.name}, ID: ${user.pharmacy._id}`);
    
    // Eczane ID'sini al - ObjectId kullanarak
    const userPharmacy = user.pharmacy._id;
    
    // Eczane ID'sinin string veya ObjectId olup olmadığını kontrol et
    const pharmacyId = userPharmacy instanceof ObjectId ? userPharmacy : new ObjectId(userPharmacy.toString());
    
    // Daha detaylı veri için populate işlemlerini genişletelim
    const transaction = await Transaction.findById(transactionId)
      .populate({
        path: 'seller',
        select: 'name address phone email licenseNumber isActive isOnDuty workingHours owner'
      })
      .populate({
        path: 'buyer',
        select: 'name address phone email licenseNumber isActive isOnDuty workingHours owner'
      })
      .populate({
        path: 'items.medicine',
        select: 'name genericName manufacturer barcode dosageForm strength packageSize unit description price images activeIngredients categories'
      })
      .populate({
        path: 'timeline.updatedBy',
        select: 'name surname pharmacistId'
      });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'İşlem bulunamadı'
      });
    }
    
    console.log(`İşlem bulundu: ${transaction.transactionId}`);

    // Yetki kontrolü
    if (!transaction.seller.equals(pharmacyId) && 
        !transaction.buyer.equals(pharmacyId)) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlemi görüntüleme yetkiniz yok'
      });
    }

    // Eczane sahiplerini çekelim
    const sellerOwnerId = transaction.seller.owner ? transaction.seller.owner.toString() : null;
    const buyerOwnerId = transaction.buyer.owner ? transaction.buyer.owner.toString() : null;
    const ownerIds = [sellerOwnerId, buyerOwnerId].filter(id => id);
    
    // Eczane sahiplerini çekelim
    const owners = ownerIds.length > 0 ? 
      await User.find({ _id: { $in: ownerIds } }).select('name surname email phone') : [];
    
    // Owner ID -> Owner bilgisi için bir Map oluşturalım
    const ownersMap = new Map();
    owners.forEach(owner => {
      ownersMap.set(owner._id.toString(), owner);
    });
    
    // Satıcı ve alıcı kullanıcı bilgilerini alalım
    const sellerOwner = sellerOwnerId ? ownersMap.get(sellerOwnerId) : null;
    const buyerOwner = buyerOwnerId ? ownersMap.get(buyerOwnerId) : null;

    // Kullanıcının alıcı mı satıcı mı olduğunu belirleyelim
    const isUserSeller = transaction.seller._id.toString() === userPharmacy.toString();
    
    // İşlem tipini Türkçe olarak belirleyelim
    let transactionTypeText;
    switch(transaction.type) {
      case 'sale': transactionTypeText = 'Satış'; break;
      case 'purchase': transactionTypeText = 'Satın Alma'; break;
      case 'exchange': transactionTypeText = 'Takas'; break;
      case 'transfer': transactionTypeText = 'Transfer'; break;
      default: transactionTypeText = transaction.type;
    }
    
    // İşlem durumunu Türkçe olarak belirleyelim
    let statusText;
    switch(transaction.status) {
      case 'pending': statusText = 'Beklemede'; break;
      case 'confirmed': statusText = 'Onaylandı'; break;
      case 'in_transit': statusText = 'Taşınıyor'; break;
      case 'delivered': statusText = 'Teslim Edildi'; break;
      case 'completed': statusText = 'Tamamlandı'; break;
      case 'cancelled': statusText = 'İptal Edildi'; break;
      case 'refunded': statusText = 'İade Edildi'; break;
      default: statusText = transaction.status;
    }
    
    // Ödeme durumunu Türkçe olarak belirleyelim
    let paymentStatusText;
    switch(transaction.paymentStatus) {
      case 'pending': paymentStatusText = 'Beklemede'; break;
      case 'paid': paymentStatusText = 'Ödendi'; break;
      case 'failed': paymentStatusText = 'Başarısız'; break;
      case 'refunded': paymentStatusText = 'İade Edildi'; break;
      default: paymentStatusText = transaction.paymentStatus;
    }
    
    // Ödeme yöntemini Türkçe olarak belirleyelim
    let paymentMethodText;
    switch(transaction.paymentMethod) {
      case 'cash': paymentMethodText = 'Nakit'; break;
      case 'bank_transfer': paymentMethodText = 'Banka Havalesi'; break;
      case 'credit_card': paymentMethodText = 'Kredi Kartı'; break;
      case 'debit_card': paymentMethodText = 'Banka Kartı'; break;
      case 'crypto': paymentMethodText = 'Kripto Para'; break;
      case 'trade_credit': paymentMethodText = 'Ticari Kredi'; break;
      case 'credit': paymentMethodText = 'Kredi'; break;
      case 'debit': paymentMethodText = 'Banka Kartı'; break;
      case 'mobile': paymentMethodText = 'Mobil Ödeme'; break;
      default: paymentMethodText = transaction.paymentMethod;
    }
    
    // İşlem yönü
    const direction = isUserSeller ? 'Giden' : 'Gelen';
    
    // İlaç detayları
    const itemDetails = transaction.items.map(item => {
      // İlaç bilgilerini hazırla
      const medicine = item.medicine;
      const expiryDateFormatted = item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('tr-TR') : null;
      
      return {
        medicine: {
          id: medicine._id,
          name: medicine.name,
          genericName: medicine.genericName,
          manufacturer: medicine.manufacturer,
          barcode: medicine.barcode,
          dosageForm: medicine.dosageForm,
          strength: medicine.strength,
          packageSize: medicine.packageSize,
          unit: medicine.unit,
          description: medicine.description,
          price: medicine.price,
          activeIngredients: medicine.activeIngredients,
          categories: medicine.categories,
          images: medicine.images
        },
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate,
        expiryDateFormatted: expiryDateFormatted
      };
    });
    
    // Zaman çizelgesi
    const formattedTimeline = transaction.timeline.map(event => ({
      status: event.status,
      statusText: (() => {
        switch(event.status) {
          case 'pending': return 'Beklemede'; 
          case 'confirmed': return 'Onaylandı';
          case 'in_transit': return 'Taşınıyor';
          case 'delivered': return 'Teslim Edildi';
          case 'completed': return 'Tamamlandı';
          case 'cancelled': return 'İptal Edildi';
          case 'refunded': return 'İade Edildi';
          default: return event.status;
        }
      })(),
      date: event.date,
      formattedDate: new Date(event.date).toLocaleString('tr-TR'),
      note: event.note,
      updatedBy: event.updatedBy ? `${event.updatedBy.name} ${event.updatedBy.surname}` : 'Sistem'
    }));
    
    // Kapsamlı işlem detayları
    const transactionDetails = {
      id: transaction._id,
      transactionId: transaction.transactionId,
      type: transaction.type,
      typeText: transactionTypeText,
      direction,
      status: transaction.status,
      statusText,
      createdAt: transaction.createdAt,
      createdAtFormatted: new Date(transaction.createdAt).toLocaleString('tr-TR'),
      updatedAt: transaction.updatedAt,
      updatedAtFormatted: new Date(transaction.updatedAt).toLocaleString('tr-TR'),
      completedAt: transaction.completedAt,
      completedAtFormatted: transaction.completedAt ? new Date(transaction.completedAt).toLocaleString('tr-TR') : null,
      
      seller: {
        pharmacy: {
          id: transaction.seller._id,
          name: transaction.seller.name,
          address: transaction.seller.address,
          formattedAddress: transaction.seller.address.fullAddress || 
                           `${transaction.seller.address.street}, ${transaction.seller.address.district}/${transaction.seller.address.city}`,
          phone: transaction.seller.phone,
          email: transaction.seller.email,
          licenseNumber: transaction.seller.licenseNumber,
          isActive: transaction.seller.isActive,
          isOnDuty: transaction.seller.isOnDuty,
          workingHours: transaction.seller.workingHours
        },
        user: sellerOwner ? {
          id: sellerOwner._id,
          name: sellerOwner.name,
          surname: sellerOwner.surname,
          fullName: `${sellerOwner.name} ${sellerOwner.surname}`,
          email: sellerOwner.email,
          phone: sellerOwner.phone
        } : null
      },
      
      buyer: {
        pharmacy: {
          id: transaction.buyer._id,
          name: transaction.buyer.name,
          address: transaction.buyer.address,
          formattedAddress: transaction.buyer.address.fullAddress || 
                           `${transaction.buyer.address.street}, ${transaction.buyer.address.district}/${transaction.buyer.address.city}`,
          phone: transaction.buyer.phone,
          email: transaction.buyer.email,
          licenseNumber: transaction.buyer.licenseNumber,
          isActive: transaction.buyer.isActive,
          isOnDuty: transaction.buyer.isOnDuty,
          workingHours: transaction.buyer.workingHours
        },
        user: buyerOwner ? {
          id: buyerOwner._id,
          name: buyerOwner.name,
          surname: buyerOwner.surname,
          fullName: `${buyerOwner.name} ${buyerOwner.surname}`,
          email: buyerOwner.email,
          phone: buyerOwner.phone
        } : null
      },
      
      items: itemDetails,
      totalItems: transaction.items.reduce((sum, item) => sum + item.quantity, 0),
      totalAmount: transaction.totalAmount,
      
      payment: {
        method: transaction.paymentMethod,
        methodText: paymentMethodText,
        status: transaction.paymentStatus,
        statusText: paymentStatusText
      },
      
      deliveryInfo: transaction.deliveryInfo,
      
      notes: {
        general: transaction.notes,
        seller: transaction.sellerNotes,
        buyer: transaction.buyerNotes,
        cancellationReason: transaction.cancellationReason,
        refundReason: transaction.refundReason
      },
      
      rating: transaction.rating,
      documents: transaction.documents,
      timeline: formattedTimeline,
      
      // İşlem durumuna göre kullanıcının yapabileceği aksiyonlar
      availableActions: (() => {
        const actions = [];
        
        if (isUserSeller) {
          // Satıcı için mümkün olan aksiyonlar
          if (transaction.status === 'pending') {
            actions.push({ action: 'confirm', text: 'Onayla' });
            actions.push({ action: 'cancel', text: 'İptal Et' });
          } else if (transaction.status === 'confirmed') {
            actions.push({ action: 'ship', text: 'Sevkiyata Başla' });
            actions.push({ action: 'cancel', text: 'İptal Et' });
          } else if (transaction.status === 'in_transit') {
            actions.push({ action: 'deliver', text: 'Teslim Edildi' });
          } else if (transaction.status === 'delivered') {
            actions.push({ action: 'complete', text: 'İşlemi Tamamla' });
          } else if (transaction.status === 'completed' && !transaction.rating.sellerRating) {
            actions.push({ action: 'rate', text: 'Değerlendir' });
          }
        } else {
          // Alıcı için mümkün olan aksiyonlar
          if (transaction.status === 'pending') {
            actions.push({ action: 'cancel', text: 'İptal Et' });
          } else if (transaction.status === 'delivered') {
            actions.push({ action: 'confirm_delivery', text: 'Teslim Alındı' });
          } else if (transaction.status === 'completed' && !transaction.rating.buyerRating) {
            actions.push({ action: 'rate', text: 'Değerlendir' });
          }
        }
        
        return actions;
      })()
    };

    res.json({
      success: true,
      data: transactionDetails
    });
  } catch (error) {
    console.error('İşlem detayı getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İşlem detayı alınırken hata oluştu',
      error: error.message
    });
  }
};

// İşlem değerlendirmesi ekle
exports.addTransactionRating = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { rating, comment, ratingType } = req.body; // ratingType: 'seller' or 'buyer'

    // Kullanıcı ID'sini al
    const pharmacistId = req.headers.pharmacistid;
    
    console.log(`İşlem değerlendirme isteği: İşlem ID: ${transactionId}, Kullanıcı ID: ${pharmacistId}, Değerlendirme: ${rating}/5`);
    
    if (!pharmacistId) {
      return res.status(400).json({
        success: false,
        message: 'PharmacistId header parametresi eksik'
      });
    }
    
    // User'ı direkt olarak pharmacistId ile bul
    const user = await User.findOne({ pharmacistId }).populate('pharmacy');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `${pharmacistId} ID'li kullanıcı bulunamadı`
      });
    }
    
    console.log(`Kullanıcı bulundu: ${user.name} ${user.surname}`);
    
    // Kullanıcının eczanesini kontrol et
    if (!user.pharmacy) {
      return res.status(400).json({
        success: false,
        message: 'Bu kullanıcıya atanmış bir eczane bulunamadı'
      });
    }
    
    console.log(`Kullanıcının eczanesi: ${user.pharmacy.name}, ID: ${user.pharmacy._id}`);
    
    // Eczane ID'sini al - ObjectId kullanarak
    const userPharmacy = user.pharmacy._id;
    
    // Eczane ID'sinin string veya ObjectId olup olmadığını kontrol et
    const pharmacyId = userPharmacy instanceof ObjectId ? userPharmacy : new ObjectId(userPharmacy.toString());

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

    if (ratingType === 'seller' && transaction.buyer.equals(pharmacyId)) {
      transaction.rating.sellerRating = rating;
      transaction.rating.sellerComment = comment;
      console.log(`Satıcı değerlendirmesi eklendi: ${rating}/5`);
    } else if (ratingType === 'buyer' && transaction.seller.equals(pharmacyId)) {
      transaction.rating.buyerRating = rating;
      transaction.rating.buyerComment = comment;
      console.log(`Alıcı değerlendirmesi eklendi: ${rating}/5`);
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
      message: 'Değerlendirme eklenirken hata oluştu',
      error: error.message
    });
  }
};

// İşlem istatistikleri
exports.getTransactionStats = async (req, res) => {
  try {
    // Kullanıcı ID'sini al
    const pharmacistId = req.headers.pharmacistid;
    
    console.log(`İşlem istatistikleri isteği: Kullanıcı ID: ${pharmacistId}`);
    
    if (!pharmacistId) {
      return res.status(400).json({
        success: false,
        message: 'PharmacistId header parametresi eksik'
      });
    }
    
    // User'ı direkt olarak pharmacistId ile bul
    const user = await User.findOne({ pharmacistId }).populate('pharmacy');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `${pharmacistId} ID'li kullanıcı bulunamadı`
      });
    }
    
    console.log(`Kullanıcı bulundu: ${user.name} ${user.surname}`);
    
    // Kullanıcının eczanesini kontrol et
    if (!user.pharmacy) {
      return res.status(400).json({
        success: false,
        message: 'Bu kullanıcıya atanmış bir eczane bulunamadı'
      });
    }
    
    console.log(`Kullanıcının eczanesi: ${user.pharmacy.name}, ID: ${user.pharmacy._id}`);
    
    // Eczane ID'sini al
    const userPharmacy = user.pharmacy._id;
    
    // Genel istatistikler
    const totalSales = await Transaction.countDocuments({
      'seller': userPharmacy,
      status: 'completed'
    });

    const totalPurchases = await Transaction.countDocuments({
      'buyer': userPharmacy,
      status: 'completed'
    });

    const pendingTransactions = await Transaction.countDocuments({
      $or: [
        { 'seller': userPharmacy },
        { 'buyer': userPharmacy }
      ],
      status: { $in: ['pending', 'confirmed'] }
    });

    console.log(`İstatistikler: Satışlar: ${totalSales}, Alımlar: ${totalPurchases}, Bekleyen: ${pendingTransactions}`);

    // Toplam satış ve alım tutarları
    const salesAmount = await Transaction.aggregate([
      {
        $match: {
          'seller': userPharmacy,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$totalAmount.amount' }
        }
      }
    ]);

    const purchasesAmount = await Transaction.aggregate([
      {
        $match: {
          'buyer': userPharmacy,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$totalAmount.amount' }
        }
      }
    ]);

    // Son 12 aylık satış tutarları
    const monthlySales = await Transaction.aggregate([
      {
        $match: {
          'seller': userPharmacy,
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

    // Son 12 aylık alımların tutarları
    const monthlyPurchases = await Transaction.aggregate([
      {
        $match: {
          'buyer': userPharmacy,
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

    // Tamamlanmış işlemlerin durum dağılımı
    const transactionStatusDistribution = await Transaction.aggregate([
      {
        $match: {
          $or: [
            { 'seller': userPharmacy },
            { 'buyer': userPharmacy }
          ]
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // En çok satılan ilaçlar
    const topSellingMedicines = await Transaction.aggregate([
      { 
        $match: { 
          'seller': userPharmacy, 
          status: 'completed' 
        } 
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.medicine',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPrice.amount' },
          transactionCount: { $sum: 1 }
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
      },
      {
        $addFields: {
          medicineName: { $arrayElemAt: ['$medicineInfo.name', 0] },
          medicineGenericName: { $arrayElemAt: ['$medicineInfo.genericName', 0] },
          medicineManufacturer: { $arrayElemAt: ['$medicineInfo.manufacturer', 0] }
        }
      },
      {
        $project: {
          _id: 1,
          medicineName: 1,
          medicineGenericName: 1,
          medicineManufacturer: 1,
          totalQuantity: 1,
          totalRevenue: 1,
          transactionCount: 1,
          averageRevenuePerUnit: { $divide: ['$totalRevenue', '$totalQuantity'] }
        }
      }
    ]);

    // En çok satın alınan ilaçlar
    const topPurchasedMedicines = await Transaction.aggregate([
      { 
        $match: { 
          'buyer': userPharmacy, 
          status: 'completed' 
        } 
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.medicine',
          totalQuantity: { $sum: '$items.quantity' },
          totalCost: { $sum: '$items.totalPrice.amount' },
          transactionCount: { $sum: 1 }
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
      },
      {
        $addFields: {
          medicineName: { $arrayElemAt: ['$medicineInfo.name', 0] },
          medicineGenericName: { $arrayElemAt: ['$medicineInfo.genericName', 0] },
          medicineManufacturer: { $arrayElemAt: ['$medicineInfo.manufacturer', 0] }
        }
      },
      {
        $project: {
          _id: 1,
          medicineName: 1,
          medicineGenericName: 1,
          medicineManufacturer: 1,
          totalQuantity: 1,
          totalCost: 1,
          transactionCount: 1,
          averageCostPerUnit: { $divide: ['$totalCost', '$totalQuantity'] }
        }
      }
    ]);

    // İşlem yapılan eczaneler
    const tradingPartners = await Transaction.aggregate([
      {
        $match: {
          $or: [
            { 'seller': userPharmacy },
            { 'buyer': userPharmacy }
          ],
          status: 'completed'
        }
      },
      {
        $project: {
          partnerPharmacy: {
            $cond: {
              if: { $eq: ['$seller', userPharmacy] },
              then: '$buyer',
              else: '$seller'
            }
          },
          isSale: { $eq: ['$seller', userPharmacy] },
          amount: '$totalAmount.amount'
        }
      },
      {
        $group: {
          _id: '$partnerPharmacy',
          totalSales: {
            $sum: {
              $cond: [
                '$isSale',
                '$amount',
                0
              ]
            }
          },
          totalPurchases: {
            $sum: {
              $cond: [
                '$isSale',
                0,
                '$amount'
              ]
            }
          },
          saleCount: {
            $sum: {
              $cond: [
                '$isSale',
                1,
                0
              ]
            }
          },
          purchaseCount: {
            $sum: {
              $cond: [
                '$isSale',
                0,
                1
              ]
            }
          },
          totalTransactions: { $sum: 1 }
        }
      },
      { $sort: { totalTransactions: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'pharmacies',
          localField: '_id',
          foreignField: '_id',
          as: 'pharmacyInfo'
        }
      },
      {
        $addFields: {
          pharmacyName: { $arrayElemAt: ['$pharmacyInfo.name', 0] },
          pharmacyAddress: { 
            $concat: [
              { $arrayElemAt: ['$pharmacyInfo.address.district', 0] },
              '/',
              { $arrayElemAt: ['$pharmacyInfo.address.city', 0] }
            ]
          }
        }
      }
    ]);

    // Son 7 günlük işlem özeti
    const lastWeekActivity = await Transaction.aggregate([
      {
        $match: {
          $or: [
            { 'seller': userPharmacy },
            { 'buyer': userPharmacy }
          ],
          createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 7)) }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          statuses: { 
            $push: { 
              status: '$_id.status', 
              count: '$count' 
            } 
          },
          totalCount: { $sum: '$count' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Veri formatını kullanışlı hale getirelim
    const formattedMonthlySales = monthlySales.map(item => {
      const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
      return {
        year: item._id.year,
        month: item._id.month,
        monthName: monthNames[item._id.month - 1],
        label: `${monthNames[item._id.month - 1]} ${item._id.year}`,
        totalAmount: item.totalAmount,
        formattedAmount: `${item.totalAmount.toFixed(2)} TL`,
        count: item.count
      };
    });
    
    const formattedMonthlyPurchases = monthlyPurchases.map(item => {
      const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
      return {
        year: item._id.year,
        month: item._id.month,
        monthName: monthNames[item._id.month - 1],
        label: `${monthNames[item._id.month - 1]} ${item._id.year}`,
        totalAmount: item.totalAmount,
        formattedAmount: `${item.totalAmount.toFixed(2)} TL`,
        count: item.count
      };
    });

    const formattedStatusDistribution = transactionStatusDistribution.map(item => {
      let statusText;
      switch(item._id) {
        case 'pending': statusText = 'Beklemede'; break;
        case 'confirmed': statusText = 'Onaylandı'; break;
        case 'in_transit': statusText = 'Taşınıyor'; break;
        case 'delivered': statusText = 'Teslim Edildi'; break;
        case 'completed': statusText = 'Tamamlandı'; break;
        case 'cancelled': statusText = 'İptal Edildi'; break;
        case 'refunded': statusText = 'İade Edildi'; break;
        default: statusText = item._id;
      }
      return {
        status: item._id,
        statusText,
        count: item.count
      };
    });
    
    // Grafik için veri hazırlayalım
    const chartData = {
      // Aylık satış ve alım karşılaştırması
      monthlySummary: {
        labels: [...new Set([...formattedMonthlySales, ...formattedMonthlyPurchases].map(item => item.label))].sort(),
        datasets: [
          {
            label: 'Satışlar',
            data: formattedMonthlySales.map(item => ({
              x: item.label,
              y: item.totalAmount
            }))
          },
          {
            label: 'Alımlar',
            data: formattedMonthlyPurchases.map(item => ({
              x: item.label,
              y: item.totalAmount
            }))
          }
        ]
      },
      // İşlem durumu dağılımı
      statusDistribution: {
        labels: formattedStatusDistribution.map(item => item.statusText),
        data: formattedStatusDistribution.map(item => item.count)
      }
    };

    res.json({
      success: true,
      data: {
        summary: {
          totalSales,
          totalPurchases,
          pendingTransactions,
          totalSalesAmount: salesAmount.length > 0 ? salesAmount[0].totalAmount : 0,
          totalPurchasesAmount: purchasesAmount.length > 0 ? purchasesAmount[0].totalAmount : 0,
          netBalance: (salesAmount.length > 0 ? salesAmount[0].totalAmount : 0) - 
                     (purchasesAmount.length > 0 ? purchasesAmount[0].totalAmount : 0)
        },
        monthlySales: formattedMonthlySales,
        monthlyPurchases: formattedMonthlyPurchases,
        statusDistribution: formattedStatusDistribution,
        topSellingMedicines,
        topPurchasedMedicines,
        tradingPartners,
        lastWeekActivity,
        chartData
      }
    });
  } catch (error) {
    console.error('İşlem istatistikleri hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İşlem istatistikleri alınırken hata oluştu',
      error: error.message
    });
  }
};

// İşlem onaylama (alıcı tarafından)
exports.confirmTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { note } = req.body;

    // Kullanıcı ID'sini al
    const pharmacistId = req.headers.pharmacistid;
    
    console.log(`İşlem onaylama isteği: İşlem ID: ${transactionId}, Kullanıcı ID: ${pharmacistId}`);
    
    if (!pharmacistId) {
      return res.status(400).json({
        success: false,
        message: 'PharmacistId header parametresi eksik'
      });
    }
    
    // User'ı direkt olarak pharmacistId ile bul
    const user = await User.findOne({ pharmacistId }).populate('pharmacy');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `${pharmacistId} ID'li kullanıcı bulunamadı`
      });
    }
    
    // Kullanıcının eczanesini kontrol et
    if (!user.pharmacy) {
      return res.status(400).json({
        success: false,
        message: 'Bu kullanıcıya atanmış bir eczane bulunamadı'
      });
    }
    
    const pharmacyId = user.pharmacy._id instanceof ObjectId ? user.pharmacy._id : new ObjectId(user.pharmacy._id.toString());

    const transaction = await Transaction.findById(transactionId);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'İşlem bulunamadı'
      });
    }

    // Sadece alıcı eczane onaylayabilir
    if (!transaction.buyer.equals(pharmacyId)) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlemi onaylama yetkiniz yok. Sadece alıcı eczane onaylayabilir.'
      });
    }

    // Sadece pending durumundaki işlemler onaylanabilir
    if (transaction.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Bu işlem zaten ${transaction.status} durumunda. Sadece beklemedeki işlemler onaylanabilir.`
      });
    }

    // Stok kontrolü
    for (const item of transaction.items) {
      const inventory = await Inventory.findOne({
        pharmacy: transaction.seller,
        medicine: item.medicine
      });
      
      if (!inventory) {
        return res.status(400).json({
          success: false,
          message: `${item.medicine} ilacı için stok kaydı bulunamadı`
        });
      }
      
      if (inventory.availableQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `${item.medicine} için yeterli stok bulunmuyor. Mevcut: ${inventory.availableQuantity}, İstenen: ${item.quantity}`
        });
      }
    }

    // İşlemi onayla
    transaction.status = 'confirmed';
    
    // Timeline'a ekle
    transaction.timeline.push({
      status: 'confirmed',
      date: new Date(),
      note: note || 'İşlem alıcı tarafından onaylandı',
      updatedBy: user._id
    });

    // Stokları rezerve et
    for (const item of transaction.items) {
      const inventory = await Inventory.findOne({
        pharmacy: transaction.seller,
        medicine: item.medicine
      });
      
      if (inventory) {
        inventory.reservedQuantity += item.quantity;
        await inventory.save();
        console.log(`${item.medicine} ilacından ${item.quantity} adet rezerve edildi`);
      }
    }

    await transaction.save();
    await transaction.populate('seller buyer items.medicine');
    
    // Satıcıya bildirim gönder
    await notificationController.createTransactionNotification(req, transaction, 'confirmed');

    res.json({
      success: true,
      message: 'İşlem başarıyla onaylandı',
      data: transaction
    });
  } catch (error) {
    console.error('İşlem onaylama hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İşlem onaylanırken hata oluştu',
      error: error.message
    });
  }
};

// İşlem reddetme (alıcı tarafından)
exports.rejectTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { reason } = req.body;

    // Kullanıcı ID'sini al
    const pharmacistId = req.headers.pharmacistid;
    
    console.log(`İşlem reddetme isteği: İşlem ID: ${transactionId}, Kullanıcı ID: ${pharmacistId}`);
    
    if (!pharmacistId) {
      return res.status(400).json({
        success: false,
        message: 'PharmacistId header parametresi eksik'
      });
    }
    
    // User'ı direkt olarak pharmacistId ile bul
    const user = await User.findOne({ pharmacistId }).populate('pharmacy');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `${pharmacistId} ID'li kullanıcı bulunamadı`
      });
    }
    
    // Kullanıcının eczanesini kontrol et
    if (!user.pharmacy) {
      return res.status(400).json({
        success: false,
        message: 'Bu kullanıcıya atanmış bir eczane bulunamadı'
      });
    }
    
    const pharmacyId = user.pharmacy._id instanceof ObjectId ? user.pharmacy._id : new ObjectId(user.pharmacy._id.toString());

    const transaction = await Transaction.findById(transactionId);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'İşlem bulunamadı'
      });
    }

    // Sadece alıcı eczane reddedebilir
    if (!transaction.buyer.equals(pharmacyId)) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlemi reddetme yetkiniz yok. Sadece alıcı eczane reddedebilir.'
      });
    }

    // Sadece pending durumundaki işlemler reddedilebilir
    if (transaction.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Bu işlem zaten ${transaction.status} durumunda. Sadece beklemedeki işlemler reddedilebilir.`
      });
    }

    // İşlemi iptal et
    transaction.status = 'cancelled';
    transaction.cancellationReason = reason || 'Alıcı tarafından reddedildi';
    
    // Timeline'a ekle
    transaction.timeline.push({
      status: 'cancelled',
      date: new Date(),
      note: `İşlem alıcı tarafından reddedildi. Sebep: ${reason || 'Belirtilmedi'}`,
      updatedBy: user._id
    });

    await transaction.save();
    await transaction.populate('seller buyer items.medicine');
    
    // Satıcıya bildirim gönder
    await notificationController.createTransactionNotification(req, transaction, 'cancelled');

    res.json({
      success: true,
      message: 'İşlem başarıyla reddedildi',
      data: transaction
    });
  } catch (error) {
    console.error('İşlem reddetme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İşlem reddedilirken hata oluştu',
      error: error.message
    });
  }
};

// İşlem durumu değişikliklerinde bildirim gönder
async function sendTransactionNotification(transaction, status, currentUser) {
  try {
    // İşlem ve kullanıcı bilgilerini doldur
    await transaction.populate([
      { path: 'seller', select: 'name owner' },
      { path: 'buyer', select: 'name owner' },
      { path: 'items.medicine', select: 'name' }
    ]);
    
    // Satıcı ve alıcı kullanıcılarını bul
    const sellerUser = transaction.seller.owner ? await User.findById(transaction.seller.owner) : null;
    const buyerUser = transaction.buyer.owner ? await User.findById(transaction.buyer.owner) : null;
    
    // İlaçları bir araya getir
    const medicineNames = transaction.items.map(item => item.medicine.name).join(', ');
    
    // Toplam ürün miktarını hesapla
    const totalItems = transaction.items.reduce((sum, item) => sum + item.quantity, 0);
    
    let title, message, type, recipientId;
    
    // İşlem durumuna göre bildirim içeriğini oluştur
    switch(status) {
      case 'created':
      case 'pending':
        // Alıcıya bildirim gönder (satıcı işlemi oluşturdu)
        if (buyerUser && currentUser._id.toString() === sellerUser._id.toString()) {
          title = 'Yeni İşlem Teklifi';
          message = `${transaction.seller.name} eczanesinden "${medicineNames}" için ${totalItems} adet yeni bir teklif aldınız.`;
          type = 'offer';
          recipientId = buyerUser._id;
        }
        break;
        
      case 'confirmed':
        // Satıcıya bildirim gönder (alıcı onayladı)
        if (sellerUser && currentUser._id.toString() === buyerUser._id.toString()) {
          title = 'İşlem Onaylandı';
          message = `${transaction.buyer.name} eczanesi "${medicineNames}" için teklifinizi onayladı.`;
          type = 'transaction';
          recipientId = sellerUser._id;
        }
        break;
        
      case 'in_transit':
        // Alıcıya bildirim gönder (satıcı kargoya verdi)
        if (buyerUser && currentUser._id.toString() === sellerUser._id.toString()) {
          title = 'Sipariş Sevk Edildi';
          message = `${transaction.seller.name} eczanesi "${medicineNames}" siparişinizi sevk etti.`;
          type = 'purchase';
          recipientId = buyerUser._id;
        }
        break;
        
      case 'delivered':
        // Alıcıya bildirim gönder (teslim edildi)
        if (buyerUser && currentUser._id.toString() === sellerUser._id.toString()) {
          title = 'Sipariş Teslim Edildi';
          message = `${transaction.seller.name} eczanesinden "${medicineNames}" siparişiniz teslim edildi. Lütfen kontrol edin.`;
          type = 'purchase';
          recipientId = buyerUser._id;
        }
        break;
        
      case 'completed':
        // Her iki tarafa da bildirim gönder (işlem tamamlandı)
        if (sellerUser) {
          await notificationController.createNotification(sellerUser._id, {
            title: 'İşlem Tamamlandı',
            message: `${transaction.buyer.name} eczanesi ile "${medicineNames}" için işleminiz tamamlandı.`,
            type: 'transaction',
            data: {
              transactionId: transaction._id
            }
          });
        }
        
        if (buyerUser) {
          await notificationController.createNotification(buyerUser._id, {
            title: 'İşlem Tamamlandı',
            message: `${transaction.seller.name} eczanesi ile "${medicineNames}" için işleminiz tamamlandı.`,
            type: 'purchase',
            data: {
              transactionId: transaction._id
            }
          });
        }
        
        return; // Her iki bildirimi de gönderdik, fonksiyondan çık
        
      case 'cancelled':
        // İşlemi iptal eden tarafın karşısındaki tarafa bildirim gönder
        if (currentUser._id.toString() === sellerUser._id.toString() && buyerUser) {
          title = 'İşlem İptal Edildi';
          message = `${transaction.seller.name} eczanesi "${medicineNames}" için işlemi iptal etti.`;
          type = 'transaction';
          recipientId = buyerUser._id;
        } else if (currentUser._id.toString() === buyerUser._id.toString() && sellerUser) {
          title = 'İşlem İptal Edildi';
          message = `${transaction.buyer.name} eczanesi "${medicineNames}" için işlemi iptal etti.`;
          type = 'transaction';
          recipientId = sellerUser._id;
        }
        break;
        
      default:
        return; // Diğer durumlar için bildirim gönderme
    }
    
    // Bildirim gönder
    if (title && message && recipientId) {
      await notificationController.createNotification(recipientId, {
        title,
        message,
        type,
        data: {
          transactionId: transaction._id
        }
      });
      console.log(`Bildirim gönderildi: ${title} - Alıcı: ${recipientId}`);
    }
  } catch (error) {
    console.error('Bildirim gönderme hatası:', error);
  }
} 