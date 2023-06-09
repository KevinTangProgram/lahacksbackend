const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
connection = "mongodb+srv://aaronkwan:" + process.env.MONGO_PASSWORD + "@fullstackv1.lqn0ait.mongodb.net/?retryWrites=true&w=majority";

const app = express();
app.use(express.json());
app.use(cors());

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
const User = require("./models/user");

const user = await User.findOne({ 'info.name': "Aaron" });
console.log(user);