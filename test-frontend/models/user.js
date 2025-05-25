const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Adres şeması
const AddressSchema = new Schema({
    street: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    postalCode: { type: String }
});

// Konum şeması (GeoJSON)
const LocationSchema = new Schema({
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
});

// Kullanıcı şeması
const UserSchema = new Schema({
    pharmacistId: { 
        type: String, 
        required: true, 
        unique: true 
    },
    name: { 
        type: String, 
        required: true 
    },
    surname: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true 
    },
    phone: { 
        type: String, 
        required: true 
    },
    passwordHash: { 
        type: String, 
        required: true 
    },
    role: { 
        type: String, 
        enum: ['pharmacist', 'admin'], 
        default: 'pharmacist' 
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
    pharmacy: { 
        type: Schema.Types.ObjectId, 
        ref: 'Pharmacy' 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    twoFactorEnabled: { 
        type: Boolean, 
        default: false 
    }
});

module.exports = mongoose.model('User', UserSchema); 