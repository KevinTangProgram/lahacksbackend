const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema ({
    info: {
        type: Array,
        required: true
    },
    settings: {
        type: Object,
        required: true
    },
    stats: {
        type: Array,
        required: true
    },
    oasis: {
        type: Array,
        default: []
    }
});

const User = mongoose.model("User", UserSchema);

module.exports = User;