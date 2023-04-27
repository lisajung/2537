// MongoDB Playground
// To disable this template go to Settings | MongoDB | Use Default Template For Playground.
// Make sure you are connected to enable completions and to be able to run a playground.
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.

// Select the database to use.
use('comp2537w1');

// Insert a few documents into the sales collection.
// db.getCollection('w1users').insertMany([
//     {
//         username: 'admin',
//         password: 'admin',
//         type: 'administrator'
//     },
//     {
//         username: 'user1',
//         password: 'pass1',
//         type: 'non-administrator'
//     }
// ]);

db.w1users.find().pretty();

