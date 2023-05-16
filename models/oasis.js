const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OInfoSchema = new Schema ({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    misc: {
        type: Array,
        default: []
    }
}, { _id: false })
const OSettingsSchema = new Schema ({
    generationOptions: {
        type: Object,
        default: {
            generateRecent: true,
            startIndex: 0,
            endIndex: 0,
            topic: null,
            mode: 1,
            generateHeaders: false,
            useBulletFormat: false
        }
    },
    sharing: {
        type: String,
        default: "private"
    },
    misc: {
        type: Array,
        default: []
    }
})
const OSizeSchema = new Schema({
    ideaCount: {
        type: Number,
        default: 0
    },
    ideaWordCount: {
        type: Number,
        default: 0
    },
    noteCount: {
        type: Number,
        default: 0
    },
    noteWordCount: {
        type: Number,
        default: 0
    }
}, { _id: false })
const OStateSchema = new Schema({
    currentState: {
        type: String,
        default: "active"
    },
    createDate: {
        type: Number,
        default: Date.now()
    },
    lastEditDate: {
        type: Number,
        default: Date.now()
    },
    archiveDate: {
        type: Number,
        default: null
    }
}, { _id: false })
const OStatsSchema = new Schema({
    size: {
        type: OSizeSchema,
        required: true
    },
    state: {
        type: OStateSchema,
        required: true
    }
}, { _id: false })
const OUsersSchema = new Schema({
    owner: {
        type: Schema.Types.ObjectId,
        ref: owner,
        required: true
    },
    editors: {
        type: Array,
        ref: editor,
        default: []
    },
    viewers: {
        type: Array,
        ref: viewer,
        default: []
    }
}, { _id: false })
const ORawMessageSchema = new Schema({
    UUID: {
        type: Number,
        required: true
    },
    Timestamp: {
        type: Number,
        default: Date.now()
    },
    Sender: {
        type: Schema.Types.ObjectId,
        ref: owner,
        required: true
    },
    Content: {
        type: String,
        required: true
    }
}, { _id: false })
const OProcessedMessageSchema = new Schema({
    UUID: {
        type: Number,
        required: true
    },
    Marker: {
        type: String,
        required: true
    },
    RawUUID: {
        type: Number,
        ref: originalMessage,
    },
    Content: {
        type: String,
        required: true
    }
}, { _id: false })
const OContentSchema = new Schema({
    lastGenerationIndex: {
        type: Number,
        default: 0
    },
    rawMessages: {
        type: [ORawMessageSchema],
        default: []
    },
    processedMessages: {
        type: [OProcessedMessageSchema],
        default: []
    }
}, { _id: false })

const OasisSchema = new Schema ({
    info: {
        type: OInfoSchema,
        required: true,
    },
    settings: {
        type: OSettingsSchema,
        required: true
    },
    stats: {
        type: OStatsSchema,
        required: true,
    },
    users: {
        type: OUsersSchema,
        required: true,
    },
    content: {
        type: OContentSchema,
        required: true
    }
});
const Oasis = mongoose.model("Oasis", OasisSchema);
module.exports = Oasis;