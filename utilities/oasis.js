// Boilerplate:
const express = require('express');
const oasis = express.Router();

// Setup:
const { validateUser } = require('./authenticator.js');
const { Oasis, ObjectId } = require('./database.js');

// Endpoints:
oasis.get('/homeView', async (req, res) => {
    // Validate user:
    const existingUser = await validateUser(req.query.token);
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
oasis.post('/createOasis', async (req, res) => {
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
        res.status(400).json({ error: "Unable to create oasis - please retry in a moment." });
        return;
    }
    // Return ID:
    res.json({ ID: newOasis._id });
})
oasis.post('/getTemplateOasis', async (req, res) => {
    // Create template oasis:
    const ID = new ObjectId();
    const newOasis = new Oasis({
        info: {
            title: req.body.title,
            description: req.body.description
        },
        users: { owner: null },
        _id: ID
    });
    // Return oasis:
    res.json(newOasis);
})
// Utils:


module.exports = oasis;
