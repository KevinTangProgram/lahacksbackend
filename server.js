const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cohere = require('cohere-ai');
const crypto = require('crypto-js');
const nodemailer = require('nodemailer');
cohere.init('EGsygyyzay3tG3CbLuJKmI1zLbWn4wqFYoz321AM'); // This is your trial API key
connection = "mongodb+srv://aaronkwan:Zekemongodb128@fullstackv1.lqn0ait.mongodb.net/?retryWrites=true&w=majority";
//
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
    organization: "org-ESStGPBE9uVjNsLVsV1L7drZ",
    apiKey: "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",
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

    const openai = new OpenAIApi(configuration);
    const response = await openai.createEdit({
    model: "text-davinci-edit-001",
    input: "1/11/23:\n At acid pKa, 1:1 HA/A-.\nAt 1 pH lower (1 order of magtude more H+), 10:1 HA/A-.\nAt 1 pH higher (1 order of magnitude less H+), 1:10 HA/A-.\nHenderson Hasselback: pH=pKa+log(A-/HA)\n\n1/13/23:\npI: average the two pKas around the neutral range (when molecule is zwitterion)\nIf you are at carboxy pKa, its actually closer to 0.5 net charge (not all of the molecules have COO-, but they definitely have NH3+).\nIf you are at amino pKa, its actually closer to -0.5 net charge (all molecules have COO-, but not all have NH3+).\nAs pH range decreases, you have more positive charge.\n",
    instruction: "Organize this into bullet point notes",
    });
    console.log(response.data.choices);
    res.json(0);
//   const openai = new OpenAIApi(configuration);
//   const response = await openai.createEdit({
//   model: "text-ada-001",
//   input: "1/11/23:\n At acid pKa, 1:1 HA/A-.\nAt 1 pH lower (1 order of magnitude more H+), 10:1 HA/A-.\nAt 1 pH higher (1 order of magnitude less H+), 1:10 HA/A-.\nHenderson Hasselback: pH=pKa+log(A-/HA)\n\n1/13/23:\npI: average the two pKas around the neutral range (when molecule is zwitterion)\nIf you are at carboxy pKa, its actually closer to 0.5 net charge (not all of the molecules have COO-, but they definitely have NH3+).\nIf you are at amino pKa, its actually closer to -0.5 net charge (all molecules have COO-, but not all have NH3+).\nAs pH range decreases, you have more positive charge.\n",
//   instruction: "Please organize the following ideas into a coherent notes document with complete sentences." + 
//   " Format the document as headers separated by whitespace with dashes to represent bullet points:"
//   });
    // let feed = "";
    // if (req.body.id !== "")
    // {
    //     feed = await User.findById(req.body.id);
    // }

<<<<<<< HEAD
    // let message = "Please organize the following ideas into a coherent notes document with complete sentences." + 
    // " Format the document as headers separated by whitespace with dashes to represent bullet points: \n";
    // for (let i = 0; i < req.body.input.length; i++)
    // {
    //     let input = req.body.input[i];
    //     input = input.replace(/<br>/g, '\n');
    //     message += input + ' ';
    // }
    // message = message.substring(0, message.length - 1);

    // const response = await cohere.generate({
    //     model: '0986e558-3929-4dae-a381-7d1aa3625f91-ft',
    //     prompt: message,
    //     max_tokens: 500,
    //     temperature: 0.5,
    //     k: 0,
    //     stop_sequences: [],
    //     return_likelihoods: 'NONE'
    // });
    // // Send the response back to the client

    // if (req.body.id !== "")
    // {
    //     let updatedMessages = feed.messages;
    //     updatedMessages.push(req.body.input);
    //     updatedMessages.push(response.body.generations[0].text);
    //     const post = await User.findByIdAndUpdate(req.body.id, {
    //         messages: updatedMessages,
    //     }, { new: true });
    //     post.save();
    // }
    // const text = response.body.generations[0].text;

    // const sentences = text.match(/[^\.!\?]+[\.!\?]+/g);

    // const header = sentences[0];
    // const headerReal = `<h1>${header}</h1>`;
    // const bulletPoints = sentences.slice(1).map(sentence => ` - ${sentence}\n`);
    // res.send(headerReal + bulletPoints);
=======
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
    const text = response.body.generations[0].text;
    res.send(text);

// const sentences = text.match(/[^\.!\?]+[\.!\?]+/g);

// const header = sentences[0];
// const headerReal = `<h1>${header}</h1>`;
// const bulletPoints = sentences.slice(1).map(sentence => ` - ${sentence}<br>`);
// res.send(headerReal + bulletPoints.join(''));

>>>>>>> 2a9272a58c37dbc3989d6c085584e51eeee7b281
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