// Boilerplate:
const express = require('express');
const authenticator = express.Router();

// Setup:
const jwt = require('jsonwebtoken');
const crypto = require('crypto-js');
const { User } = require('./database.js');
const path = require('path');
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    service: "Zoho",
    auth: {
        user: "awesomeaacommands@gmail.com",
        pass: process.env.ZOHO_PASSWORD
    }
});

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
    try {
        // Decode google token:
        const googleInfo = jwt.decode(req.query.token);
        // Convert to our JWT:
        const customToken = await jwt.sign({ ID: googleInfo.sub }, process.env.JWT_SECRET, { expiresIn: '3d' });
        // Check if user exists:
        let existingUser = await User.findOne({ ID: googleInfo.sub });
        if (!existingUser) {
            // Check if email is already in use:
            existingUser = await User.findOne({ "info.email": googleInfo.email });
            if (existingUser) {
                // Disallow account creation:
                res.status(400).json({ error: 'There is already an account associated with your email address - try logging in manually.' });
                return;
            }
            // Create new user:
            existingUser = await createAccount({ ID: googleInfo.sub, username: googleInfo.name, email: googleInfo.email, password: "[google]" });
        }
        // Return user info:
        res.json({
            user: existingUser,
            token: customToken,
        });
    }
    catch (error) {
        res.status(400).json({ error: 'Problem connecting to google - please try again in a moment.' });
    }
})
authenticator.get('/verifyEmail', async (req, res) => {
    // Create token from email:
    const emailToken = await jwt.sign({ ID: req.query.email }, process.env.JWT_SECRET, { expiresIn: '30m' });
    // Send token as link to email:
    const link = process.env.PUBLIC_URL + "/user/setup/" + emailToken;
    const options = {
        from: "ideaoasis@zohomail.com",
        to: req.query.email,
        subject: "Idea Oasis - Account Setup",
        html: `
        Hello, <br><br>
        
        Please click on the following <a href="${link}">link</a> to continue account setup. <br><br>

        Not you? You can safely ignore this email. <br><br>

        Thanks, <br>
        Idea Oasis <br>
        <a href="${process.env.PUBLIC_URL}">
            <img src="cid:ideaoasislogo2023@nodemailer.com" style="width: 30px; height: 30px;" />
        </a>`,
        attachments: [{
            filename: 'logo.png',
            path: path.join(__dirname,'..', 'resources', 'iconLogo.png'),
            cid: 'ideaoasislogo2023@nodemailer.com'
        }]
    };
    transporter.sendMail(options, function (err, info) {
        if (err) {
            // Error:
            res.status(400).json({ error: 'Error sending email: check that it is valid!' });
        }
    });
    res.json(0);
})
authenticator.get('/setup', async (req, res) => {
    try {
        // Verify token:
        const email = jwt.verify(req.query.token, process.env.JWT_SECRET, { ignoreExpiration: false }).ID;
        res.json(email);
    }
    catch (error) {
        res.status(400).json({ error: 'Invalid or expired token - please resend the verification.' });
    }
})
authenticator.post('/createAccount', async (req, res) => {
    // Check if user exists:
    const existingUser = await User.findOne({ "info.email": req.body.email });
    if (existingUser) {
        // Email already in use:
        res.status(400).json({ error: 'There is already an account associated with your email address - try continue with google instead!' });
        return;
    }
    // Create new user:
    const ID = crypto.SHA256(req.body.username + req.body.email + req.body.password).toString();
    try {
        const newUser = await createAccount({ ID: ID, username: req.body.username, email: req.body.email, password: req.body.password });
        // Create custom JWT:
        const customToken = await jwt.sign({ ID: ID }, process.env.JWT_SECRET, { expiresIn: '3d' });
        // Return user info:
        res.json({
            user: newUser,
            token: customToken,
        });
    }
    catch (error) {
        res.status(400).json({ error: 'Problem creating account - please try again in a moment.' });
    }
})
// Utils:
async function createAccount(req) {
    const user = new User({
        info: {
            username: req.username,
            password: req.password,
            email: req.email,
        },
        ID: req.ID,
    })
    user.save();
    return user;
}

module.exports = authenticator;
