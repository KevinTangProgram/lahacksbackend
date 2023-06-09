const express = require('express');
const cors = require('cors');
const Dotenv = require("dotenv").config();
const database = require('./utilities/database.js');

// Setup:

// Prompter:
const prompter = require('./utilities/prompter.js');
app.use('/oasis/generate', prompter);
// Authenticator:
const authenticator = require('./utilities/authenticator.js');
app.use('/user', authenticator);


// Endpoints:


