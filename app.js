const express = require('express');
const app = express();
const session = require('express-session');
const usersModel = require('./models/w1users');
const bcrypt = require('bcrypt');
const expireTime = 60 * 60 * 1000;
// const { MongoDBStore } = require('connect-mongodb-session');
var MongoDBStore = require('connect-mongodb-session')(session);

const dotenv = require('dotenv');
dotenv.config();

var dbStore = new MongoDBStore({
    // uri: 'mongodb://localhost:27017/connect_mongodb_session_test', 
    uri: `mongodb+srv://${process.env.ATLAS_DB_USER}:${process.env.ATLAS_DB_PASSWORD}@cluster0.pkjtbxx.mongodb.net/comp2537w1?retryWrites=true&w=majority`,
    collection: 'mySessions'
});


//TODO
// replace the in-memory array with a database session store
app.use(session({
    secret: `${process.env.SESSIONS_SECRET}`,
    store: dbStore,
    resave: false,
    saveUninitialized: false,
}));


app.get('/', (req, res) => {
    if (req.session.GLOBAL_AUTHENTICATED) {
        res.redirect('/protectedRoute');
        return;
    }
    res.send(`
        <h1>Welcome</h1>
        <p>Please <a href="/signup">Sign up</a> or <a href="/login">Log in</a></p>
    `);
});

app.get('/signup', (req, res) => {
    if (req.session.GLOBAL_AUTHENTICATED) {
        res.redirect('/protectedRoute');
        return;
    }
    res.send(`
        <h1>Sign Up</h1>
        <form action="/signup" method="post">
            <input type="text" name="username" placeholder="Username" />
            <br>
            <input type="password" name="password" placeholder="Password" />
            <br>
            <input type="submit" value="Sign up" />
        </form>
    `);
});

const handleUserSignup = async (req, res, next) => {
    try {
        const { username, password, email } = req.body;

        // Check if user already exists in the database
        const userExists = await usersModel.findOne({ username });
        if (userExists) {
            return res.status(400).send('Username already exists');
        }

        // Hash the user's password before storing it in the database
        const hashedPassword = bcrypt.hashSync(password, 10);

        // Create a new user object and save it to the database
        const newUser = new usersModel({
            username,
            password: hashedPassword,
        });
        await newUser.save();

        // Set the user as authenticated and redirect to the protected route
        req.session.GLOBAL_AUTHENTICATED = true;
        req.session.loggedUsername = username;
        req.session.loggedPassword = hashedPassword;
        req.session.cookie.maxAge = expireTime;
        res.redirect('/protectedRoute');
    } catch (error) {
        console.log(error);
    }
};

app.use(express.urlencoded({ extended: false }));
app.post('/signup', handleUserSignup);


app.get('/login', (req, res) => {
    if (req.session.GLOBAL_AUTHENTICATED) {
        res.redirect('/protectedRoute');
        return;
    }
    res.send(`
    <h1>Login</h1>
      <form action="/login" method="post">
        <input type="text" name="username" placeholder="Enter your username" />
        <br>
        <input type="password" name="password" placeholder="Enter your password" />
        <br>
        <input type="submit" value="Login" />
      </form>
    `)
});

//GLOBAL_AUTHENTICATED = false;
app.use(express.urlencoded({ extended: false }))

// const Joi = require('joi');

app.post('/login', async (req, res) => {
    // set global variable to true if user is authenticated

    //sanitize input using joi
    // const schema = Joi.object({
    //     password: Joi.string().min(3).required()
    // });

    // try {
    //     console.log("req.body.password " + req.body.password);
    //     const value = await schema.validateAsync(req.body);
    // }
    // catch (err) {
    //     console.log(err);
    //     console.log("Password cannot be less than 3 characters long");
    //     return res.send("Password cannot be less than 3 characters long");
    // }

    try {
        const result = await usersModel.findOne({
            username: req.body.username,
        })
        if (await bcrypt.compareSync(req.body.password, result?.password)) {
            req.session.GLOBAL_AUTHENTICATED = true;
            req.session.loggedUsername = req.body.username;
            req.session.loggedPassword = result?.password;
            req.session.cookie.maxAge = expireTime;
            res.redirect('/protectedRoute');
        } else {
            res.send('Wrong password');
        }
    } catch (error) {
        console.log(error);
    }


});


// only for authenticated users
const authenticatedOnly = (req, res, next) => {
    if (!req.session.GLOBAL_AUTHENTICATED) {
        // return res.status(401).json({ error: 'not authenticated' });
        res.redirect('/');
    };
    next(); // allow next route to run 
};
app.use(authenticatedOnly);

app.use(express.static('public')) // built-in middleware function in Express. It serves static files and is based on serve-static.
app.get('/protectedRoute', (req, res) => {
    // serve one of the three images randomly
    //generate a random number between 1 and 3
    const username = req.session.loggedUsername;
    const randomImageNumber = Math.floor(Math.random() * 3) + 1;
    const imageName = `00${randomImageNumber}.png`;
    HTMLResponse = `
        <h1> Welcome, ${username}! <h1> 
        <br>
        <img src="${imageName}" />
        <br>
        <a href="/logout">Log Out</a>
        `
    res.send(HTMLResponse);
});



app.get('/logout', (req, res) => {
    req.session.destroy();
    var html = `
    You are logged out.
    `;
    res.send(html);
});


app.get('*', (req, res) => {
    res.status(404).send('<h1> 404 Page not found</h1>');
});

module.exports = app;