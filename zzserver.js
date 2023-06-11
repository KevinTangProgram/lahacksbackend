// Boilerplate:
const express = require('express');
const cors = require('cors');
const Dotenv = require("dotenv").config();
const app = express();
app.use(express.json());
app.use(cors());
// Setup:

// Prompter:
const prompter = require('./utilities/prompter.js');
app.use('/oasis/generate', prompter);
// Authenticator:
const authenticator = require('./utilities/authenticator.js');
app.use('/user', authenticator);



// Endpoints:


