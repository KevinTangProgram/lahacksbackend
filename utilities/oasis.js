// Boilerplate:
const express = require('express');
const oasis = express.Router();

// Setup:
const { validateUser } = require('./authenticator.js');
const { Oasis } = require('./database.js');
const { v4: uuidv4 } = require("uuid");

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
    if (req.type === "all") {
        oasisIDs = existingUser.oasis.ownOases.concat(existingUser.oasis.joinedOases);
    } 
    else if (req.type === "own") {
        oasisIDs = existingUser.oasis.ownOases;
    }
    else if (req.type === "archived") {
        oasisIDs = existingUser.oasis.archivedOases;
    }
    // Grab oases summaries (exclude content and users):
    const oasesSummaries = await Oasis.find({ ID: { $in: oasisIDs } }, { users: 0, content: 0 });
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
        users: { owner: existingUser.ID },
        ID: uuidv4()
    });
    // Save oasis, update user:
    try {
        existingUser.oasis.ownOases.push(newOasis.ID);
        await newOasis.save();
        await existingUser.save();
    }
    catch (error) {
        console.log(error);
        res.status(400).json({ error: "Unable to create oasis - please retry in a moment." });
        return;
    }
    // Return ID:
    res.json({ ID: newOasis.ID });
})
oasis.post('/getTemplateOasis', async (req, res) => {
    // Create template oasis:
    const newOasis = new Oasis({
        info: {
            title: req.body.title,
            description: req.body.description
        },
        users: { owner: null },
        ID: uuidv4()
    });
    // Return oasis:
    res.json(newOasis);
})
// Utils:


module.exports = oasis;
