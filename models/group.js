const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GroupSchema = new Schema ({
    title: {
        type: String,
        required: true
    },
    rawNotes: {
        type: Array,
        default: []
    },
    polishedNotes: {
        type: Array,
        default: []
    },
    update: {
        type: Number,
        default: Date.now()
    }
});

const Group = mongoose.model("Group", GroupSchema);

module.exports = Group;