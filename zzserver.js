// Boilerplate:
const express = require('express');
const cors = require('cors');
const Dotenv = require("dotenv").config();
const app = express();
app.use(express.json());
app.use(cors());
// Setup:

// Prompter:
const prompter = require('./utilities/prompter.js');
app.use('/oasis/generate', prompter);
// Authenticator:
const authenticator = require('./utilities/authenticator.js');
app.use('/user', authenticator);



// Endpoints:


<<<<<<< HEAD
app.put('/oasis/promptx1', async (req, res) => {
    let message = "Detect any message IDs that may be headers in the given sequence of notes. " + 
    "Return a line starting with '[headers]' followed by the IDs of any detected headers, separated by spaces. " + 
    "If no headers are detected, return '[headers]' only.\n\n" + 

    "Example:\n" +
    "'[ID:1] Current Date\n" +
    "[ID:2] Sentence 1\n" +
    "[ID:3] Sentence 2\n" +
    "[ID:4] New Topic'\n\n" +
    
    "Response:\n" +
    "[headers] [ID:1] [ID:4]\n\n" +
    
    "Your messages:\n";

    for (let i = 1; i <= req.body.rawMessage.length; i++) {
        message += "[ID:" + i.toString() + "] " + req.body.rawMessage[i] + "\n";
    }
    console.log(message);

    const openai = new OpenAIApi(configuration);
    const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: message,
        max_tokens: 100,
        temperature: 0,
    });

    let processedResponse = [];
    let headers = [];
    let messageID = "";
    for (let i = 0; i < response.data.choices[0].text.length - 4; i++) 
    {
        if (response.data.choices[0].text[i] === "[" && response.data.choices[0].text[i + 1] === "I" && 
        response.data.choices[0].text[i + 2] === "D" && response.data.choices[0].text[i + 3] === ":")
        {
            i+=4;
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

app.put('/oasis/promptx2/header', async (req, res) => {
    let message = "You are given a portion of a '" + req.body.header + "' notes document with messages attached to ID numbers. " +
    "First, read through the messages, generating headers to group similar messages. " +
    "If an existing message is similar to your header, mark that message as a header by adding an 'H' to its ID. " +
    "However, if that message includes any extra details, do not remove the message, just insert your header above it. " +
    "Finally, rephrase each individual message as a complete sentence.\n\n" +

    "Return ONLY one string with all rephrased messages and headers. " + 
    'Remember that original messages marked as headers have IDs of the form "[ID:1H]", ' +
    'newly inserted headers have IDs of the form "[ID:header]", ' +
    "and all other messages have the same IDs as before.\n\n" +
    
    "Example Response:\n" +
    "'[ID:1H] Existing header\n" +
    "[ID:2] Rephrased sentence 1\n" +
    "[ID:3] Rephrased sentence 2\n" +
    "[ID:header] Generated header\n" +
    "[ID:4] Rephrased sentence 3'\n\n" +
    
    "Your Messages:\n";
    
    for (let i = 0; i < req.body.rawMessage.length; i++) {
        message += "[ID:" + i.toString() + "] " + req.body.rawMessage[i] + "\n";
    }

    const openai = new OpenAIApi(configuration);
    const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{role: "user", content: message}],
        max_tokens: 500,
        temperature: 0,
    });
    console.log(response.data.choices[0].message.content);

    // let response = {data: {choices: [{text: "[ID:1H] Existing header: Acid-Base Equilibria\n" +
    //     "[ID:header] Generated header: Henderson Hasselback Equation\n" +
    //     "[ID:2] At 1 pH higher than the acid pKa, the ratio of HA to A- is 1:10.\n" +
    //     "[ID:3] At the acid pKa, the ratio of HA to A- is 1:1.\n" +
    //     "[ID:4] At 1 pH lower than the acid pKa, the ratio of HA to A- is 10:1.\n" +
    //     "[ID:header] Generated header: pI\n" +
    //     "[ID:5] The pI is the average of the two pKas around the neutral range when the molecule is a zwitterion.\n" +
    //     "[ID:header] Generated header: Net Charge\n" +
    //     "[ID:6] At the carboxy pKa, the net charge is closer to 0.5.\n" +
    //     "[ID:7] At the amino pKa, the net charge is closer to -0.5.\n" +
    //     "[ID:header] Generated header: Other pH Facts\n" +
    //     "[ID:8] As the pH range decreases, the positive charge increases.\n" +
    //     "[ID:9] The pH can sometimes vary in the body.\n" +
    //     "[ID:header] Generated header: Amino Acids\n" +
    //     "[ID:10] Amino acids have a basic and acidic end.\n" +
    //     "[ID:11] They are the building blocks of proteins.\n" +
    //     "[ID:header] Generated header: Substitution Reactions\n" +
    //     "[ID:12] There are two types of substitution reactions: sn1 and sn2.\n" + 
    //     "[ID:13] Sn1 reactions happen faster than sn2 reactions."}]}};

    let processedResponse = [];
    let headers = [];
    let nonHeaders = [];
    let messageID = "";
    for (let i = 0; i < response.data.choices[0].message.content.length - 4; i++) 
    {
        if (response.data.choices[0].message.content[i] === "[" && response.data.choices[0].message.content[i + 1] === "I" && 
        response.data.choices[0].message.content[i + 2] === "D" && response.data.choices[0].message.content[i + 3] === ":")
        {
            i+=4;
            while (response.data.choices[0].message.content[i] !== "]")
            {
                messageID += response.data.choices[0].message.content[i];
                i++;
            }
            i+=2;
            let lineMessage = "";
            for (; i < response.data.choices[0].message.content.length; i++)
            {
                if (response.data.choices[0].message.content[i + 1] === "[" && response.data.choices[0].message.content[i + 2] === "I" && 
                response.data.choices[0].message.content[i + 3] === "D" && response.data.choices[0].message.content[i + 4] === ":")
                {
                    break;
                }
                else
                {
                    lineMessage += response.data.choices[0].message.content[i];
                }
            }
            if (messageID.includes("H") || messageID.includes("header"))
            {
                lineMessage = lineMessage.replace("Generated header: ", "");
                headers.push([i, lineMessage]);
            }
            else
            {
                nonHeaders.push([i, lineMessage]);
            }
            messageID = "";
        }
    }
    headers.push([response.data.choices[0].message.content.length + 1, ""])
    let j = 0;
    for (let i = 0; i < headers.length; i++)
    {
        for (; j < nonHeaders.length; j++)
        {
            if (headers[i][0] < nonHeaders[j][0])
            {
                processedResponse.push({header: true, message: headers[i][1]});
                break;
            }
            else
            {
                processedResponse.push({header: false, message: nonHeaders[j][1]});
            }
        }
    }
    res.json(processedResponse);
})

