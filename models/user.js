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
            theme: "light",
            notification: "",
            oasisSort: "recent",
            privacy: "",
            misc: [],
        }
    },
    stats: {
        type: Object,
        required: true,
        default: {
            oasisCreated: 0,
            oasisDeleted: 0,
            messagesSent: 0,
            joinDate: Date.now(),
            lastLogin: Date.now(),
            loginAmount: 0,
        }
    },
    oasis: {
        type: Object,
        required: true,
        default: {
            ownOases: [],
            joinedOases: [],
            archivedOases: [],
        }
    }
});

const User = mongoose.model("User", UserSchema);

module.exports = User;