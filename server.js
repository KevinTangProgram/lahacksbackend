const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cohere = require('cohere-ai');
const crypto = require('crypto-js');
cohere.init('EGsygyyzay3tG3CbLuJKmI1zLbWn4wqFYoz321AM'); // This is your trial API key
connection = "mongodb+srv://aaronkwan:Zekemongodb128@fullstackv1.lqn0ait.mongodb.net/?retryWrites=true&w=majority"

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

    const feed = await User.findById(req.body.id);
    
    let message = "";
    for (let i = 0; i < req.body.input.length; i++)
    {
        message += req.body.input[i] + ' ';
    }
    message = message.substring(0, message.length - 1);

    const response = await cohere.generate({
        model: 'command-xlarge-nightly',
        prompt: message,
        max_tokens: 300,
        temperature: 1,
        k: 0,
        stop_sequences: [],
        return_likelihoods: 'NONE'
    });
    // Send the response back to the client

    let updatedMessages = feed.messages;
    updatedMessages.push(req.body.input);
    updatedMessages.push(response.body.generations[0].text);
    const post = await User.findByIdAndUpdate(req.body.id, {
        messages: updatedMessages,
    }, { new: true });
    post.save();

    res.send(response.body.generations[0].text);
});