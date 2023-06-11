// Boilerplate:
const express = require('express');
// const cors = require('cors');
// const Dotenv = require("dotenv").config();
const authenticator = express.Router();
// authenticator.use(express.json());
// authenticator.use(cors());
// Setup:
const jwt = require('jsonwebtoken');
const crypto = require('crypto-js');
const { User } = require('./database.js');

// Endpoints:
authenticator.get('/login', async (req, res) => {
    const user = await User.findOne({ 'info.name': req.query.user });
    if (user?.info.password === crypto.SHA256(req.query.password).toString()) {
        res.json(user);
        return;
    }
    res.json("bad boy");
})
authenticator.get('/continueWithGoogle', async (req, res) => {
    // Decode google token:
    const googleInfo = jwt.decode(req.query.token);
    // Convert to our JWT:
    let customToken;
    jwt.sign({ ID: googleInfo.sub }, process.env.JWT_SECRET, { expiresIn: '3d' }, (err, token) => {
        if (err) {
            throw 'Error creating JWT';
        }
        else {
            customToken = token;
        }
    });
    // Check if user exists:
    let existingUser = await User.findOne({ ID: googleInfo.sub });
    if (!existingUser) {
        // Create new user:
        existingUser = await createAccount({ body: { ID: googleInfo.sub, name: googleInfo.name, email: googleInfo.email, password: "*google*" } });
    }
    // Return user info:
    res.json({
        user: existingUser,
        token: customToken,
    });
})
authenticator.post('/new/account', async (req, res) => {
    if (req.body.google === "true") {
        const post = new User({
            info: {
                name: req.body.user,
                password: crypto.SHA256(req.body.password).toString(),
                email: req.body.email,
            },
            token: crypto.SHA256(req.body.googleToken.toString()).toString()
        })
        post.save();
    }
    else {
        const post = new User({
            info: {
                name: req.body.user,
                password: crypto.SHA256(req.body.password).toString(),
                email: req.body.email,
            },
            token: crypto.SHA256(req.body.user + req.body.email + req.body.password).toString()
        })
        post.save();
    }
    res.json(0);
})

// Utils:
async function createAccount(req) {
    const user = new User({
        info: {
            name: req.body.name,
            password: req.body.password,
            email: req.body.email,
        },
        ID: req.body.ID,
    })
    user.save();
    return user;
}

module.exports = authenticator;
