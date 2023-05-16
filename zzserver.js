const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cohere = require('cohere-ai');
const crypto = require('crypto-js');
const nodemailer = require('nodemailer');
const Dotenv = require("dotenv").config();
cohere.init('EGsygyyzay3tG3CbLuJKmI1zLbWn4wqFYoz321AM'); // This is your trial API key
connection = "mongodb+srv://aaronkwan:" + process.env.MONGO_PASSWORD + "@fullstackv1.lqn0ait.mongodb.net/?retryWrites=true&w=majority";
//

const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
    organization: "org-ESStGPBE9uVjNsLVsV1L7drZ",
    apiKey: process.env.API_KEY,    //DO NOT PASTE THE KEY HERE
});

const transporter = nodemailer.createTransport( {
    service: "Zoho",
    auth: {
        user: "awesomeaacommands@gmail.com",
        pass: process.env.ZOHO_PASSWORD
    }
});

const connectDB = async () => {
    mongoose.set('strictQuery', false);

    await mongoose
        .connect (connection, 
            {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            })
            .then(() => console.log("Connected to DB"))
            .catch(console.error);
}

const app = express();
app.use(express.json());
app.use(cors());

connectDB().then(() => {
    app.listen(8080, () => {console.log("Server listening on port 8080");});
})

const User = require("./models/user");
//const Group = require("./models/group");

app.get('/login', async (req, res) => {
    const user = await User.findOne({ 'info.name': req.query.user });
    if (user?.info.password === crypto.SHA256(req.query.password).toString()) {
        res.json(user); 
        return;
    }
    res.json("bad boy");
})

app.post('/new/account', async (req, res) => {
    const post = new User ({
        info: {
            name: req.body.user,
            password: crypto.SHA256(req.body.password).toString(),
            email: req.body.email,
        }
    })
    post.save();
    res.json(0);
})