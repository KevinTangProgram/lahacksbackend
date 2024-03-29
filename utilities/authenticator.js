// Boilerplate:
const express = require('express');
const authenticator = express.Router();

// Setup:
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const crypto = require('crypto-js');
const { User, getDependency } = require('./database.js');
const path = require('path');
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    service: "Zoho",
    auth: {
        user: "awesomeaacommands@gmail.com",
        pass: process.env.ZOHO_PASSWORD
    }
});
const NodeCache = require("node-cache");
const emailCooldownCache = new NodeCache({ stdTTL: 59 }); // email cooldown should be 59 seconds.
const userValidationCache = new NodeCache({ stdTTL: 120, useClones: false }); // only need to re-validate with database every 2 minutes.


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
    if (existingUser.info.password !== hashed(req.query.password)) {
        // Disallow login:
        res.status(400).json({ error: 'Incorrect email or password combination.' });
        return;
    }
    // Update Login Stats:
    try {
        existingUser.stats.lastLogin = Date.now();
        existingUser.stats.loginAmount++;
        await existingUser.save();
    }
    catch (error) {
        res.status(400).json({ error: 'Unable to prepare account - please try again in a moment.' });
        return;
    }
    // Return user info:
    const customToken = await jwt.sign({ ID: existingUser._id }, process.env.JWT_SECRET, { expiresIn: '3d' });
    res.json({
        user: existingUser,
        token: customToken,
    });
})
authenticator.get('/continueWithGoogle', async (req, res) => {
    try {
        // Verify & Decode google token:
        const client = new OAuth2Client();
        const ticket = await client.verifyIdToken({
            idToken: req.query.token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const googleInfo = ticket.getPayload();
        // Grab user info:
        let existingUser = await User.findOne({ "info.email": googleInfo.email });
        if (!existingUser) {
            // Create new user:
            existingUser = await createAccount({ username: googleInfo.name, email: googleInfo.email, password: hashed(googleInfo.sub) });
        }
        if (existingUser) {
            // Check if it is a google account:
            if (existingUser.info.password !== hashed(googleInfo.sub)) {
                // Disallow login:
                //res.status(400).json({ error: 'There is already an account associated with your email address - try logging in manually.' });
                //return;
                    // Allow login, I guess? 
            }
            // Update Login Stats:
            existingUser.stats.lastLogin = Date.now();
            existingUser.stats.loginAmount++;
            existingUser.save();
            // Return user info:
            const customToken = await jwt.sign({ ID: existingUser._id }, process.env.JWT_SECRET, { expiresIn: '3d' });
            res.json({
                user: existingUser,
                token: customToken,
            });
        }
    }
    catch (error) {
        res.status(400).json({ error: 'Problem connecting to google or database - please try again in a moment.' });
    }
})
authenticator.get('/refresh', async (req, res) => {
    // Validate token to get user:
    const existingUser = await validateUser(req.query.token, true);
    if (existingUser) {
        // Return user info:
        const customToken = await jwt.sign({ ID: existingUser._id }, process.env.JWT_SECRET, { expiresIn: '3d' });
        res.json({
            user: existingUser,
            token: customToken,
        });
    }
    else {
        res.status(400).json({ error: 'Invalid or expired token - please log in again.' });
    }
});
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
    const emailToken = await jwt.sign({ email: email }, process.env.JWT_SECRET, { expiresIn: '30m' });
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
        const email = jwt.verify(req.query.token, process.env.JWT_SECRET, { ignoreExpiration: false }).email;
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
        const email = jwt.verify(req.body.token, process.env.JWT_SECRET, { ignoreExpiration: false }).email;
        // Check if user exists:
        const existingUser = await User.findOne({ "info.email": email });
        if (existingUser) {
            // Email already in use:
            res.status(400).json({ error: 'There is already an account associated with your email address - try logging in instead!' });
            return;
        }
        // Create new user:
        try {
            const newUser = await createAccount({ username: req.body.username, email: email, password: hashed(req.body.password) });
            // Create custom JWT:
            const customToken = await jwt.sign({ ID: newUser._id }, process.env.JWT_SECRET, { expiresIn: '3d' });
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
    const emailToken = await jwt.sign({ email: email }, process.env.JWT_SECRET, { expiresIn: '30m' });
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
        const email = jwt.verify(req.query.token, process.env.JWT_SECRET, { ignoreExpiration: false }).email;
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
        const email = jwt.verify(req.body.token, process.env.JWT_SECRET, { ignoreExpiration: false }).email;
        // Update user info:
        try {
            const existingUser = await User.findOne({ "info.email": email });
            existingUser.info.password = hashed(req.body.password);
            existingUser.save();
            invalidateUserCache(existingUser._id);
            // Create custom JWT:
            const customToken = await jwt.sign({ ID: existingUser._id }, process.env.JWT_SECRET, { expiresIn: '3d' });
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
    // Update user info:
authenticator.post('/updateUser', async (req, res) => {
    // Validate token to get user:
    const existingUser = await validateUser(req.body.token);
    if (existingUser) {
        // Update specific information:
        existingUser.settings = req.body.user.settings;
        existingUser.info.username = req.body.user.info.username;
        try {
            await existingUser.save();
            invalidateUserCache(existingUser._id);
            res.json(0);
        }
        catch (error) {
            console.log(error);
            res.status(400).json({ error: 'Problem updating user info - please try again in a moment.' });
        }
    }
    else {
        res.status(400).json({ error: 'Invalid or expired token - please log in again.' });
    }
});
    // Delete account:
authenticator.post('/deleteAccount', async (req, res) => {
    // Validate token to get user:
    const existingUser = await validateUser(req.body.token);
    if (existingUser) {
        try {
            // Delete user's oases:
            const deleteOasesOfUser = getDependency("deleteOasesOfUser");
            await deleteOasesOfUser(existingUser.oasis.ownOases);
            // Delete user: 
            await User.deleteOne({ _id: existingUser._id });
            invalidateUserCache(existingUser._id);
            res.json(0);
        }
        catch (error) {
            res.status(400).json({ error: 'Problem deleting account - please try again in a moment.' });
        }
    }
    else {
        res.status(400).json({ error: 'Invalid or expired token - please log in again.' });
    }
});
// Utils:
async function createAccount(req) {
    const user = new User({
        info: {
            username: req.username,
            password: req.password,
            email: req.email,
        },
    })
    try {
        await user.save();
    }
    catch (error) {
        throw error;
    }
    return user;
}
async function validateUser(token, useCache = false) {
    try {
        // Verify token:
        const ID = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: false }).ID;
        // Check cache:
        if (useCache === true) {
            const cachedUser = userValidationCache.get(ID);
            if (cachedUser) {
                return cachedUser;
            } 
        }
        // Check database:
        const existingUser = await User.findOne({ _id: ID });
        if (existingUser) {
            // Handle schema changes:
            handleSchemaChanges(existingUser);
            // Cache user:
            userValidationCache.set(ID, existingUser);
            return existingUser;
        }
        return false;
    }
    catch (error) {
        return false;
    }
}
async function addOasisToUser(oasisID, existingUser) {
    try {
        await User.updateOne(
            { _id: existingUser._id },
            { $push: { 'oasis.ownOases': oasisID } }
        );
        invalidateUserCache(existingUser._id);
    }
    catch (error) {
        throw "Problem updating user - please retry in a moment."
    }
}
async function removeOasisFromUser(oasisID, existingUser) {
    try {
        await User.updateOne(
            { _id: existingUser._id },
            { $pull: { 'oasis.ownOases': oasisID } }
        );
        invalidateUserCache(existingUser._id);
    }
    catch (error) {
        throw "Problem updating user - please retry in a moment."
    }
}


function handleSchemaChanges(existingUser) {
    // 9/2/2023: 
        // Changed user.settings.privacy field from type string to an object {profile: "private"}:
    if (existingUser.settings.privacy === null) {
        existingUser.settings.privacy = { profile: "private" };
    }
}   
function invalidateUserCache(ID) {
    userValidationCache.del(ID.toString());
}
function checkEmailCooldown(email, ip) {
    // Check if both email or ip is in cache, removing if true:
    const emailKey = `email-${email}`;
    const ipKey = `ip-${ip}`;
    let inCache = emailCooldownCache.take(emailKey);
    inCache = emailCooldownCache.take(ipKey) || inCache;
    // Re-add to cache:
    emailCooldownCache.set(emailKey, true);
    emailCooldownCache.set(ipKey, true);
    return inCache;
}
function cacheEmailCooldown(email, ip) {
    // Add to cache:
    const emailKey = `email-${email}`;
    const ipKey = `ip-${ip}`;
    emailCooldownCache.set(emailKey, true);
    emailCooldownCache.set(ipKey, true);
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
        const nonWhitespaceInput = input.replace(/\s/g, "");
        if (nonWhitespaceInput.length < minLength || input.length > maxLength) {
            return "Username must be between " + minLength + " and " + maxLength + " non-whitespace characters long."
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


module.exports = { authenticator, validateUser, addOasisToUser, removeOasisFromUser };
