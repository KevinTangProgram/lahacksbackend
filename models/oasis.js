const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OasisSchema = new Schema ({
    info: {
        type: Array,
        required: true
    },
    settings: {
        type: Array,
        required: true
    },
    stats: {
        type: Array,
        required: true
    },
    users: {
        type: Array,
        default: []
    },
    content: {
        type: Array,
        default: []
    }
});

const Oasis = mongoose.model("Oasis", OasisSchema);

module.exports = Oasis;