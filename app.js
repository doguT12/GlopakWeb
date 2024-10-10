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
  })
);

// Import Sequelize instance
const sequelize = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
app.use('/', authRoutes);

// Sync database and start server
sequelize.sync().then(() => {
  app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
  });
});
