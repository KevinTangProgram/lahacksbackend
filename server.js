const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cohere = require('cohere-ai');
const crypto = require('crypto-js');
const nodemailer = require('nodemailer');
cohere.init('EGsygyyzay3tG3CbLuJKmI1zLbWn4wqFYoz321AM'); // This is your trial API key
connection = "mongodb+srv://aaronkwan:Zekemongodb128@fullstackv1.lqn0ait.mongodb.net/?retryWrites=true&w=majority";

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

    let message = "Please organize the following ideas into a coherent notes document IN HTML." + 
    " Add words to make complete sentences, and generate some headings where necessary. Use the outline style of note taking:\n";
    for (let i = 0; i < req.body.input.length; i++)
    {
        message += req.body.input[i] + ' ';
    }
    message = message.substring(0, message.length - 1);

    const response = await cohere.generate({
        model: '0986e558-3929-4dae-a381-7d1aa3625f91-ft',
        prompt: message,
        max_tokens: 500,
        temperature: 0.5,
        k: 0,
        stop_sequences: [],
        return_likelihoods: 'NONE'
    });
    // Send the response back to the client

    if (req.body.id !== "")
    {
        let updatedMessages = feed.messages;
        updatedMessages.push(req.body.input);
        updatedMessages.push(response.body.generations[0].text);
        const post = await User.findByIdAndUpdate(req.body.id, {
            messages: updatedMessages,
        }, { new: true });
        post.save();
    }

    res.send(response.body.generations[0].text);
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
        const longMessage = "";
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
            to: req.body.name,
            subject: "Idea Oasis - Data",
            text: message,
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