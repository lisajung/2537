const express = require('express');
const app = express();

app.listen(3000, () => {
    console.log('server is running on port 3000');
});



// only for authenticated users
app.use((req, res, next) => {
    console.log('middleware');
    next();
});

app.get('/', (req, res) => {
    res.send('<h1> Hello World <h1>');
});

app.get('/anotherRoute', (req, res, next) => {
    console.log(1);
    next()
}, (req, res) => {
    console.log(2);
    res.send('<h1> anotherRoute <h1>');
});