app.put('/oasis/promptx2/noheader', async (req, res) => {
    let message = "You are given a portion of a '" + req.body.header + "' notes document with messages attached to ID numbers. " +
    "Identify the most likely headers, marking them by adding an 'H' to their message ID. " +
    "Then rephrase each individual message/header. " +
    "Don't combine or omit messages.\n\n" +

    "Example Response:\n" +
    "[ID:1H] Identified header\n" +
    "[ID:2] Rephrased sentence\n" +
    "[ID:3H] Identified header\n\n" +
    
    "Return ONLY one string with all rephrased messages/headers. " + 
    "Remember that messages marked as headers have IDs of the form '[ID:1H]'.\n\n" +
    
    "Your Messages:\n"
    
    
    for (let i = 0; i < req.body.rawMessage.length; i++) {
        message += "[ID:" + i.toString() + "] " + req.body.rawMessage[i] + "\n";
    }

    const openai = new OpenAIApi(configuration);
    const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: message,
        max_tokens: 500,
        temperature: 0,
    });
    // console.log(response.data.choices[0].text);

    let processedResponse = [];
    let headers = [];
    let nonHeaders = [];
    let messageID = "";
    for (let i = 0; i < response.data.choices[0].text.length - 4; i++) 
    {
        if (response.data.choices[0].text[i] === "[" && response.data.choices[0].text[i + 1] === "I" && 
        response.data.choices[0].text[i + 2] === "D" && response.data.choices[0].text[i + 3] === ":")
        {
            i+=4;
            while (response.data.choices[0].text[i] !== "]")
            {
                messageID += response.data.choices[0].text[i];
                i++;
            }
            i+=2;
            let lineMessage = "";
            for (; i < response.data.choices[0].text.length; i++)
            {
                if (response.data.choices[0].text[i + 1] === "[" && response.data.choices[0].text[i + 2] === "I" && 
                response.data.choices[0].text[i + 3] === "D" && response.data.choices[0].text[i + 4] === ":")
                {
                    break;
                }
                else
                {
                    lineMessage += response.data.choices[0].text[i];
                }
            }
            if (messageID.includes("H") || messageID.includes("header"))
            {
                lineMessage = lineMessage.replace("Generated header: ", "");
                headers.push([i, lineMessage]);
            }
            else
            {
                nonHeaders.push([i, lineMessage]);
            }
            messageID = "";
        }
    }
    headers.push([response.data.choices[0].text.length + 1, ""])
    let j = 0;
    for (let i = 0; i < headers.length; i++)
    {
        for (; j < nonHeaders.length; j++)
        {
            if (headers[i][0] < nonHeaders[j][0])
            {
                processedResponse.push({header: true, message: headers[i][1]});
                break;
            }
            else
            {
                processedResponse.push({header: false, message: nonHeaders[j][1]});
            }
        }
    }
    res.json(processedResponse);
})

