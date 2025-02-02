import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const __dirname = import.meta.dirname;

const app = express();
const port = 80;

// Database
const mongoURI = `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/users?authSource=admin`;
const mongoURI2 = `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/transactions?authSource=admin`;

let userDb;
let transactionsDb;

try {
    userDb = mongoose.createConnection(mongoURI, { useNewUrlParser: true });
    transactionsDb = mongoose.createConnection(mongoURI2, { useNewUrlParser: true });

    await userDb.asPromise();
    await transactionsDb.asPromise();

    console.log("Connected to MongoDb.");
}
catch (err) {
    throw `Error: Cannot connect to Mongodb: ${err}.`;
}

// IDK if this is just me wilding, but I do not remember MongoDb needing schemas to write to their noSQL stuff
// But apparently they do so
const userSchema = new mongoose.Schema({
    name: String,
    balance: Number
});
const User = userDb.model('User', userSchema);

const transactionSchema = new mongoose.Schema({
    from: String,
    to: String,
    amount: Number,
    html: String
}, { timestamps: true });
const Transaction = transactionsDb.model('Transaction', transactionSchema);

// Continue w/ Express

// Configs
app.use(cookieParser());
app.use(cors({  // Maybe we can yap abt CORS some other day but for now goodbye - also it's same-origin so this doesn't even matter lowkey
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'Public')));

// Enforce JSON
app.use((req, res, next) => {
    if (req.method === 'POST' && req.headers['content-type'] !== 'application/json') {
        return res.status(400).json({ error: 'Error: Only application/json content-type is allowed for POST requests.' });
    }
    next();
});

app.use(express.json());
app.post('/add-user', async (req, res) => {

    if (req.body.name == undefined) {
        return res.status(400).json({ error: 'Error: You must provide a name for the user.' });
    }

    if (await User.findOne({ name: req.body.name }))
    {
        return res.status(400).json({ error: 'Error: Please choose a different username.' });
    }

    const newUser = new User({
        name: req.body.name,
        balance: 500.00
    });

    await newUser.save();

    res.cookie('username', req.body.name, {
        httpOnly: false,    // Disable for XSS Demo, but even if this is true it lowkey would have still worked
        secure: false
    });

    return res.status(200).send("We good.");

});

app.get('/get-user', async (req, res) => {
    let user = await User.findOne({ name: req.cookies.username });

    if (user == undefined || req.cookies.username == undefined)
    {
        return res.status(400).json({ error: 'Error: This is weird. Your username cookie is undefined.' });
    }

    let balance = user.balance;
    return res.status(200).send({balance: parseFloat(balance).toFixed(2), username: req.cookies.username});
});

app.post('/new-transaction', async (req, res) => {
    let sender = await User.findOne({ name: req.cookies.username });
    if (sender == undefined || req.cookies.username == undefined)
    {
        return res.status(400).json({ error: 'Error: This is weird. Your username cookie is undefined.' });
    }

    if (req.body.html == undefined)
    {
        return res.status(400).json({ error: 'Error: You must provide a message. Use the html field. '});
    }
   
    if (req.body.recipient == undefined || req.body.amount == undefined)
    {
        return res.status(400).json({ error: 'Error: You must provide a value for the amount of $ to transfer, and the recipient username.' });
    }

    let recipient = await User.findOne({ name: req.body.recipient });
    if (recipient == undefined)
    {
        return res.status(400).json({ error: 'Error: Invalid recipient username. '});
    }
    
    if (isNaN(req.body.amount))
    {
        return res.status(400).json({ error: 'Error: Look I mean, I don\'t rly care if you go into debt by buying hawk tuah coin but I need an integer for the amount of money you are sending.' });
    }

    let amount = parseFloat(req.body.amount);

    sender.balance = sender.balance - amount;
    recipient.balance = recipient.balance + amount;
    
    try
    {
        await sender.save();
        await recipient.save();
    }
    catch(err)
    {
        return res.status(400).json({ error: `Error: ${err}.` });
    }

    // Add transaction
    let newTrans = new Transaction({
        from: sender.name,
        to: recipient.name,
        amount: amount,
        html: req.body.html
    });

    await newTrans.save();

    return res.status(200).json({ message: 'Done!' });
});

app.get('/get-transactions', async (req, res) => {
    const allTransactions = await Transaction.find().sort({ createdAt: 1 });
    return res.status(200).json(allTransactions);
});

// Redirect root to login.html to start
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Public', 'login.html'));
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
