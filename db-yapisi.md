// MongoDB veritabanına bağlanma ve veritabanı oluşturma
use phamora

// Eski koleksiyonları temizle
db.users.drop()
db.pharmacies.drop()
db.medicines.drop()
db.inventories.drop()
db.transactions.drop()
db.drugsearches.drop()
db.drugs.drop()
db.drugDetails.drop()
db.adverseEvents.drop()
db.drugRecalls.drop()

// 1. Kullanıcılar koleksiyonu (eczacılar)
db.createCollection("users")

// Kullanıcı verileri ekleme
let user1Id = ObjectId()
let user2Id = ObjectId()

db.users.insertMany([
  {
    _id: user1Id,
    pharmacistId: "EC001",
    name: "Ahmet",
    surname: "Yılmaz",
    email: "ahmet.yilmaz@example.com",
    phone: "+905551234567",
    passwordHash: "sha256hashedpassword123",
    role: "pharmacist",
    address: {
      street: "Çarşı Mah. Gazi Cad. No:84",
      city: "Elazığ", 
      district: "Merkez",
      postalCode: "23100"
    },
    location: {
      type: "Point",
      coordinates: [39.2237, 38.6741]
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    twoFactorEnabled: false
  },
  {
    _id: user2Id,
    pharmacistId: "EC002",
    name: "Zeynep",
    surname: "Kaya",
    email: "zeynep.kaya@example.com",
    phone: "+905559876543",
    passwordHash: "sha256hashedpassword456",
    role: "pharmacist",
    address: {
      street: "İzzetpaşa Mah. Şehit Polis M.Fevzi Yalçın Cad. No:14/C",
      city: "Elazığ",
      district: "Merkez",
      postalCode: "23100"
    },
    location: {
      type: "Point",
      coordinates: [39.2058, 38.6828]
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    twoFactorEnabled: false
  }
])

// 2. Eczaneler koleksiyonu
db.createCollection("pharmacies")

// Eczane verileri ekleme
let pharmacy1Id = ObjectId()
let pharmacy2Id = ObjectId()

db.pharmacies.insertMany([
  {
    _id: pharmacy1Id,
    name: "Merkez Eczanesi",
    owner: user1Id,  // Kullanıcı referansı
    address: {
      street: "Çarşı Mah. Gazi Cad. No:84",
      city: "Elazığ",
      district: "Merkez",
      postalCode: "23100",
      fullAddress: "Çarşı Mah. Gazi Cad. No:84, Merkez/Elazığ"
    },
    location: {
      type: "Point",
      coordinates: [39.2237, 38.6741]
    },
    phone: "0424 218 1001",
    email: "merkez@example.com",
    licenseNumber: "EC-2024-001",
    isActive: true,
    isOnDuty: true,
    workingHours: {
      monday: { open: "08:00", close: "18:00" },
      tuesday: { open: "08:00", close: "18:00" },
      wednesday: { open: "08:00", close: "18:00" },
      thursday: { open: "08:00", close: "18:00" },
      friday: { open: "08:00", close: "18:00" },
      saturday: { open: "09:00", close: "17:00" },
      sunday: { open: "10:00", close: "15:00" }
    },
    rating: { average: 4.7, count: 32 },
    description: "Merkez'in köklü eczanesi",
    services: ["Nöbetçi", "Evde Teslimat", "Danışmanlık"],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: pharmacy2Id,
    name: "Fırat Eczanesi",
    owner: user2Id,  // Kullanıcı referansı
    address: {
      street: "İzzetpaşa Mah. Şehit Polis M.Fevzi Yalçın Cad. No:14/C",
      city: "Elazığ",
      district: "Merkez",
      postalCode: "23100",
      fullAddress: "İzzetpaşa Mah. Şehit Polis M.Fevzi Yalçın Cad. No:14/C, Merkez/Elazığ"
    },
    location: {
      type: "Point",
      coordinates: [39.2058, 38.6828]
    },
    phone: "0424 237 8787",
    email: "firat@example.com",
    licenseNumber: "EC-2024-002",
    isActive: true,
    isOnDuty: false,
    workingHours: {
      monday: { open: "08:30", close: "18:30" },
      tuesday: { open: "08:30", close: "18:30" },
      wednesday: { open: "08:30", close: "18:30" },
      thursday: { open: "08:30", close: "18:30" },
      friday: { open: "08:30", close: "18:30" },
      saturday: { open: "09:00", close: "17:00" },
      sunday: { open: "kapalı", close: "kapalı" }
    },
    rating: { average: 4.5, count: 28 },
    description: "Modern ve geniş ürün yelpazesi",
    services: ["Online Danışma", "Evde Bakım Ürünleri"],
    createdAt: new Date(),
    updatedAt: new Date()
  }
])

// Kullanıcılara eczane referansı ekleme
db.users.updateOne(
  { _id: user1Id },
  { $set: { pharmacy: pharmacy1Id } }
)

db.users.updateOne(
  { _id: user2Id },
  { $set: { pharmacy: pharmacy2Id } }
)

// 3. İlaçlar koleksiyonu
db.createCollection("medicines")

// İlaç verileri ekleme
let medicine1Id = ObjectId()
let medicine2Id = ObjectId()
let medicine3Id = ObjectId()
let medicine4Id = ObjectId()

db.medicines.insertMany([
  {
    _id: medicine1Id,
    barcode: "8699536190124",
    name: "Parol",
    genericName: "Parasetamol",
    manufacturer: "Atabay",
    activeIngredients: [
      {
        name: "Parasetamol",
        strength: "500",
        unit: "mg"
      }
    ],
    dosageForm: "tablet",
    strength: "500mg",
    packageSize: "20 tablet",
    unit: "piece",
    description: "Ağrı kesici ve ateş düşürücü",
    indications: ["Baş ağrısı", "Ateş", "Kas ağrıları"],
    contraindications: ["Karaciğer yetmezliği"],
    sideEffects: ["Nadiren alerjik reaksiyonlar"],
    dosage: "Günde 3 kez 1 tablet",
    storageConditions: "Oda sıcaklığında saklayın",
    prescriptionRequired: false,
    atcCode: "N02BE01",
    price: {
      currency: "TRY",
      amount: 25.90
    },
    categories: ["Ağrı Kesici", "Ateş Düşürücü"],
    images: [],
    expiryWarning: 30,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: medicine2Id,
    barcode: "8699536190131",
    name: "Majezik",
    genericName: "Flurbiprofen",
    manufacturer: "Sanovel",
    activeIngredients: [
      {
        name: "Flurbiprofen",
        strength: "100",
        unit: "mg"
      }
    ],
    dosageForm: "tablet",
    strength: "100mg",
    packageSize: "15 tablet",
    unit: "piece",
    description: "Ağrı kesici ve iltihap giderici",
    indications: ["Eklem ağrısı", "Kas ağrısı", "İltihaplı durumlar"],
    contraindications: ["Mide ülseri", "Hamilelik"],
    sideEffects: ["Mide rahatsızlığı", "Baş dönmesi"],
    dosage: "Günde 2 kez 1 tablet",
    storageConditions: "Oda sıcaklığında saklayın",
    prescriptionRequired: false,
    atcCode: "M01AE09",
    price: {
      currency: "TRY",
      amount: 32.50
    },
    categories: ["Ağrı Kesici", "Anti-inflamatuar"],
    images: [],
    expiryWarning: 30,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: medicine3Id,
    barcode: "8699536190148",
    name: "Aspirin",
    genericName: "Asetilsalisilik Asit",
    manufacturer: "Bayer",
    activeIngredients: [
      {
        name: "Asetilsalisilik Asit",
        strength: "500",
        unit: "mg"
      }
    ],
    dosageForm: "tablet",
    strength: "500mg",
    packageSize: "20 tablet",
    unit: "piece",
    description: "Ağrı kesici ve ateş düşürücü",
    indications: ["Baş ağrısı", "Ateş", "Kas ağrıları"],
    contraindications: ["Hamileler", "12 yaş altı"],
    sideEffects: ["Mide bulantısı", "Baş dönmesi"],
    dosage: "Günde 3 kez 1 tablet",
    storageConditions: "Oda sıcaklığında saklayın",
    prescriptionRequired: false,
    atcCode: "N02BA01",
    price: {
      currency: "TRY",
      amount: 18.75
    },
    categories: ["Ağrı Kesici", "Ateş Düşürücü"],
    images: [],
    expiryWarning: 30,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: medicine4Id,
    barcode: "8699536190155",
    name: "B12 Vitamini",
    genericName: "Siyanokobalamin",
    manufacturer: "Abdi İbrahim",
    activeIngredients: [
      {
        name: "Siyanokobalamin",
        strength: "1000",
        unit: "mcg"
      }
    ],
    dosageForm: "tablet",
    strength: "1000mcg",
    packageSize: "30 tablet",
    unit: "piece",
    description: "Vitamin takviyesi",
    indications: ["B12 eksikliği", "Sinir sistemi desteği"],
    contraindications: ["B12'ye aşırı duyarlılık"],
    sideEffects: ["Nadiren alerjik reaksiyonlar"],
    dosage: "Günde 1 tablet",
    storageConditions: "Serin ve kuru yerde saklayın",
    prescriptionRequired: false,
    atcCode: "B03BA01",
    price: {
      currency: "TRY",
      amount: 45.90
    },
    categories: ["Vitamin", "Takviye"],
    images: [],
    expiryWarning: 30,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
])

// 4. Envanter koleksiyonu
db.createCollection("inventories")

// Envanter verileri ekleme
db.inventories.insertMany([
  {
    pharmacy: pharmacy1Id,
    medicine: medicine1Id,
    quantity: 50,
    unitPrice: {
      currency: "TRY",
      amount: 25.90
    },
    costPrice: {
      currency: "TRY",
      amount: 20.50
    },
    batchNumber: "PAR2024001",
    expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 6)),
    minStockLevel: 10,
    maxStockLevel: 100,
    isAvailableForTrade: true,
    status: "in_stock",
    reservedQuantity: 0,
    availableQuantity: 50,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastRestockDate: new Date()
  },
  {
    pharmacy: pharmacy1Id,
    medicine: medicine2Id,
    quantity: 40,
    unitPrice: {
      currency: "TRY",
      amount: 32.50
    },
    costPrice: {
      currency: "TRY",
      amount: 25.80
    },
    batchNumber: "MAJ2024001",
    expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 8)),
    minStockLevel: 8,
    maxStockLevel: 80,
    isAvailableForTrade: true,
    status: "in_stock",
    reservedQuantity: 0,
    availableQuantity: 40,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastRestockDate: new Date()
  },
  {
    pharmacy: pharmacy2Id,
    medicine: medicine3Id,
    quantity: 60,
    unitPrice: {
      currency: "TRY",
      amount: 18.75
    },
    costPrice: {
      currency: "TRY",
      amount: 15.25
    },
    batchNumber: "ASP2024001",
    expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
    minStockLevel: 12,
    maxStockLevel: 120,
    isAvailableForTrade: true,
    status: "in_stock",
    reservedQuantity: 0,
    availableQuantity: 60,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastRestockDate: new Date()
  },
  {
    pharmacy: pharmacy2Id,
    medicine: medicine4Id,
    quantity: 30,
    unitPrice: {
      currency: "TRY",
      amount: 45.90
    },
    costPrice: {
      currency: "TRY",
      amount: 38.50
    },
    batchNumber: "B122024001",
    expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 12)),
    minStockLevel: 5,
    maxStockLevel: 50,
    isAvailableForTrade: true,
    status: "in_stock",
    reservedQuantity: 0,
    availableQuantity: 30,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastRestockDate: new Date()
  }
])

