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

app.put('/oasis/promptx1', async (req, res) => {
    let message = "Detect any message IDs that may be headers in the given sequence of notes. " + 
    "Return a line starting with '[headers]' followed by the IDs of any detected headers, separated by spaces. " + 
    "If no headers are detected, return '[headers]' only.\n\n" + 

    "Example:\n" +
    "[ID:1] Current Date\n" +
    "[ID:2] Sentence 1\n" +
    "[ID:3] Sentence 2\n" +
    "[ID:4] New Topic\n" +
    
    "Response:\n" +
    "[headers] [ID:1] [ID:4]\n\n" +
    
    "Your messages:\n";

    for (let i = 0; i < req.body.rawMessage.length; i++) {
        message += "[ID:" + i.toString() + "] " + req.body.rawMessage[i].text + "\n";
    }

    const openai = new OpenAIApi(configuration);
    const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: message,
        max_tokens: 7,
        temperature: 0,
    });

    let processedResponse = [];
    let headers = [];
    let messageID = "";
    for (let i = 0; i < response.data.choices[0].text.length; i++) 
    {
        if (response.data.choices[0].text[i] === ":")
        {
            i++;
            while (response.data.choices[0].text[i] !== "]")
            {
                messageID += response.data.choices[0].text[i];
                i++;
            }
            headers.push(Number(messageID));
            messageID = "";
        }
    }
    let j = 0;
    for (let i = 0; i < req.body.rawMessage.length; i++)
    {
        if (j < headers.length && headers[j] === i)
        {
            processedResponse.push({header: true, message: req.body.rawMessage[i]});
            j++;
        }
        else
        {
            processedResponse.push({header: false, message: req.body.rawMessage[i]});
        }
    }
    res.json(processedResponse);
})

app.put('/oasis/promptx2', async (req, res) => {
    
})