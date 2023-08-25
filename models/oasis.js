const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OInfoSchema = new Schema ({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ""
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
}, { _id: false })
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
        default: Date.now
    },
    lastViewDate: {
        type: Number,
        default: Date.now
    },
    lastEditDate: {
        type: Number,
        default: Date.now
    },
    archiveDate: {
        type: Number,
        default: null
    }
}, { _id: false })
const OStatsSchema = new Schema({
    size: {
        type: OSizeSchema,
        required: true,
        default: {}
    },
    state: {
        type: OStateSchema,
        required: true,
        default: {}
    }
}, { _id: false })
const OUsersSchema = new Schema({
    owner: {
        type: Schema.Types.ObjectId,
        required: true
    },
    editors: {
        type: [Schema.Types.ObjectId],
        default: []
    },
    viewers: {
        type: [Schema.Types.ObjectId],
        default: []
    }
}, { _id: false })
const ORawMessageSchema = new Schema({
    UUID: {
        type: Schema.Types.UUID,
        required: true
    },
    Timestamp: {
        type: Number,
        default: Date.now
    },
    Sender: {
        type: Schema.Types.ObjectId,
        required: true
    },
    Content: {
        type: String,
        required: true
    }
}, { _id: false })
const OProcessedMessageSchema = new Schema({
    UUID: {
        type: Schema.Types.UUID,
        required: true
    },
    Marker: {
        type: String,
        required: true
    },
    RawUUID: {
        type: Schema.Types.UUID,
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
        default: {}
    },
    settings: {
        type: OSettingsSchema,
        required: true,
        default: {}
    },
    stats: {
        type: OStatsSchema,
        required: true,
        default: {}
    },
    users: {
        type: OUsersSchema,
        required: true,
        default: {}
    },
    content: {
        type: OContentSchema,
        required: true,
        default: {}
    },
});
const Oasis = mongoose.model("Oasis", OasisSchema);
module.exports = Oasis;