const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OasisSchema = new Schema ({
    info: {
        type: Array,
        required: true
    },
    topic: {
        type: String,
        required: true
    },
    options: {
        type: String,
        default: "format"
    },
    lastUpdate: {
        type: Number,
        default: 0
    },
    users: {
        type: Array,
        default: []
    },
    rawMessages: {
        type: Array,
        default: []
    },
    processedMessages: {
        type: Array,
        default: []
    }
});

const Oasis = mongoose.model("Oasis", OasisSchema);

module.exports = Oasis;