// MongoDB Playground
// To disable this template go to Settings | MongoDB | Use Default Template For Playground.
// Make sure you are connected to enable completions and to be able to run a playground.
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.

// Select the database to use.
use('comp2537w1');

db.w1users.update(
    {
        username: "user1"
    },
    {
        $set: {
            password: "$2b$10$dqkUfG82mkALRPOUcyi5n.Aj48jJRKEdsPkCYU70GgoypnP0zHR8S"
        }
    }
)

db.w1users.find()