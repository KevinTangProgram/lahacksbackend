const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cohere = require('cohere-ai');
cohere.init('EGsygyyzay3tG3CbLuJKmI1zLbWn4wqFYoz321AM'); // This is your trial API key
connection = "mongodb+srv://KevinTang:0hmlsVIAJwbjWuTf@axs-tutoring.c24c5cd.mongodb.net/?retryWrites=true&w=majority";//2xvy-BTPm7zNyvj

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

const User = require("./models/users");

app.get('/auth', async (req, res) => {
    let flag = "";
    const feed = await User.find();
    for (let i = 0; i < feed.length; i++)
    {
        if (feed[i].name === req.query.user)
        {
            if (crypto.SHA256(req.query.pass).toString() === feed[i].password)
            {
                flag = feed[i]._id;
                break;
            }
        }
    }
    res.json(flag);
})

//const app = express();

// Define your API endpoints here
app.get('/api/cohere', async (req, res) => {
  // Call the cohere.generate function

  let message = req.query.input;
  if (req.query.input[req.query.input.length - 1] === ' ')
  {
    message = req.query.input.substring(0, req.query.input.length - 1);
  }
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
  res.send(response.body.generations[0].text);
});