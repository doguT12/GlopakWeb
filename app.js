const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcrypt');
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

// Import routes
const authRoutes = require('./routes/auth');
app.use('/', authRoutes);

// **Ensure correct import of User model**
const { sequelize, User } = require('./models'); // Add this line to import the User model

// Function to create admin user using environment variables
async function createAdminUser() {
  try {
    const adminExists = await User.findOne({ where: { username: 'admin' } });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
      const hashedSecurityAnswer = await bcrypt.hash(process.env.ADMIN_SECURITY_ANSWER, 10);
      
      await User.create({
        username: 'admin',
        password: hashedPassword,
        role: 'admin', // Assign the hidden admin role
        security_question_id: 1, // Default security question
        security_answer: hashedSecurityAnswer // Hashed security answer from env
      });

      console.log('Admin user created successfully.');
    } else {
      console.log('Admin user already exists.');
    }
  } catch (err) {
    console.error('Error creating admin user:', err);
  }
}

// Sync database and start server
sequelize.sync({ force: false }) // Ensure it doesn't drop tables in production
  .then(async () => {
    console.log('Database synced successfully.');
    await createAdminUser(); // Call the function to create the admin user

    app.listen(3000, () => {
      console.log('Server is running on http://localhost:3000');
    });
  })
  .catch((err) => {
    console.error('Error syncing database:', err);
  });

// Handle 404 - Keep this as the last route
app.use((req, res, next) => {
  res.status(404).render('404');
});