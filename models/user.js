const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UInfoSchema = new Schema ({
    username: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        unique: true
    }
}, { _id: false })
const USettingsSchema = new Schema ({
    theme: {
        type: String,
        default: "default"
    },
    notification: {
        type: String,
        default: null
    },
    oasisSort: {
        type: String,
        default: "recent"
    },
    privacy: {
        type: String,
        default: null
    },
    misc: {
        type: Array,
        default: []
    }
}, { _id: false })
const UStatsSchema = new Schema ({
    oasisCreated: {
        type: Number,
        default: 0
    },
    oasisDeleted: {
        type: Number,
        default: 0
    },
    messagesSent: {
        type: Number,
        default: 0
    },
    joinDate: {
        type: Number,
        default: Date.now()
    },
    lastLogin: {
        type: Number,
        default: Date.now()
    },
    loginAmount: {
        type: Number,
        default: 0
    }
}, { _id: false })
const UOasisSchema = new Schema({
    ownOases: {
        type: [Schema.Types.ObjectId],
        default: []
    },
    joinedOases: {
        type: [Schema.Types.ObjectId],
        default: []
    },
    archivedOases: {
        type: [Schema.Types.ObjectId],
        default: []
    }
}, { _id: false })

// USER:
const UserSchema = new Schema ({
    info: {
        type: UInfoSchema,
        required: true,
        default: {}
    },
    settings: {
        type: USettingsSchema,
        required: true,
        default: {}
    },
    stats: {
        type: UStatsSchema,
        required: true,
        default: {}
    },
    oasis: {
        type: UOasisSchema,
        required: true,
        default: {}
    },
});
const User = mongoose.model("User", UserSchema);
module.exports = User;