const express = require('express');
const app = express();
const session = require('express-session');
const usersModel = require('./models/w1users');
const bcrypt = require('bcrypt');

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
    secret: 'foo',
    store: dbStore,
    resave: false,
    saveUninitialized: false,
}));

//public route
app.get('/', (req, res) => {
    res.send('<h1> Hello World <h1>');
});


app.get('/login', (req, res) => {
    res.send(`
      <form action="/login" method="post">
        <input type="text" name="username" placeholder="Enter your username" />
        <input type="password" name="password" placeholder="Enter your password" />
        <input type="submit" value="Login" />
      </form>
    `)
});

//GLOBAL_AUTHENTICATED = false;
app.use(express.urlencoded({ extended: false }))

app.post('/login', async (req, res) => {
    // set global variable to true if user is authenticated
    try {
        const result = await usersModel.findOne({
            username: req.body.username,
        })
        if (bcrypt.compareSync(req.body.password, result?.password)) {
            req.session.GLOBAL_AUTHENTICATED = true;
            req.session.loggedUsername = req.body.username;
            req.session.loggedPassword = req.body.password;
            res.redirect('/');
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
        return res.status(401).json({ error: 'not authenticated' });
    };
    next(); // allow next route to run 
};
app.use(authenticatedOnly);

app.use(express.static('public')) // built-in middleware function in Express. It serves static files and is based on serve-static.
app.get('/protectedRoute', (req, res) => {
    // serve one of the three images randomly
    //generate a random number between 1 and 3
    const randomImageNumber = Math.floor(Math.random() * 3) + 1;
    const imageName = `00${randomImageNumber}.png`;
    HTMLResponse = `
        <h1> Protected Route <h1> 
        <br>
        <img src="${imageName}" />
        `
    res.send(HTMLResponse);
});


// only for admin users
const protectedRouteForAdminsOnlyMiddlewareFunction = async (req, res, next) => {
    try {
        const result = await usersModel.findOne(
            {
                username: req.session.loggedUsername,
            }
        )
        if (result?.type != 'administrator') {
            return res.send('<h1> You are not an admin <h1>')
        }
        next(); // allow next route to run 

    } catch (error) {
        console.log(error);
    }
};
app.use(protectedRouteForAdminsOnlyMiddlewareFunction);

app.get('/protectedRouteForAdminsOnly', (req, res) => {
    res.send('<h1> protectedRouteForAdminsOnly <h1>');
}); //may not need this stuff here deleted in vid

module.exports = app;




