const express = require('express');
const app = express();
const session = require('express-session');
const usersModel = require('./models/w1users');

// const { MongoDBStore } = require('connect-mongodb-session');
var MongoDBStore = require('connect-mongodb-session')(session);


app.listen(3000, () => {
    console.log('server is running on port 3000');
});

var dbStore = new MongoDBStore({
    uri: 'mongodb://localhost:27017/connect_mongodb_session_test',
    collection: 'mySessions'
});


//TODO
// replace the in-memory array with a database session store
app.use(session({
    secret: 'foo',
    store: dbStore,
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
    const result = await usersModel.find({
        username: req.body.username,
        password: req.body.password
    })
    if (result) {
        req.session.GLOBAL_AUTHENTICATED = true;
        req.session.loggedUsername = req.body.username;
        req.session.loggedPassword = req.body.password;
    }
    res.redirect('/');
});


// only for authenticated users
const authenticatedOnly = (req, res, next) => {
    if (!req.session.GLOBAL_AUTHENTICATED) {
        return res.status(401).json({ error: 'not authenticated' });
    };
    next(); // allow next route to run 
};
app.use(authenticatedOnly);

app.get('/protectedRoute', (req, res) => {
    res.send('<h1> protectedRoute <h1>');
});


// only for admin users
const protectedRouteForAdminsOnlyMiddlewareFunction = async (req, res, next) => {
    const result = await usersModel.findOne(
        {
            username: req.session.loggedUsername,
            password: req.session.loggedPassword
        }
    )
    if (result?.type != 'administrator') {
        return res.send('<h1> You are not an admin <h1>')
    }
    next(); // allow next route to run 
};
app.use(protectedRouteForAdminsOnlyMiddlewareFunction);

app.get('/protectedRouteForAdminsOnly', (req, res) => {
    res.send('<h1> protectedRouteForAdminsOnly <h1>');
});

module.exports = app;




