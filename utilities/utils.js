const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
    service: "Zoho",
    auth: {
        user: "awesomeaacommands@gmail.com",
        pass: process.env.ZOHO_PASSWORD
    }
});