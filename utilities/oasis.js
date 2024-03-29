// Boilerplate:
const express = require('express');
const oasis = express.Router();

// Setup:
const { validateUser, addOasisToUser, removeOasisFromUser } = require('./authenticator.js');
const { Oasis, ObjectId, registerDependency } = require('./database.js');
const NodeCache = require("node-cache");
const oasisDataCache = new NodeCache({ stdTTL: 120, useClones: false }); // oasis editing: store data for 2 minutes.

// Consts:
const MAX_OASIS_COUNT = 25;

// Endpoints:
oasis.get('/homeView', async (req, res) => {
    // Validate user:
    const existingUser = await validateUser(req.query.token, true);
    if (!existingUser) {
        res.status(400).json({ error: "Unable to validate user - please log in again." });
        return;
    }
    // Find IDs of oases:
    let oasisIDs = [];
    if (req.query.type === "all") {
        oasisIDs = existingUser.oasis.ownOases.concat(existingUser.oasis.joinedOases);
    } 
    else if (req.query.type === "own") {
        oasisIDs = existingUser.oasis.ownOases;
    }
    else if (req.query.type === "archived") {
        oasisIDs = existingUser.oasis.archivedOases;
    }
    // Grab oases summaries (exclude content and users):
    const oasesSummaries = await Oasis.find({ _id: { $in: oasisIDs } }, { users: 0, content: 0 });
    // Return user info:
    res.json(oasesSummaries);
})
oasis.get('/access', async (req, res) => {
    // Validate this action:
    try {
        const oasis = await validateOasis(req.query.UUID, req.query.token, "view");
        oasis.stats.state.lastViewDate = Date.now();
        await oasis.save();
        res.json(oasis);
    }
    catch (error) {
        res.status(400).json({ error: error });
        return;
    }
})
oasis.post('/createOasis', async (req, res) => {
    // Validate user:
    const existingUser = await validateUser(req.body.token);
    if (!existingUser) {
        res.status(400).json({ error: "Unable to validate user - please log in again." });
        return;
    }
    // Check oasis count:
    if (existingUser.oasis.ownOases.length >= MAX_OASIS_COUNT) {
        res.status(400).json({ error: "We're sorry - only " + MAX_OASIS_COUNT + " synced oases are allowed per user." });
        return;
    }
    // Create oasisData:
    const oasisData = {
        info: {
            title: req.body.title,
            description: (req.body.description) ? req.body.description : ""
        }
    }
    // Create oasis, return ID:
    try {
        const newOasis = await createOasis(existingUser, oasisData);
        res.json({ ID: newOasis._id });
    }
    catch (error) {
        res.status(400).json({ error: error });
        return;
    }
})
oasis.post('/deleteOasis', async (req, res) => {
    // Validate this action:
    try {
        const oasis = await validateOasis(req.body.UUID, req.body.token, "delete");
        // Delete oasis:
        await deleteOasisFromUser(oasis._id, req.body.token);
        res.json(0);
    }
    catch (error) {
        res.status(400).json({ error: error });
        return;
    }
})
oasis.post('/syncLocalOases', async (req, res) => {
    // Validate user:
    const existingUser = await validateUser(req.body.token);
    if (!existingUser) {
        res.status(400).json({ error: "Unable to validate user - please log in again." });
        return;
    }
    // Check oasis count:
    if (existingUser.oasis.ownOases.length + req.body.localOases.length >= MAX_OASIS_COUNT) {
        res.status(400).json({ error: "We're sorry - only " + MAX_OASIS_COUNT + " synced oases are allowed per user." });
        return;
    }
    // Call createOasis for each oasis:
    let numSynced = 0;
    let errorOases = {};
    for (let i = 0; i < req.body.localOases.length; i++) {
        try {
            await createOasis(existingUser, req.body.localOases[i]);
            numSynced++;
        }
        catch (error) {
            errorOases[req.body.localOases[i]._id] = error;
        }
    }
    res.json({ numSynced: numSynced, errorOases: errorOases });
})
oasis.post('/getTemplateOasis', async (req, res) => {
    // Sanitize input:
    if (validateInput("title", req.body.title) !== true) {
        res.status(400).json({ error: validateInput("title", req.query.title) });
        return;
    }
    if (validateInput("description", req.body.description) !== true) {
        res.status(400).json({ error: validateInput("description", req.query.description) });
        return;
    }
    // Create template oasis:
    const ID = new ObjectId();
    const newOasis = new Oasis({
        info: {
            title: req.body.title,
            description: req.body.description
        },
        settings: {
            sharing: "local"
        },
        users: { owner: null },
        _id: ID
    });
    // Return oasis:
    res.json(newOasis);
})
oasis.post('/push', async (req, res) => {   
    // Validate this action:
    try {
        const oasis = await validateOasis(req.body.UUID, req.body.token, "edit");
        await updateOasis(oasis, req.body.oasisInstance, req.body.changelog);
        res.json(0);
    }
    catch (error) {
        res.status(400).json({ error: error });
        return;
    }
})
// Utils:
function validateInput(type, input) {
    if (type === "title") {
        const minLength = 3;
        const maxLength = 40;
        const nonWhitespaceInput = input.replace(/\s/g, "");
        if (nonWhitespaceInput.length < minLength || input.length > maxLength) {
            return "Title must be between " + minLength + " and " + maxLength + " non-whitespace characters long."
        }
        return true;
    }
    if (type === "description") {
        const maxLength = 100;
        if (input.length > maxLength) {
            return "Description must be less than " + maxLength + " characters long."
        }
        return true;
    }
}
async function createOasis(existingUser, oasisData) {
    // Creates an oasis from known info and save to database.

    // Check if oasis already exists (if _id is provided):
    if (oasisData._id) {
        const existingOasis = await Oasis.findOne({ _id: oasisData._id });
        if (existingOasis) {
            throw "An oasis with the provided _id already exists.";
        }
    }
    // Sanitize input:
    if (validateInput("title", oasisData.info.title) !== true) {
        throw validateInput("title", oasisData.info.title);
    }
    if (validateInput("description", oasisData.info.description) !== true) {
        throw validateInput("description", oasisData.info.description);
    }
    // Add user to oasisData:
    if (!oasisData.users) {
        oasisData.users = { owner: existingUser._id};
    }
    else {
        oasisData.users.owner = existingUser._id;
    }
    // Change exising oasis data:
    if (oasisData.settings) {
        oasisData.settings.sharing = "private";
    }
    if (oasisData.stats) {
        oasisData.stats.state.lastViewDate = Date.now();
    }
    // Create oasis:
    try {
        // Save oasis, add to cache: 
        const newOasis = new Oasis(oasisData);
        await newOasis.save();
        addToCache(newOasis);
        // Update user, return:
        await addOasisToUser(newOasis._id, existingUser);
        return newOasis;
    }
    catch (error) {
        throw "Unable to successfully create oasis - please retry in a moment.";
    }
}
async function validateOasis(oasisID, userToken, accessType) {
    // Validate user:
    const useCache = (accessType === "edit"); // only cache if editing
    const existingUser = await validateUser(userToken, useCache);
    // Find oasis:
    let oasis;
    try {
        const cachedOasis = oasisDataCache.get(oasisID);
        if (cachedOasis && useCache) {
            // Found in cache:
            oasis = cachedOasis;
        } 
        else {
            oasis = await Oasis.findById(oasisID);
            if (!oasis) {
                throw "The requested oasis does not exist - please recheck your URL.";
            }
            // Found in database, add to cache:
            addToCache(oasis);
        }
    }
    catch (error) {
        if (typeof error === "string") {
            throw error;
        }   
        throw "Problem accessing oasis - please recheck your URL.";
    }
    // Validate user permissions:
    const isOwner = (existingUser && oasis.users.owner.equals(existingUser._id));
    const isEditor = (existingUser && oasis.users.editors.includes(existingUser._id));
    const isViewer = (existingUser && oasis.users.viewers.includes(existingUser._id));
    const sharing = oasis.settings.sharing;
    if (accessType === "delete") {
        if (isOwner) {
            // Owner can delete oasis:
            return oasis;
        }
        else {
            throw "You don't have permission to delete this oasis - check your account.";
        }
    }
    if (accessType === "edit") {
        if (isOwner || isEditor || sharing === "public") {
            return oasis;
        }
        else {
            throw "You don't have permission to edit this oasis - check your account.";
        }
    }
    if (accessType === "view") {
        if (isOwner || isEditor || isViewer || sharing === "public") {
            return oasis;
        }
        else {
            throw "You don't have permission to access this oasis - check your account.";
        }
    }
    throw "An internal error occured - please retry in a moment.";
}
async function updateOasis(oasis, oasisInstance, changelog) {
    // Save oasis:
    try {
        const updater = {
            stats: oasis.stats,
        };
        for (const property of changelog) {
            updater[property] = oasisInstance[property];
        }
        // Update stats:
        updater.stats.state.lastEditDate = Date.now();
        // Update oasis in database:
        const updateResult = await Oasis.updateOne({_id: oasis._id}, { $set: updater });
        if (updateResult.modifiedCount !== 1) {
            // Invalidate cache:
            removeFromCache(oasis);
            throw "Sorry, there was a problem syncing to oasis - please retry in a moment.";
        }
        // Update oasis in cache:
        for (const property in updater) {
            oasis[property] = updater[property];
        }
    }
    catch (error) {
        throw "Sorry, there was a problem syncing to oasis - please retry in a moment.";
    }
}
async function deleteOasisFromUser(oasisID, userToken) {
    // Delete oasis:
    try {
        // Remove oasis from user:
        await removeOasisFromUser(oasisID, await validateUser(userToken, true));
        // Delete oasis:
        await Oasis.deleteOne({ _id: oasisID });
        // Invalidate cache:
        removeFromCache(oasisID);
    }
    catch (error) {
        console.log(error);
        throw "Sorry, there was a problem deleting oasis - please retry in a moment.";
    }
}
async function deleteOasesOfUser(oasisIDs) {
    // Delete oases:
    try {
        // Delete oases:
        await Oasis.deleteMany({ _id: { $in: oasisIDs } });
        // Invalidate cache:
        for (const oasisID of oasisIDs) {
            removeFromCache(oasisID);
        }
    }
    catch (error) {
        throw "Sorry, there was a problem deleting oases - please retry in a moment.";
    }
}
function addToCache(oasis) {
    oasisDataCache.set(oasis._id.toString(), oasis);
}
function removeFromCache(oasisOrID) {
    if (oasisOrID instanceof ObjectId) {
        oasisDataCache.del(oasisOrID.toString());
    }
    else {
        oasisDataCache.del(oasisOrID._id.toString());
    }
}


// Dependency exports:
registerDependency("deleteOasesOfUser", deleteOasesOfUser);
// Normal Exports:
module.exports = { oasis };
