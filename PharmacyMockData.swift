import Foundation
import MapKit

// Models are imported from the same module automatically

/// Mock data for pharmacies used in development and testing
/// This structure matches the backend API response format for easy migration
struct PharmacyMockData {
    
    /// Sample pharmacies for Elazığ city center
    /// TODO: Replace with real API data from backend
    static let pharmacies: [Pharmacy] = [
        // Original pharmacies
        Pharmacy(
            name: "Merkez Eczanesi",
            address: "Çarşı Mah. Gazi Cad. No:84, Merkez/Elazığ",
            phone: "0424 218 1001",
            coordinate: CLLocationCoordinate2D(latitude: 38.6741, longitude: 39.2237),
            availableMedications: [
                Medication(name: "Parol", description: "Ağrı kesici", price: 25.90, quantity: 10, expiryDate: Calendar.current.date(byAdding: .month, value: 6, to: Date()), imageURL: nil, status: .forSale),
                Medication(name: "Majezik", description: "Ağrı kesici", price: 32.50, quantity: 15, expiryDate: Calendar.current.date(byAdding: .month, value: 8, to: Date()), imageURL: nil, status: .forSale)
            ]
        ),
        Pharmacy(
            name: "Fırat Eczanesi",
            address: "İzzetpaşa Mah. Şehit Polis M.Fevzi Yalçın Cad. No:14/C, Merkez/Elazığ",
            phone: "0424 237 8787",
            coordinate: CLLocationCoordinate2D(latitude: 38.6828, longitude: 39.2058),
            availableMedications: [
                Medication(name: "Aspirin", description: "Ağrı kesici", price: 18.75, quantity: 20, expiryDate: Calendar.current.date(byAdding: .month, value: 3, to: Date()), imageURL: nil, status: .forSale),
                Medication(name: "B12 Vitamini", description: "Vitamin takviyesi", price: 45.90, quantity: 8, expiryDate: Calendar.current.date(byAdding: .month, value: 12, to: Date()), imageURL: nil, status: .available)
            ]
        ),
        Pharmacy(
            name: "Yıldız Eczanesi",
            address: "Rızaiye Mah. Şehit Polis Ali Gaffar Okkan Cad. No:38/A, Merkez/Elazığ",
            phone: "0424 238 3434",
            coordinate: CLLocationCoordinate2D(latitude: 38.6956, longitude: 39.2356),
            availableMedications: [
                Medication(name: "Augmentin", description: "Antibiyotik", price: 65.30, quantity: 5, expiryDate: Calendar.current.date(byAdding: .month, value: 2, to: Date()), imageURL: nil, status: .forSale),
                Medication(name: "Zinc", description: "Mineral takviyesi", price: 38.25, quantity: 12, expiryDate: Calendar.current.date(byAdding: .month, value: 10, to: Date()), imageURL: nil, status: .available)
            ]
        ),
        Pharmacy(
            name: "Sağlık Eczanesi",
            address: "Cumhuriyet Mah. Malatya Cad. No:78/B, Merkez/Elazığ",
            phone: "0424 233 1212",
            coordinate: CLLocationCoordinate2D(latitude: 38.6634, longitude: 39.2311),
            availableMedications: []
        ),
        Pharmacy(
            name: "Şifa Eczanesi",
            address: "Olgunlar Mah. Gazi Cad. No:132/A, Merkez/Elazığ",
            phone: "0424 218 5656",
            coordinate: CLLocationCoordinate2D(latitude: 38.6547, longitude: 39.2142),
            availableMedications: []
        ),
        
        // Additional 20 pharmacies
        Pharmacy(
            name: "Doğan Eczanesi",
            address: "Mustafapaşa Mah. Hürriyet Cad. No:45, Merkez/Elazığ",
            phone: "0424 212 3456",
            coordinate: CLLocationCoordinate2D(latitude: 38.6980, longitude: 39.2490),
            availableMedications: [
                Medication(name: "Panadol", description: "Ateş düşürücü", price: 22.50, quantity: 25, expiryDate: Calendar.current.date(byAdding: .month, value: 4, to: Date()), imageURL: nil, status: .forSale),
                Medication(name: "Voltaren", description: "Kas ağrısı", price: 28.90, quantity: 12, expiryDate: Calendar.current.date(byAdding: .month, value: 7, to: Date()), imageURL: nil, status: .available)
            ]
        ),
        Pharmacy(
            name: "Güven Eczanesi",
            address: "Atatürk Bulvarı No:156/B, Merkez/Elazığ",
            phone: "0424 224 7890",
            coordinate: CLLocationCoordinate2D(latitude: 38.6495, longitude: 39.1980),
            availableMedications: [
                Medication(name: "Nexium", description: "Mide koruyucu", price: 78.40, quantity: 8, expiryDate: Calendar.current.date(byAdding: .month, value: 5, to: Date()), imageURL: nil, status: .forSale)
            ]
        ),
        Pharmacy(
            name: "Umut Eczanesi",
            address: "Kültür Mah. Eğitim Cad. No:67, Merkez/Elazığ",
            phone: "0424 235 4567",
            coordinate: CLLocationCoordinate2D(latitude: 38.7020, longitude: 39.2110),
            availableMedications: [
                Medication(name: "Calpol", description: "Çocuk ateş düşürücü", price: 19.75, quantity: 18, expiryDate: Calendar.current.date(byAdding: .month, value: 6, to: Date()), imageURL: nil, status: .available),
                Medication(name: "Probiyotik", description: "Bağırsak sağlığı", price: 55.60, quantity: 7, expiryDate: Calendar.current.date(byAdding: .month, value: 8, to: Date()), imageURL: nil, status: .forSale)
            ]
        ),
        Pharmacy(
            name: "Asya Eczanesi",
            address: "Nailbey Mah. Sanat Cad. No:89/A, Merkez/Elazığ",
            phone: "0424 218 9012",
            coordinate: CLLocationCoordinate2D(latitude: 38.6510, longitude: 39.2350),
            availableMedications: [
                Medication(name: "Omega-3", description: "Beyin sağlığı takviyesi", price: 42.30, quantity: 15, expiryDate: Calendar.current.date(byAdding: .month, value: 11, to: Date()), imageURL: nil, status: .available)
            ]
        ),
        Pharmacy(
            name: "Barış Eczanesi",
            address: "Yeni Mah. Barış Cad. No:23/C, Merkez/Elazığ",
            phone: "0424 241 5678",
            coordinate: CLLocationCoordinate2D(latitude: 38.6860, longitude: 39.1900),
            availableMedications: []
        ),
        Pharmacy(
            name: "Modern Eczanesi",
            address: "Çaydaçıra Mah. Yeşil Cad. No:34, Merkez/Elazığ",
            phone: "0424 225 6789",
            coordinate: CLLocationCoordinate2D(latitude: 38.6885, longitude: 39.2575),
            availableMedications: [
                Medication(name: "Brufen", description: "Ağrı ve ateş kesici", price: 26.80, quantity: 22, expiryDate: Calendar.current.date(byAdding: .month, value: 5, to: Date()), imageURL: nil, status: .forSale),
                Medication(name: "Vitamin D3", description: "Kemik sağlığı", price: 35.50, quantity: 9, expiryDate: Calendar.current.date(byAdding: .month, value: 14, to: Date()), imageURL: nil, status: .available)
            ]
        ),
        Pharmacy(
            name: "Kardelen Eczanesi",
            address: "Aksaray Mah. Doktor Cad. No:78/D, Merkez/Elazığ",
            phone: "0424 236 7890",
            coordinate: CLLocationCoordinate2D(latitude: 38.6530, longitude: 39.2260),
            availableMedications: [
                Medication(name: "Sinecod", description: "Öksürük şurubu", price: 31.20, quantity: 14, expiryDate: Calendar.current.date(byAdding: .month, value: 3, to: Date()), imageURL: nil, status: .forSale)
            ]
        ),
        Pharmacy(
            name: "Sevgi Eczanesi",
            address: "Sürsürü Mah. Vatan Cad. No:45/A, Merkez/Elazığ",
            phone: "0424 219 8901",
            coordinate: CLLocationCoordinate2D(latitude: 38.6490, longitude: 39.2520),
            availableMedications: [
                Medication(name: "Magnezyum", description: "Mineral takviyesi", price: 29.90, quantity: 16, expiryDate: Calendar.current.date(byAdding: .month, value: 9, to: Date()), imageURL: nil, status: .available),
                Medication(name: "Coenzyme Q10", description: "Kalp sağlığı", price: 67.80, quantity: 6, expiryDate: Calendar.current.date(byAdding: .month, value: 10, to: Date()), imageURL: nil, status: .forSale)
            ]
        ),
        Pharmacy(
            name: "Türkiye Eczanesi",
            address: "Ulukent Mah. Cumhuriyet Cad. No:112, Merkez/Elazığ",
            phone: "0424 242 9012",
            coordinate: CLLocationCoordinate2D(latitude: 38.7000, longitude: 39.2150),
            availableMedications: [
                Medication(name: "Losec", description: "Reflü ilacı", price: 89.50, quantity: 4, expiryDate: Calendar.current.date(byAdding: .month, value: 2, to: Date()), imageURL: nil, status: .forSale)
            ]
        ),
        Pharmacy(
            name: "Nil Eczanesi",
            address: "Karsıyaka Mah. Nil Cad. No:67/B, Merkez/Elazığ",
            phone: "0424 227 0123",
            coordinate: CLLocationCoordinate2D(latitude: 38.6620, longitude: 39.2500),
            availableMedications: []
        ),
        Pharmacy(
            name: "Anadolu Eczanesi",
            address: "Fevzipaşa Mah. Anadolu Cad. No:89, Merkez/Elazığ",
            phone: "0424 238 1234",
            coordinate: CLLocationCoordinate2D(latitude: 38.6950, longitude: 39.1990),
            availableMedications: [
                Medication(name: "Iron", description: "Demir takviyesi", price: 24.70, quantity: 20, expiryDate: Calendar.current.date(byAdding: .month, value: 7, to: Date()), imageURL: nil, status: .available),
                Medication(name: "Kalsiyum", description: "Kemik sağlığı", price: 33.40, quantity: 11, expiryDate: Calendar.current.date(byAdding: .month, value: 12, to: Date()), imageURL: nil, status: .forSale)
            ]
        ),
        Pharmacy(
            name: "Marmara Eczanesi",
            address: "Hilalkent Mah. Marmara Cad. No:34/C, Merkez/Elazığ",
            phone: "0424 244 2345",
            coordinate: CLLocationCoordinate2D(latitude: 38.6970, longitude: 39.2380),
            availableMedications: [
                Medication(name: "Lyrica", description: "Sinir ağrısı", price: 156.20, quantity: 3, expiryDate: Calendar.current.date(byAdding: .month, value: 4, to: Date()), imageURL: nil, status: .forSale)
            ]
        ),
        Pharmacy(
            name: "Çiçek Eczanesi",
            address: "Abdullahpaşa Mah. Çiçek Sok. No:12/A, Merkez/Elazığ",
            phone: "0424 221 3456",
            coordinate: CLLocationCoordinate2D(latitude: 38.6465, longitude: 39.2035),
            availableMedications: [
                Medication(name: "Folic Acid", description: "Folik asit", price: 18.50, quantity: 25, expiryDate: Calendar.current.date(byAdding: .month, value: 8, to: Date()), imageURL: nil, status: .available)
            ]
        ),
        Pharmacy(
            name: "Gülhan Eczanesi",
            address: "İcadiye Mah. Gülhan Cad. No:56/B, Merkez/Elazığ",
            phone: "0424 233 4567",
            coordinate: CLLocationCoordinate2D(latitude: 38.7010, longitude: 39.2265),
            availableMedications: [
                Medication(name: "Concor", description: "Kalp ilacı", price: 94.30, quantity: 5, expiryDate: Calendar.current.date(byAdding: .month, value: 6, to: Date()), imageURL: nil, status: .forSale),
                Medication(name: "Glucosamine", description: "Eklem sağlığı", price: 48.90, quantity: 8, expiryDate: Calendar.current.date(byAdding: .month, value: 10, to: Date()), imageURL: nil, status: .available)
            ]
        ),
        Pharmacy(
            name: "Gözde Eczanesi",
            address: "Esentepe Mah. Gözde Cad. No:78/A, Merkez/Elazığ",
            phone: "0424 245 5678",
            coordinate: CLLocationCoordinate2D(latitude: 38.6525, longitude: 39.2420),
            availableMedications: []
        ),
        Pharmacy(
            name: "Prestij Eczanesi",
            address: "Aksaray Mah. Prestij Cad. No:91/C, Merkez/Elazığ",
            phone: "0424 226 6789",
            coordinate: CLLocationCoordinate2D(latitude: 38.6895, longitude: 39.1885),
            availableMedications: [
                Medication(name: "Sertraline", description: "Antidepresan", price: 87.60, quantity: 7, expiryDate: Calendar.current.date(byAdding: .month, value: 5, to: Date()), imageURL: nil, status: .forSale)
            ]
        ),
        Pharmacy(
            name: "Huzur Eczanesi",
            address: "Güneykent Mah. Huzur Sok. No:23/B, Merkez/Elazığ",
            phone: "0424 239 7890",
            coordinate: CLLocationCoordinate2D(latitude: 38.6645, longitude: 39.2055),
            availableMedications: [
                Medication(name: "Melatonin", description: "Uyku düzenleyici", price: 39.80, quantity: 13, expiryDate: Calendar.current.date(byAdding: .month, value: 9, to: Date()), imageURL: nil, status: .available),
                Medication(name: "Centrum", description: "Multivitamin", price: 76.50, quantity: 6, expiryDate: Calendar.current.date(byAdding: .month, value: 11, to: Date()), imageURL: nil, status: .forSale)
            ]
        ),
        Pharmacy(
            name: "Sena Eczanesi",
            address: "Çarşı Mah. Sena Cad. No:45/D, Merkez/Elazığ",
            phone: "0424 217 8901",
            coordinate: CLLocationCoordinate2D(latitude: 38.6515, longitude: 39.2335),
            availableMedications: [
                Medication(name: "Symbicort", description: "Astım ilacı", price: 198.70, quantity: 2, expiryDate: Calendar.current.date(byAdding: .month, value: 3, to: Date()), imageURL: nil, status: .forSale)
            ]
        ),
        Pharmacy(
            name: "Atlas Eczanesi",
            address: "Doğukent Mah. Atlas Cad. No:67/A, Merkez/Elazığ",
            phone: "0424 240 9012",
            coordinate: CLLocationCoordinate2D(latitude: 38.6975, longitude: 39.2595),
            availableMedications: [
                Medication(name: "Atorvastatin", description: "Kolesterol düşürücü", price: 112.40, quantity: 4, expiryDate: Calendar.current.date(byAdding: .month, value: 7, to: Date()), imageURL: nil, status: .forSale),
                Medication(name: "Fish Oil", description: "Balık yağı", price: 52.30, quantity: 10, expiryDate: Calendar.current.date(byAdding: .month, value: 13, to: Date()), imageURL: nil, status: .available)
            ]
        ),
        Pharmacy(
            name: "Yeni Yaşam Eczanesi",
            address: "Güvenlik Mah. Yaşam Cad. No:89/B, Merkez/Elazığ",
            phone: "0424 228 0123",
            coordinate: CLLocationCoordinate2D(latitude: 38.6455, longitude: 39.2070),
            availableMedications: [
                Medication(name: "Probiyotik Plus", description: "Gelişmiş probiyotik", price: 67.90, quantity: 9, expiryDate: Calendar.current.date(byAdding: .month, value: 8, to: Date()), imageURL: nil, status: .available)
            ]
        )
    ]
    
    /// Get pharmacy by name for testing purposes
    static func pharmacy(named name: String) -> Pharmacy? {
        return pharmacies.first { $0.name == name }
    }
    
    /// Get pharmacies within a specific region
    static func pharmacies(in region: MKCoordinateRegion) -> [Pharmacy] {
        return pharmacies.filter { pharmacy in
            let latDiff = abs(pharmacy.coordinate.latitude - region.center.latitude)
            let lonDiff = abs(pharmacy.coordinate.longitude - region.center.longitude)
            return latDiff <= region.span.latitudeDelta/2 && lonDiff <= region.span.longitudeDelta/2
        }
    }
    
    /// Get pharmacies that have available medications
    static var pharmaciesWithMedications: [Pharmacy] {
        return pharmacies.filter { !$0.availableMedications.isEmpty }
    }
} 