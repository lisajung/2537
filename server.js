const express = require('express');
const app = express();
const session = require('express-session');

app.listen(3000, () => {
    console.log('server is running on port 3000');
});

const users = [
    {
        username: 'admin',
        password: 'admin'
    },
    {
        username: 'user1',
        password: 'pass1'
    }
]


app.use(session({
    secret: 'secret',
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

app.post('/login', (req, res) => {
    // set global variable to true if user is authenticated
    if (users.find((user) => user.username == req.body.username && user.password == req.body.password)) {
        req.session.GLOBAL_AUTHENTICATED = true;
    }
    res.redirect('/protectedRoute');
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




