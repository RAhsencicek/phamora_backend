const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Adres şeması
const AddressSchema = new Schema({
    street: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    postalCode: { type: String },
    fullAddress: { type: String }
});

// Konum şeması (GeoJSON)
const LocationSchema = new Schema({
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
});

// Çalışma saatleri şeması
const WorkingHoursSchema = new Schema({
    open: { type: String },
    close: { type: String }
});

// Puanlama şeması
const RatingSchema = new Schema({
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
});

// Eczane şeması
const PharmacySchema = new Schema({
    name: { 
        type: String, 
        required: true 
    },
    owner: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    address: { 
        type: AddressSchema, 
        required: true 
    },
    location: { 
        type: LocationSchema, 
        required: true, 
        index: '2dsphere' 
    },
    phone: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String 
    },
    licenseNumber: { 
        type: String, 
        required: true, 
        unique: true 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    isOnDuty: { 
        type: Boolean, 
        default: false 
    },
    workingHours: {
        monday: { type: WorkingHoursSchema },
        tuesday: { type: WorkingHoursSchema },
        wednesday: { type: WorkingHoursSchema },
        thursday: { type: WorkingHoursSchema },
        friday: { type: WorkingHoursSchema },
        saturday: { type: WorkingHoursSchema },
        sunday: { type: WorkingHoursSchema }
    },
    rating: { 
        type: RatingSchema, 
        default: { average: 0, count: 0 } 
    },
    description: { 
        type: String 
    },
    services: { 
        type: [String] 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Pharmacy', PharmacySchema); 