// import 
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const Sequelize = require('sequelize');
const path = require('path');

require('dotenv').config();

//ınitialize  app
const app = express();

// seting up view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// use body parser
app.use(bodyParser.urlencoded({ extended: false }));

// set up static folder
app.use(express.static(path.join(__dirname, 'public')));

// vonfigure session middleware
app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
    })
  );

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite', // Database file location
});

// Test database connection
sequelize
  .authenticate()
  .then(() => {
    console.log('Connection to SQLite has been established successfully.');
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
  });

// Import routes
const authRoutes = require('./routes/auth');
app.use('/', authRoutes);

// Sync database and start server
sequelize.sync().then(() => {
  app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
  });
});

// Export sequelize for use in other files
module.exports = sequelize;
