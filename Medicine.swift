import Foundation

struct Medicine: Codable, Identifiable, Hashable {
    let id: String
    let barcode: String
    let name: String
    let genericName: String?
    let manufacturer: String
    let activeIngredients: [ActiveIngredient]?
    let dosageForm: DosageForm
    let strength: String?
    let packageSize: String
    let unit: MedicineUnit
    let description: String?
    let indications: [String]?
    let contraindications: [String]?
    let sideEffects: [String]?
    let dosage: String?
    let storageConditions: String?
    let prescriptionRequired: Bool
    let atcCode: String?
    let price: Price?
    let categories: [String]?
    let images: [String]?
    let approvalDate: Date?
    let expiryWarning: Int
    let isActive: Bool
    let createdAt: Date
    let updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case barcode, name, genericName, manufacturer, activeIngredients
        case dosageForm, strength, packageSize, unit, description
        case indications, contraindications, sideEffects, dosage
        case storageConditions, prescriptionRequired, atcCode, price
        case categories, images, approvalDate, expiryWarning, isActive
        case createdAt, updatedAt
    }
    
    // Hashable conformance
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
    
    static func == (lhs: Medicine, rhs: Medicine) -> Bool {
        lhs.id == rhs.id
    }
}

struct ActiveIngredient: Codable, Hashable {
    let id: String?
    let name: String?
    let strength: String?
    let unit: String?
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case name, strength, unit
    }
}

enum DosageForm: String, Codable, CaseIterable {
    case tablet = "tablet"
    case capsule = "capsule"
    case syrup = "syrup"
    case injection = "injection"
    case cream = "cream"
    case drops = "drops"
    case inhaler = "inhaler"
    case patch = "patch"
    case suppository = "suppository"
    case other = "other"
    
    var displayName: String {
        switch self {
        case .tablet: return "Tablet"
        case .capsule: return "Kapsül"
        case .syrup: return "Şurup"
        case .injection: return "Enjeksiyonluk"
        case .cream: return "Krem"
        case .drops: return "Damla"
        case .inhaler: return "İnhaler"
        case .patch: return "Yama"
        case .suppository: return "Suppozituar"
        case .other: return "Diğer"
        }
    }
    
    var icon: String {
        switch self {
        case .tablet: return "pills"
        case .capsule: return "capsule"
        case .syrup: return "drop"
        case .injection: return "syringe"
        case .cream: return "tube"
        case .drops: return "drop.fill"
        case .inhaler: return "wind"
        case .patch: return "bandage"
        case .suppository: return "oval"
        case .other: return "cross.case"
        }
    }
}

enum MedicineUnit: String, Codable, CaseIterable {
    case piece = "piece"
    case ml = "ml"
    case mg = "mg"
    case g = "g"
    case box = "box"
    case tube = "tube"
    case bottle = "bottle"
    
    var displayName: String {
        switch self {
        case .piece: return "Adet"
        case .ml: return "ml"
        case .mg: return "mg"
        case .g: return "g"
        case .box: return "Kutu"
        case .tube: return "Tüp"
        case .bottle: return "Şişe"
        }
    }
}

struct Price: Codable, Hashable {
    let currency: String
    let amount: Double
    
    var formattedPrice: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = currency
        formatter.locale = Locale(identifier: "tr_TR")
        return formatter.string(from: NSNumber(value: amount)) ?? "\(amount) \(currency)"
    }
}

// MARK: - Sample Data
extension Medicine {
    static let sampleMedicine = Medicine(
        id: "sample123",
        barcode: "8699536190124",
        name: "Aspirin 500mg",
        genericName: "Asetilsalisilik Asit",
        manufacturer: "Bayer",
        activeIngredients: [
            ActiveIngredient(id: "ing1", name: "Asetilsalisilik Asit", strength: "500", unit: "mg")
        ],
        dosageForm: .tablet,
        strength: "500mg",
        packageSize: "20 tablet",
        unit: .piece,
        description: "Ağrı kesici ve ateş düşürücü",
        indications: ["Baş ağrısı", "Ateş", "Kas ağrıları"],
        contraindications: ["Hamileler", "12 yaş altı"],
        sideEffects: ["Mide bulantısı", "Baş dönmesi"],
        dosage: "Günde 3 kez 1 tablet",
        storageConditions: "Oda sıcaklığında saklayın",
        prescriptionRequired: false,
        atcCode: "N02BA01",
        price: Price(currency: "TRY", amount: 15.50),
        categories: ["Ağrı Kesici", "Ateş Düşürücü"],
        images: [],
        approvalDate: nil,
        expiryWarning: 30,
        isActive: true,
        createdAt: Date(),
        updatedAt: Date()
    )
} 