import Foundation

// Mock data for previews and testing
struct FDAMockData {
    // Sample drugs for search results
    static let sampleDrugs: [Drug] = [
        Drug(
            id: "ANDA040445",
            brandName: "ASPIRIN",
            genericName: "ASPIRIN",
            manufacturerName: "Bayer Healthcare",
            activeIngredients: ["ASPIRIN 325 mg"],
            dosageForm: "TABLET",
            route: "ORAL",
            description: "Pain reliever and fever reducer"
        ),
        Drug(
            id: "ANDA040446",
            brandName: "PARACETAMOL",
            genericName: "ACETAMINOPHEN",
            manufacturerName: "Johnson & Johnson",
            activeIngredients: ["ACETAMINOPHEN 500 mg"],
            dosageForm: "TABLET",
            route: "ORAL",
            description: "Pain reliever and fever reducer"
        ),
        Drug(
            id: "ANDA040447",
            brandName: "IBUPROFEN",
            genericName: "IBUPROFEN",
            manufacturerName: "Pfizer Inc.",
            activeIngredients: ["IBUPROFEN 200 mg"],
            dosageForm: "CAPSULE",
            route: "ORAL",
            description: "Nonsteroidal anti-inflammatory drug"
        )
    ]
    
    // Sample drug detail
    static let sampleDrugDetail = DrugDetail(
        id: "ANDA040445",
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
    )
    
    // Sample adverse events
    static let sampleAdverseEvents: [AdverseEvent] = [
        AdverseEvent(
            reportId: "12345678",
            receiveDate: "20230215",
            seriousness: "1",
            patientAge: "65",
            patientSex: "M",
            reactions: [
                Reaction(reactionName: "GASTROINTESTINAL HEMORRHAGE", outcome: "3")
            ],
            drugs: [
                EventDrug(name: "ASPIRIN", indication: "ARTHRITIS", dosage: "325 MG, DAILY")
            ]
        ),
        AdverseEvent(
            reportId: "87654321",
            receiveDate: "20230310",
            seriousness: "2",
            patientAge: "42",
            patientSex: "F",
            reactions: [
                Reaction(reactionName: "TINNITUS", outcome: "6"),
                Reaction(reactionName: "DIZZINESS", outcome: "6")
            ],
            drugs: [
                EventDrug(name: "ASPIRIN", indication: "HEADACHE", dosage: "650 MG, TWICE DAILY")
            ]
        )
    ]
    
    // Sample drug recalls
    static let sampleDrugRecalls: [DrugRecall] = [
        DrugRecall(
            recallId: "D-2345-2023",
            recallInitiationDate: "20230510",
            product: "ASPIRIN 325mg TABLETS, 100 count",
            reason: "ADULTERATED - FAILED DISSOLUTION SPECIFICATIONS",
            status: "Ongoing",
            classification: "Class II",
            company: "ABC Pharmaceuticals",
            country: "United States",
            distributionPattern: "Nationwide"
        ),
        DrugRecall(
            recallId: "D-2346-2023",
            recallInitiationDate: "20230412",
            product: "ASPIRIN 81mg TABLETS, 500 count",
            reason: "MISBRANDED - INCORRECT EXPIRATION DATE",
            status: "Completed",
            classification: "Class III",
            company: "XYZ Pharmaceuticals",
            country: "United States",
            distributionPattern: "CA, NY, TX, FL"
        )
    ]
    
    // Mock responses
    static func mockDrugSearchResponse() -> DrugSearchResponse {
        return DrugSearchResponse(success: true, total: sampleDrugs.count, drugs: sampleDrugs)
    }
    
    static func mockDrugDetailResponse() -> DrugDetailResponse {
        return DrugDetailResponse(success: true, drug: sampleDrugDetail)
    }
    
    static func mockAdverseEventResponse() -> AdverseEventResponse {
        return AdverseEventResponse(success: true, total: sampleAdverseEvents.count, events: sampleAdverseEvents)
    }
    
    static func mockDrugRecallResponse() -> DrugRecallResponse {
        return DrugRecallResponse(success: true, total: sampleDrugRecalls.count, recalls: sampleDrugRecalls)
    }
}

// Extension to OpenFDAService for preview support
extension OpenFDAService {
    static func mockService() -> OpenFDAService {
        let service = OpenFDAService()
        return service
    }
} 