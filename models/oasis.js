const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OInfoSchema = new Schema ({
    default: {
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
    }
})
const OSettingsSchema = new Schema ({
    default: {
        generationOptions: {
            generateRecent: true,
            startIndex: 0,
            endIndex: 0,
            topic: null,
            mode: 1,
            generateHeaders: false,
            useBulletFormat: false
        },
        sharing: "private",
        misc: []
    }
})

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
        type: Object,
        required: true,
        default: {
            size: {
                type: Object,
                default: {
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
                }
            },
            state: {
                type: Object,
                default: {
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
                    },
                }
            }
        }
    },
    users: {
        type: Object,
        default: {
            owner: {
                type: Schema.Types.ObjectId,
                // COME BACK
                required: true
            },
            
        }
    },
    content: {
        type: Array,
        default: []
    }
});

const Oasis = mongoose.model("Oasis", OasisSchema);

module.exports = Oasis;