// Boilerplate:
const express = require('express');
const oasis = express.Router();

// Setup:
const { validateUser } = require('./authenticator.js');
const { Oasis, ObjectId } = require('./database.js');

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
    // Validate user:
    const existingUser = await validateUser(req.query.token);
    // Find oasis:
    try {
        const oasis = await Oasis.findById(req.query.UUID);
        if (!oasis) {
            res.status(400).json({ error: "The requested oasis does not exist - please recheck your URL." });
            return;
        }
        // See if oasis should be accessed by user:
        if (!existingUser) {
            // Guest user:
            if (oasis.settings.sharing == "public") {
                res.json(oasis);
            }
            else {
                res.status(400).json({ error: "You don't have permission to access this oasis - are you logged in?" });
                return;
            }
        }
        else {
            // Logged in user:
            if (oasis.users.owner.equals(existingUser._id)) {
                res.json(oasis);
                return;
            }
            if (oasis.users.editors.includes(existingUser._id)) {
                res.json(oasis);
                return;
            }
            if (oasis.users.viewers.includes(existingUser._id)) {
                res.json(oasis);
                return;
            }
        }
        // Unable to access oasis:
        res.status(400).json({ error: "You don't have permission to access this oasis - double check your account." });
        return;
    }
    catch (error) {
        res.status(400).json({ error: "Problem accessing oasis - please retry in a moment." });
        return;
    }
})
oasis.post('/createOasis', async (req, res) => {
    // Sanitize input:
    if (validateInput("title", req.body.title) !== true) {
        res.status(400).json({ error: validateInput("title", req.query.title) });
        return;
    }
    if (validateInput("description", req.body.description) !== true) {
        res.status(400).json({ error: validateInput("description", req.query.description) });
        return;
    }
    // Validate user:
    const existingUser = await validateUser(req.body.token);
    if (!existingUser) {
        res.status(400).json({ error: "Unable to validate user - please log in again." });
        return;
    }
    // Create oasis:
    const newOasis = new Oasis({
        info: {
            title: req.body.title,
            description: req.body.description
        },
        users: { owner: existingUser._id },
    });
    // Save oasis, update user:
    try {
        await newOasis.save();
        existingUser.oasis.ownOases.push(newOasis._id);
        await existingUser.save();
    }
    catch (error) {
        console.log(error);
        res.status(400).json({ error: "Unable to create oasis - please retry in a moment." });
        return;
    }
    // Return ID:
    res.json({ ID: newOasis._id });
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
    // Validate user:
    const existingUser = await validateUser(req.body.token, true);
    if (!existingUser) {
        res.status(400).json({ error: "Unable to validate user - please log in again." });
        return;
    }
    // Find oasis:
    try {
        const oasis = await Oasis.findById(req.body.oasisInstance.UUID);
         if (!oasis) {
            res.status(400).json({ error: "The requested oasis does not exist - please recheck your URL." });
            return;
        }
        // See if oasis should be accessed by user:
        if (!existingUser) {
            // Guest user:
            if (oasis.settings.sharing == "public") {
                await editOasis(oasis, req.body.oasisInstance);
                res.json(0);
            }
            else {
                res.status(400).json({ error: "You don't have permission to access this oasis - are you logged in?" });
                return;
            }
        }
        else {
            // Logged in user:
            if (oasis.users.owner.equals(existingUser._id)) {
                await editOasis(oasis, req.body.oasisInstance);
                res.json(0);
                return;
            }
            if (oasis.users.editors.includes(existingUser._id)) {
                await editOasis(oasis, req.body.oasisInstance);
                res.json(0);
                return;
            }
            if (oasis.users.viewers.includes(existingUser._id)) {
                res.status(400).json({ error: "You don't have permission to edit this oasis - double check your account." });
                return;
            }
        }
        // Unable to access oasis:
        res.status(400).json({ error: "You don't have permission to access this oasis - double check your account." });
        return;
    }
    catch (error) {
        console.log(error);
        res.status(400).json({ error: "Problem syncing to oasis - please retry in a moment." });
        return;
    }
})
// Utils:
function validateInput(type, input) {
    if (type === "title") {
        const minLength = 3;
        const maxLength = 20;
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
async function editOasis(oasis, oasisInstance) {
    // Update oasis:
    oasis.settings = oasisInstance.data.settings;
    oasis.stats = oasisInstance.data.stats;
    // Save oasis:
    try {
        await oasis.save();
    }
    catch (error) {
        throw error;
    }
}

module.exports = oasis;
