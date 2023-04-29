const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cohere = require('cohere-ai');
const crypto = require('crypto-js');
const nodemailer = require('nodemailer');
const Dotenv = require("dotenv").config();
cohere.init('EGsygyyzay3tG3CbLuJKmI1zLbWn4wqFYoz321AM'); // This is your trial API key
connection = "mongodb+srv://aaronkwan:Zekemongodb128@fullstackv1.lqn0ait.mongodb.net/?retryWrites=true&w=majority";
//

const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
    organization: "org-ESStGPBE9uVjNsLVsV1L7drZ",
    apiKey: process.env.API_KEY,
});

const transporter = nodemailer.createTransport( {
    service: "Zoho",
    auth: {
        user: "awesomeaacommands@gmail.com",
        pass: "@h+%97WNVu5zVwZ"
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

app.get('/auth', async (req, res) => {
    let returnArray = ["", []]
    const feed = await User.find();
    for (let i = 0; i < feed.length; i++)
    {
        if (feed[i].name === req.query.user)
        {
            if (crypto.SHA256(req.query.pass).toString() === feed[i].password)
            {
                returnArray[0] = feed[i]._id;
                returnArray[1] = feed[i].messages;
                break;
            }
        }
    }

    res.json(returnArray);
})

app.post('/new/account', async (req, res) => {
    const post = new User ({
        name: req.body.user,
        password: crypto.SHA256(req.body.pass).toString(),
    })
    post.save();
    res.json(0);
})

//const app = express();

// Define your API endpoints here
app.put('/api/cohere', async (req, res) => {
  // Call the cohere.generate function
    let feed = "";
    if (req.body.id !== "")
    {
        feed = await User.findById(req.body.id);
    }
    //  let message = "Please organize the following ideas into a coherent notes document with complete sentences." + 
    //  " Format the document as headers separated by whitespace with dashes to represent bullet points: \n";
    let message = "";
    for (let i = 0; i < req.body.input.length; i++)
    {
        message += req.body.input[i] + ' ';
    }
    message = message.substring(0, message.length - 1);
    const openai = new OpenAIApi(configuration);
    const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: message,
    max_tokens: 7,
    temperature: 0,
    });
    // const openai = new OpenAIApi(configuration);
    // const completion = await openai.createChatCompletion({
    // model: "gpt-3.5-turbo",
    // messages: [{role: "user", content: message}],
    // });
    // message = completion.data.choices[0].message.content;
    if (req.body.id !== "")
    {
        let updatedMessages = feed.messages;
        updatedMessages.push(req.body.input);
        updatedMessages.push(message);
        const post = await User.findByIdAndUpdate(req.body.id, {
            messages: updatedMessages,
        }, { new: true });
        post.save();
    }
    res.json(response.data.choices[0].text);
    // res.json(completion.data.choices[0].message.content);
});

app.put('/delete', async (req, res) => {
    let feed = "";
    if (req.body.id !== "")
    {
        feed = await User.findById(req.body.id);
        let newMessages = feed.messages;
        newMessages.splice(req.body.index, 2);

        const post = await User.findByIdAndUpdate(req.body.id, {
            messages: newMessages,
        }, { new: true });
        post.save();
    }
    res.json("Successful Deletion");
})

app.get('/email', async (req, res) => {
    if (req.query.id !== "")
    {
        const feed = await User.findById(req.query.id);
        const message = "Hello,\n\n" + "Below are the documents that you requested.\n\nSincerely, AFK\n\n";
        let longMessage = "";
        for (let i = 0; i < feed.messages.length; i++)
        {
            if (i % 2 === 0)
            {
                longMessage += "Prompt:\n";
                for (let j = 0; j < feed.messages[i].length; j++)
                {
                    longMessage += feed.messages[i][j] + ' ';
                }
                longMessage += "\n\n";
            }
            else
            {
                longMessage += "Response:\n" + feed.messages[i] + "\n\n";
            }
        }
        const options = {
            from: "ideaoasis@zohomail.com",
            to: feed.name,
            subject: "Idea Oasis - Data",
            text: message + longMessage,
        };

        await new Promise((resolve, reject) => {
            transporter.sendMail(options, function (err, info){
                if (err)
                {
                    reject(err);
                }
                else
                {
                    resolve("email sent");
                }
            });
        })
    }
    res.json(0);
})