app.put('/oasis/promptx3/bullet', async (req, res) => {
    let message = "You are given a portion of a '" + req.body.header + "' notes document with messages attached to ID numbers. " +
    "Use the information in these messages to generate a coherent notes document with complete sentences. " + 
    "Use headers to group similar messages. You may add your own information, messages, and headers, " +
    "but please preserve the beginning and end information so that the new messages can still link with the rest of the notes document.\n\n" +

    "Format your messages as '[ID:<number>] <message content>', where <number> is the original ID where you obtained the information from. " +
    "Each message must be linked to exactly one ID, no matter what. " +
    "If you add a header using content from a message, add a 'H' to its ID (E.G.:'[ID:1H]'). " +
    "If you add a header using self-generated content, mark it with '[ID:header]' instead. " +
    "If you add a message using self-generated content, mark it with '[ID:message]'. " +
    "Additionally, if there is a message with unclear intent or missing information, add a '?' to its ID (E.G.:'[ID:3?]').\n\n" +
    
    "Return ONLY one string with the final messages attached to IDs. " +
    "Remember that each message should only have 1 ID number, and that headers are of the form '[ID:1H]' or '[ID:header].'\n\n" +
    
    "Example Response:\n" +
    "'[ID:1H] Header from ID:1\n" +
    "[ID:2] Sentence from ID:2\n" +
    "[ID:header] Self-generated header\n" +
    "[ID:message] Self-generated message\n" +
    "[ID:3?] Sentence from unclear ID:3'\n\n" +
    
    "Your Messages:\n"

    for (let i = 0; i < req.body.rawMessage.length; i++) {
        message += "[ID:" + i.toString() + "] " + req.body.rawMessage[i] + "\n";
    }

    console.log(message);

    const openai = new OpenAIApi(configuration);
    const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: message,
        max_tokens: 1000,
        temperature: 0,
    });

    //console.log(response.data.choices[0].text);

    let processedResponse = [];
    let headers = [];
    let nonHeaders = [];
    let messageID = "";
    for (let i = 0; i < response.data.choices[0].text.length - 4; i++) 
    {
        if (response.data.choices[0].text[i] === "[" && response.data.choices[0].text[i + 1] === "I" && 
        response.data.choices[0].text[i + 2] === "D" && response.data.choices[0].text[i + 3] === ":")
        {
            i+=4;
            while (response.data.choices[0].text[i] !== "]")
            {
                messageID += response.data.choices[0].text[i];
                i++;
            }
            i+=2;
            let lineMessage = "";
            for (; i < response.data.choices[0].text.length; i++)
            {
                if (response.data.choices[0].text[i + 1] === "[" && response.data.choices[0].text[i + 2] === "I" && 
                response.data.choices[0].text[i + 3] === "D" && response.data.choices[0].text[i + 4] === ":")
                {
                    break;
                }
                else
                {
                    lineMessage += response.data.choices[0].text[i];
                }
            }
            if (messageID.includes("H") || messageID.includes("header"))
            {
                lineMessage = lineMessage.replace("Generated header: ", "");
                headers.push([i, lineMessage]);
            }
            else
            {
                nonHeaders.push([i, lineMessage]);
            }
            messageID = "";
        }
    }
    headers.push([response.data.choices[0].text.length + 1, ""])
    let j = 0;
    for (let i = 0; i < headers.length; i++)
    {
        for (; j < nonHeaders.length; j++)
        {
            if (headers[i][0] < nonHeaders[j][0])
            {
                processedResponse.push({header: true, message: headers[i][1]});
                break;
            }
            else
            {
                processedResponse.push({header: false, message: nonHeaders[j][1]});
            }
        }
    }
    res.json(processedResponse);
})
=======
>>>>>>> a5ff128e583002dcfec39a1b9b6af12a10ba4f52
