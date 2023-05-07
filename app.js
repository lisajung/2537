const express = require('express');
const app = express();
const session = require('express-session');
const usersModel = require('./models/w1users');
const bcrypt = require('bcrypt');
const expireTime = 60 * 60 * 1000;

// 1 - import
let ejs = require('ejs');
// 2 - set view engine to ejs
app.set('view engine', 'ejs')

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
    res.render('homepage.ejs', { title: 'Welcome', signupUrl: '/signup', loginUrl: '/login' });

});

app.get('/signup', (req, res) => {
    if (req.session.GLOBAL_AUTHENTICATED) {
        res.redirect('/protectedRoute');
        return;
    }
    // res.send(`
    //     <h1>Sign Up</h1>
    //     <form action="/signup" method="post">
    //         <input type="text" name="username" placeholder="Username" />
    //         <br>
    //         <input type="password" name="password" placeholder="Password" />
    //         <br>
    //         <input type="submit" value="Sign up" />
    //     </form>
    // `);
    res.render('signin.ejs', { title: 'Sign Up', signupUrl: '/signup' })
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
    // res.send(`
    // <h1>Login</h1>
    //   <form action="/login" method="post">
    //     <input type="text" name="username" placeholder="Enter your username" />
    //     <br>
    //     <input type="password" name="password" placeholder="Enter your password" />
    //     <br>
    //     <input type="submit" value="Login" />
    //   </form>
    // `)
    res.render('login.ejs', { title: 'Login', loginUrl: '/login' })
});

//GLOBAL_AUTHENTICATED = false;
app.use(express.urlencoded({ extended: false }))

const Joi = require('joi');

app.post('/login', async (req, res) => {
    // set global variable to true if user is authenticated

    //sanitize input using joi
    const schema =
        Joi.string().min(3)

    try {
        console.log("req.body.password " + req.body.password);
        const value = await schema.validateAsync(req.body.password);
        console.log("value " + value);
    }
    catch (err) {
        console.log(err);
        console.log("Password cannot be less than 3 characters long");
        return res.send("Password cannot be less than 3 characters long");
    }

    try {
        const result = await usersModel.findOne({
            username: req.body.username,
        })
        if (await bcrypt.compareSync(req.body.password, result?.password)) {
            req.session.GLOBAL_AUTHENTICATED = true;
            req.session.loggedUsername = req.body.username;
            req.session.loggedPassword = result?.password;
            req.session.loggedType = result?.type;
            req.session.cookie.maxAge = expireTime;
            if (req.session.loggedType === 'administrator') {
                res.redirect('/protectedRouteForAdminsOnly')
            } else {
                res.redirect('/protectedRoute');
            }
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
        if (req.originalUrl.startsWith('/api/')) {
            return res.status(401).json({ error: 'not authenticated' });
        } else {
            return res.redirect('/login');
        }
    } else {
        next();

    }
}

app.use(authenticatedOnly);

app.use(express.static('public')) // built-in middleware function in Express. It serves static files and is based on serve-static.
app.get('/protectedRoute', (req, res) => {
    // serve one of the three images randomly
    //generate a random number between 1 and 3
    const username = req.session.loggedUsername;
    const randomImageNumber = Math.floor(Math.random() * 3) + 1;
    const imageName = `00${randomImageNumber}.png`;

    // send data to ejs template

    console.log(req.session.loggedType)
    console.log(req.session.loggedUsername)
    res.render('protectedRoute.ejs', {
        "x": username, "y": imageName, "z": "/logout", "isAdmin": req.session.loggedType == 'administrator', "todos": [
            { name: "todo1", done: false },
            { name: "todo2", done: true },
            { name: "todo3", done: false }
        ]
    })
});



app.get('/logout', (req, res) => {
    req.session.destroy();
    var html = `
    You are logged out.
    `;
    res.send(html);
});

//only for admin users
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

app.get('/protectedRouteForAdminsOnly', async (req, res) => {
    const username = req.session.loggedUsername;
    const randomImageNumber = Math.floor(Math.random() * 3) + 1;
    const imageName = `00${randomImageNumber}.png`;



    console.log(req.session.loggedType)
    console.log(req.session.loggedUsername)
    const filter = {};
    const all = await usersModel.find(filter);
    console.log(all);
    res.render('protectedRoute.ejs', {
        "x": username, "y": imageName, "z": "/logout", "isAdmin": req.session.loggedType == 'administrator', "users": all
    })
});

app.post('/promoteToAdmin', async (req, res) => {
    try {

        // 1 - find the user to promote in the database
        const userToPromote = await usersModel.findOne({ username: req.body.username});

        // 2 - update the user's type to administrator
        userToPromote.type = 'administrator';
        await userToPromote.save();

        // 3 - redirect to the protected route for admins
        res.redirect('/protectedRouteForAdminsOnly');

    } catch (err) {
        console.error(err);
    }
});

app.post('/demoteToUser', async (req, res) => {
    try {
        const userToDemote = await usersModel.findOne({ username: req.body.username });
        userToDemote.type = 'non-administrator';
        await userToDemote.save();
        res.redirect('/protectedRouteForAdminsOnly');
    } catch (error) {
        console.log(error);
    }
});

app.get('*', (req, res) => {
    res.status(404).send('<h1> 404 Page not found</h1>');
});

module.exports = app;