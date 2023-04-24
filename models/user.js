const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema ({
    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    messages: {
        type: Array,
        default: []
    }
});

const User = mongoose.model("User", UserSchema);

module.exports = User;