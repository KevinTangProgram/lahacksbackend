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

app.post('/post', async (req, res) => {

})

//const app = express();

// Define your API endpoints here
app.get('/api/cohere', async (req, res) => {
  // Call the cohere.generate function
  const response = await cohere.generate({
    model: 'command-xlarge-nightly',
    prompt: req.query.input,
    max_tokens: 300,
    temperature: 1,
    k: 0,
    stop_sequences: [],
    return_likelihoods: 'NONE'
  });
  // Send the response back to the client
  res.send(response.body.generations[0].text);
});