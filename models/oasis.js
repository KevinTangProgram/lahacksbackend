const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OasisSchema = new Schema ({
    info: {
        type: Object,
        required: true,
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
    },
    settings: {
        type: Object,
        required: true,
        default: {
            generationOptions: {
                type: Object,
                default: {
                    generateRecent: {
                        type: Boolean,
                        default: true
                    },
                    startIndex: {
                        type: Number,
                        default: 0
                    },
                    endIndex: {
                        type: Number,
                        default: 0
                    },
                    topic: {
                        type: String,
                        default: null
                    },
                    mode: {
                        type: Number,
                        default: 0
                    },
                    generateHeaders: {
                        type: Boolean,
                        default: false
                    },
                    useBulletFormat: {
                        type: Boolean,
                        default: false
                    }
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
        }
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
                        type: Date,
                        default: Date.now()
                    },
                    lastEditDate: {
                        type: Date,
                        default: Date.now()
                    },
                    archiveDate: {
                        type: Date,
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
                type: Number,
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