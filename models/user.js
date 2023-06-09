const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UInfoSchema = new Schema ({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
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
        type: Array,
        default: []
    },
    joinedOases: {
        type: Array,
        default: []
    },
    archivedOases: {
        type: Array,
        default: []
    }
}, { _id: false })
const UTokenSchema = new Schema({
    ID: {
        type: String,
        required: true
    },
    key: {
        type: String,
        required: true
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
    ID: {
        type: String,
        required: true,
    }
});
const User = mongoose.model("User", UserSchema);
module.exports = User;