// 5. İşlemler koleksiyonu (eczaneler arası ilaç alışverişi)
db.createCollection("transactions")

// İşlem verisi ekleme (örnek: eczaneler arası ilaç satışı)
db.transactions.insertOne({
  transactionId: "TRX" + Date.now(),
  seller: pharmacy1Id,
  buyer: pharmacy2Id,
  items: [
    {
      medicine: medicine1Id,
      quantity: 10,
      unitPrice: {
        currency: "TRY",
        amount: 22.50  // Toptan fiyat
      },
      totalPrice: {
        currency: "TRY",
        amount: 225.00
      }
    }
  ],
  status: "completed",
  paymentMethod: "bankTransfer",
  totalAmount: {
    currency: "TRY",
    amount: 225.00
  },
  notes: "Acil ihtiyaç nedeniyle transfer",
  createdAt: new Date(),
  completedAt: new Date()
})

// 6. İlaç aramaları koleksiyonu
db.createCollection("drugsearches")

// İlaç araması verisi ekleme
db.drugsearches.insertOne({
  userId: user1Id,
  query: "aspirin",
  resultCount: 24,
  createdAt: new Date()
})

// 7. FDA veri koleksiyonları (önceki koddan alındı)
db.createCollection("drugs")
db.createCollection("drugDetails")
db.createCollection("adverseEvents")
db.createCollection("drugRecalls")

