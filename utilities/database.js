// Setup:
const User = require("../models/user");
const Oasis = require("../models/oasis");
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

// Functions:
const dependencyFuncs = {};
    // Current runtime-registered dependencies are:
    // addOasisToUser (oasis.js), removeOasisFromUser (user.js), deleteOasesOfUser (user.js).
function registerDependency(funcName, func) {
    dependencyFuncs[funcName] = func;
}
function getDependency(funcName) {
    return dependencyFuncs[funcName];
}

// Exports:
module.exports = { User, Oasis, ObjectId, registerDependency, getDependency };