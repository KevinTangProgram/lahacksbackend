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
const emailCooldownCache = [];
const emailCooldown = 1000 * 59 * 1; // 59 seconds
const cacheMaxSize = 10;

// Endpoints:
    // Logins:
authenticator.get('/login', async (req, res) => {
    // Sanitize input:
    if (validateInput("email", req.query.email) !== true) {
        res.status(400).json({ error: validateInput("email", req.query.email) });
        return;
    }
    if (validateInput("password", req.query.password) !== true) {
        res.status(400).json({ error: validateInput("password", req.query.password) });
        return;
    }
    // Find user:
    const existingUser = await User.findOne({ "info.email": req.query.email.toLowerCase() });
    if (!existingUser) {
        // Disallow login:
        res.status(400).json({ error: 'Incorrect email or password combination.' });
        return;
    }
    // Check password:
    if (req.query.password === "[google]" || existingUser.info.password !== hashed(req.query.password)) {
        // Disallow login:
        res.status(400).json({ error: 'Incorrect email or password combination.' });
        return;
    }
    // Update Login Stats:
    existingUser.stats.lastLogin = Date.now();
    existingUser.stats.loginAmount++;
    existingUser.save();
    // Return user info:
    const customToken = await jwt.sign({ ID: existingUser.ID }, process.env.JWT_SECRET, { expiresIn: '3d' });
    res.json({
        user: existingUser,
        token: customToken,
    });
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
        // Update Login Stats:
        existingUser.stats.lastLogin = Date.now();
        existingUser.stats.loginAmount++;
        existingUser.save();
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
    // Account creation:
authenticator.get('/verifyEmail', async (req, res) => {
    // Sanitize input:
    if (validateInput("email", req.query.email) !== true) {
        res.status(400).json({ error: validateInput("email", req.query.email) });
        return;
    }
    // Grab email:
    const email = req.query.email.toLowerCase();
    // Check if email is already in use:
    existingUser = await User.findOne({ "info.email": email });
    if (existingUser) {
        // Disallow account creation:
        res.status(400).json({ error: 'There is already an account associated with your email address - try logging in instead.' });
        return;
    }
    // Check for email cooldowns:
    if (checkEmailCooldown(email, req.ip)) {
        res.status(400).json({ error: 'Please wait a bit before resending.' });
        return;
    }
    // Create token from email:
    const emailToken = await jwt.sign({ ID: email }, process.env.JWT_SECRET, { expiresIn: '30m' });
    // Send token as link to email:
    const link = process.env.PUBLIC_URL + "/user/setup/" + emailToken;
    const options = {
        from: "ideaoasis@zohomail.com",
        to: email,
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
    // Cache email cooldown:
    cacheEmailCooldown(email, req.ip);
    res.json("Email sent - make sure to check your spam or junk folder as well!");
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
    try {
        // Sanitize input:
        if (validateInput("username", req.body.username) !== true) {
            res.status(400).json({ error: validateInput("username", req.query.username) });
            return;
        }
        if (validateInput("password", req.body.password) !== true) {
            res.status(400).json({ error: validateInput("password", req.query.password) });
            return;
        }
        // Verify token:
        const email = jwt.verify(req.body.token, process.env.JWT_SECRET, { ignoreExpiration: false }).ID;
        // Check if user exists:
        const existingUser = await User.findOne({ "info.email": email });
        if (existingUser) {
            // Email already in use:
            res.status(400).json({ error: 'There is already an account associated with your email address - try logging in instead!' });
            return;
        }
        // Create new user:
        const ID = crypto.SHA256(req.body.username + email + req.body.password).toString();
        try {
            const newUser = await createAccount({ ID: ID, username: req.body.username, email: email, password: hashed(req.body.password) });
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
    }
    catch (error) {
        res.status(400).json({ error: "We're sorry, your token just expired - please resend the verification." });
    }
})
    // Password reset:
authenticator.get('/resetPassword', async (req, res) => {
    // Sanitize input:
    if (validateInput("email", req.query.email) !== true) {
        res.status(400).json({ error: validateInput("email", req.query.email) });
        return;
    }
    const email = req.query.email.toLowerCase();
    // Check if email matches an account:
    existingUser = await User.findOne({ "info.email": email });
    if (!existingUser) {
        // Don't send email:
        res.status(400).json({ error: 'There is no account associated with your email address - try creating a new one instead.' });
        return;
    }
    // Check for email cooldowns:
    if (checkEmailCooldown(email, req.ip)) {
        res.status(400).json({ error: 'Please wait a bit before resending.' });
        return;
    }
    // Create token from email:
    const emailToken = await jwt.sign({ ID: email }, process.env.JWT_SECRET, { expiresIn: '30m' });
    // Send token as link to email:
    const link = process.env.PUBLIC_URL + "/user/reset/" + emailToken;
    const options = {
        from: "ideaoasis@zohomail.com",
        to: email,
        subject: "Idea Oasis - Password Reset",
        html: `
        Hi ${existingUser.info.username}, <br><br>
        
        Someone recently requested a password reset for your Idea Oasis account. <br>
        If this was you, set a new password <a href="${link}">here</a>. <br><br>

        Not you? You can safely ignore and delete this email. <br><br>

        To keep your account secure, please don't forward this email to anyone. <br><br>

        Thanks, <br>
        Idea Oasis <br>
        <a href="${process.env.PUBLIC_URL}">
            <img src="cid:ideaoasislogo2023@nodemailer.com" style="width: 30px; height: 30px;" />
        </a>`,
        attachments: [{
            filename: 'logo.png',
            path: path.join(__dirname, '..', 'resources', 'iconLogo.png'),
            cid: 'ideaoasislogo2023@nodemailer.com'
        }]
    };
    transporter.sendMail(options, function (err, info) {
        if (err) {
            // Error:
            res.status(400).json({ error: 'Error sending email: check that it is valid!' });
        }
    });
    // Cache email cooldown:
    cacheEmailCooldown(email, req.ip);
    res.json("Email sent - make sure to check your spam or junk folder as well!");
})
authenticator.get('/resetPage', async (req, res) => {
    try {
        // Verify token:
        const email = jwt.verify(req.query.token, process.env.JWT_SECRET, { ignoreExpiration: false }).ID;
        res.json(email);
    }
    catch (error) {
        res.status(400).json({ error: 'Invalid or expired token - please request a new password reset.' });
    }
})
authenticator.post('/reset', async (req, res) => {
    try {
        // Sanitize input:
        if (validateInput("password", req.body.password) !== true) {
            res.status(400).json({ error: validateInput("password", req.query.password) });
            return;
        }
        // Verify token:
        const email = jwt.verify(req.body.token, process.env.JWT_SECRET, { ignoreExpiration: false }).ID;
        // Update user info:
        try {
            const existingUser = await User.findOne({ "info.email": email });
            existingUser.info.password = hashed(req.body.password);
            existingUser.save();
            // Create custom JWT:
            const customToken = await jwt.sign({ ID: existingUser.ID }, process.env.JWT_SECRET, { expiresIn: '3d' });
            // Return user info:
            res.json({
                user: existingUser,
                token: customToken,
            });
        }
        catch (error) {
            res.status(400).json({ error: 'Problem resetting password - please try again in a moment.' });
        }
    }
    catch (error) {
        res.status(400).json({ error: "We're sorry, your token just expired - please request a new password reset." });
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
function checkEmailCooldown(email, ip) {
    const time = Date.now();
    // Loop through array of {email, ip, time} objects:
    for (let i = 0; i < emailCooldownCache.length; i++) {
        // Check if email or ip match:
        if (emailCooldownCache[i].email === email || emailCooldownCache[i].ip === ip) {
            // Check if time is within 5 minutes:
            if (time - emailCooldownCache[i].time < emailCooldown) {
                return true;
            }
            else {
                // Update time:
                emailCooldownCache[i].time = time;
                return false;
            }
        }    
    }   
    return false;
}
function cacheEmailCooldown(email, ip) {
    // Add to cache:
    const time = Date.now();
    if (emailCooldownCache.length >= cacheMaxSize) {
        // Remove first element:
        emailCooldownCache.shift();
    }
    emailCooldownCache.push({ email: email, ip: ip, time: time });
}
function validateInput(type, input) {
    const hasBadChars = (input) => {
        const pattern = /[:;[\](){}`'""]/;
        return pattern.test(input);
    }
    if (type === "email") {
        const maxLength = 254;
        if (input.length > maxLength) {
            return "Email cannot be longer than " + maxLength + " characters."
        }
        if (hasBadChars(input)) {
            return "Email cannot contain special characters."
        }
        if (input.includes(" ")) {
            return "Email cannot contain spaces."
        }
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (pattern.test(input)) {
            return true;
        }
        return "Invalid email address - Check for special characters or whitespace."
    }
    if (type === "username") {
        const minLength = 3;
        const maxLength = 20;
        if (input.length < minLength || input.length > maxLength) {
            return "Username must be between " + minLength + " and " + maxLength + " characters long."
        }
        if (hasBadChars(input)) {
            return "Username cannot contain special characters."
        }
        return true;
    }
    if (type === "password") {
        const minLength = 5;
        const maxLength = 20;
        if (input.length < minLength || input.length > maxLength) {
            return "Password must be between " + minLength + " and " + maxLength + " characters long."
        }
        if (hasBadChars(input)) {
            return "Password cannot contain special characters."
        }
        if (input.includes(" ")) {
            return "Password cannot contain spaces."
        }
        return true;
    }
}
function hashed(password) {
    return crypto.SHA256(password + process.env.PASSWORD_SALT).toString();
}

module.exports = authenticator;
