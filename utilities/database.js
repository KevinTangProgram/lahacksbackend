// // Boilerplate:
// const express = require('express');
// // const cors = require('cors');
// // const Dotenv = require("dotenv").config();
// const database = express();
// // database.use(express.json());
// // database.use(cors());
// // Setup:
// const mongoose = require('mongoose');
// connection = "mongodb+srv://aaronkwan:" + process.env.MONGO_PASSWORD + "@fullstackv1.lqn0ait.mongodb.net/?retryWrites=true&w=majority";
// const connectDB = async () => {
//     mongoose.set('strictQuery', false);
//     await mongoose
//         .connect(connection,
//             {
//                 useNewUrlParser: true,
//                 useUnifiedTopology: true,
//             })
//         .then(() => console.log("Connected to DB"))
//         .catch(console.error);
// }
// connectDB().then(() => {
//     // Database connection established, continue setting up the app
//     // ... Define your routers and endpoints here
//     database.listen(8080, () => {
//         console.log('Server listening on port 8080');
//     });
// });
const User = require("../models/user");

// Exports:
module.exports = {User};