// Setup:
const User = require("../models/user");
const Oasis = require("../models/oasis");
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

// Endpoints:


// Exports:
module.exports = { User, Oasis, ObjectId };