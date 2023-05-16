const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UInfoSchema = new Schema ({
    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        default: ""
    }
}, { _id: false })
const USettingsSchema = new Schema ({
    theme: {
        type: String,
        default: "light"
    },
    notification: {
        type: String,
        default: ""
    },
    oasisSort: {
        type: String,
        default: "recent"
    },
    privacy: {
        type: String,
        default: ""
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

// USER:
const UserSchema = new Schema ({
    info: {
        type: UInfoSchema,
        required: true,
    },
    // settings: {
    //     type: USettingsSchema,
    //     required: true,
    // },
    stats: {
        type: UStatsSchema,
        required: true,
    },
    // oasis: {
    //     type: UOasisSchema,
    //     required: true,
    // }
});
const User = mongoose.model("User", UserSchema);
module.exports = User;