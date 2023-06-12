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

// Database:
const mongoose = require('mongoose');
connection = "mongodb+srv://aaronkwan:" + process.env.MONGO_PASSWORD + "@fullstackv1.lqn0ait.mongodb.net/?retryWrites=true&w=majority";
const connectDB = async () => {
    mongoose.set('strictQuery', false);
    await mongoose
        .connect(connection,
            {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            })
        .then(() => console.log("Connected to DB"))
        .catch(console.error);
}
connectDB().then(() => {
    // Database connection established, continue setting up the app
    // ... Define your routers and endpoints here
    app.listen(8080, () => {
        console.log('Server listening on port 8080');
    });
});