// FDA verilerini ekleme (önceki kodunuzdan)
db.drugs.insertMany([
  {
    _id: "ANDA040445",
    brandName: "ASPIRIN",
    genericName: "ASPIRIN",
    manufacturerName: "Bayer Healthcare",
    activeIngredients: ["ASPIRIN 325 mg"],
    dosageForm: "TABLET",
    route: "ORAL",
    description: "Pain reliever and fever reducer"
  },
  {
    _id: "ANDA040446",
    brandName: "PARACETAMOL",
    genericName: "ACETAMINOPHEN",
    manufacturerName: "Johnson & Johnson",
    activeIngredients: ["ACETAMINOPHEN 500 mg"],
    dosageForm: "TABLET",
    route: "ORAL",
    description: "Pain reliever and fever reducer"
  },
  {
    _id: "ANDA040447",
    brandName: "IBUPROFEN",
    genericName: "IBUPROFEN",
    manufacturerName: "Pfizer Inc.",
    activeIngredients: ["IBUPROFEN 200 mg"],
    dosageForm: "CAPSULE",
    route: "ORAL",
    description: "Nonsteroidal anti-inflammatory drug"
  }
])

// İlaç detayı ekle
db.drugDetails.insertOne({
  _id: "ANDA040445",
  brandName: "ASPIRIN",
  genericName: "ASPIRIN",
  manufacturerName: "Bayer Healthcare",
  activeIngredients: ["ASPIRIN 325 mg"],
  dosageForm: "TABLET",
  route: "ORAL",
  description: "Pain reliever and fever reducer commonly used to treat pain, reduce fever, and reduce inflammation.",
  indications: [
    "Relief of mild to moderate pain",
    "Fever reduction",
    "Anti-inflammatory treatment",
    "Prevention of blood clots"
  ],
  warnings: [
    "May cause stomach bleeding",
    "Do not use if allergic to NSAIDs",
    "Reye's syndrome warning: Children and teenagers should not use this medicine for chicken pox or flu symptoms",
    "Alcohol warning: If you consume 3 or more alcoholic drinks every day, ask your doctor about using this product"
  ],
  contraindications: [
    "Known allergy to NSAIDs",
    "History of asthma induced by aspirin",
    "Children under 12 years of age",
    "Last trimester of pregnancy"
  ],
  adverseReactions: [
    "Stomach pain",
    "Heartburn",
    "Nausea",
    "Gastrointestinal bleeding",
    "Tinnitus (ringing in ears) with high doses"
  ],
  drugInteractions: [
    "Anticoagulants (may increase risk of bleeding)",
    "Methotrexate (may increase toxicity)",
    "ACE inhibitors (may decrease effectiveness)",
    "Other NSAIDs (increased risk of side effects)"
  ],
  dosageAdministration: [
    "Adults: 1-2 tablets every 4-6 hours as needed",
    "Do not exceed 12 tablets in 24 hours",
    "Take with food or milk if stomach upset occurs",
    "For prevention of heart attack: 81-325 mg daily as directed by doctor"
  ]
})

// Yan etkiler ekle
db.adverseEvents.insertMany([
  {
    reportId: "12345678",
    receiveDate: new Date("2023-02-15"),
    seriousness: 1,
    patientAge: 65,
    patientSex: "M",
    reactions: [
      { reactionName: "GASTROINTESTINAL HEMORRHAGE", outcome: 3 }
    ],
    drugs: [
      { name: "ASPIRIN", indication: "ARTHRITIS", dosage: "325 MG, DAILY" }
    ]
  },
  {
    reportId: "87654321",
    receiveDate: new Date("2023-03-10"),
    seriousness: 2,
    patientAge: 42,
    patientSex: "F",
    reactions: [
      { reactionName: "TINNITUS", outcome: 6 },
      { reactionName: "DIZZINESS", outcome: 6 }
    ],
    drugs: [
      { name: "ASPIRIN", indication: "HEADACHE", dosage: "650 MG, TWICE DAILY" }
    ]
  }
])

// İlaç geri çağırmaları ekle
db.drugRecalls.insertMany([
  {
    recallId: "D-2345-2023",
    recallInitiationDate: new Date("2023-05-10"),
    product: "ASPIRIN 325mg TABLETS, 100 count",
    reason: "ADULTERATED - FAILED DISSOLUTION SPECIFICATIONS",
    status: "Ongoing",
    classification: "Class II",
    company: "ABC Pharmaceuticals",
    country: "United States",
    distributionPattern: "Nationwide"
  },
  {
    recallId: "D-2346-2023",
    recallInitiationDate: new Date("2023-04-12"),
    product: "ASPIRIN 81mg TABLETS, 500 count",
    reason: "MISBRANDED - INCORRECT EXPIRATION DATE",
    status: "Completed",
    classification: "Class III",
    company: "XYZ Pharmaceuticals",
    country: "United States",
    distributionPattern: "CA, NY, TX, FL"
  }
])

// İndeksler oluşturma
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ phone: 1 })
db.users.createIndex({ pharmacistId: 1 })
db.pharmacies.createIndex({ location: "2dsphere" })
db.pharmacies.createIndex({ "address.city": 1, "address.district": 1 })
db.pharmacies.createIndex({ licenseNumber: 1 }, { unique: true })
db.medicines.createIndex({ barcode: 1 }, { unique: true })
db.medicines.createIndex({ name: "text", genericName: "text" })
db.inventories.createIndex({ pharmacy: 1, medicine: 1 })
db.transactions.createIndex({ transactionId: 1 }, { unique: true })
db.drugs.createIndex({ brandName: "text", genericName: "text" })
db.adverseEvents.createIndex({ "drugs.name": 1 })
db.drugRecalls.createIndex({ product: "text" })

// İşlemlerin tamamlandığını doğrula
print("Veritabanı kurulumu tamamlandı!")
db.getCollectionNames().forEach(collection => {
  print(`${collection}: ${db[collection].countDocuments()} kayıt`)
})