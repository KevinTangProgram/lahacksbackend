const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema ({
    info: {
        type: Object,
        required: true,
        default: {
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
        }
    },
    settings: {
        type: Object,
        required: true,
        default: {
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
        }
    },
    stats: {
        type: Object,
        required: true,
        default: {
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
        }
    },
    oasis: {
        type: Object,
        required: true,
        default: {
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
        }
    }
});

const User = mongoose.model("User", UserSchema);

module.exports = User;