// Import dependencies
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');

require('dotenv').config();

// Initialize app
const app = express();

// Setting up view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Use body parser
app.use(bodyParser.urlencoded({ extended: false }));

// Set up static folder
app.use(express.static(path.join(__dirname, 'public')));

// Configure session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    // Optional: Add cookie settings
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);

// Import routes
const authRoutes = require('./routes/auth');
app.use('/', authRoutes);

// Import models and sequelize
const { sequelize } = require('./models');

// Sync database and start server
sequelize
  .sync()
  .then(() => {
    console.log('Database synced successfully.');
    app.listen(3000, () => {
      console.log('Server is running on http://localhost:3000');
    });
  })
  .catch((err) => {
    console.error('Error syncing database:', err);
  });
