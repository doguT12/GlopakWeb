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

//body parser
app.use(bodyParser.urlencoded({ extended: true }));

// static folder
app.use(express.static(path.join(__dirname, 'public')));

// Configuremiddleware
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  }) 
);
// make 'user' available in all templates
app.use(async (req, res, next) => {
  if (req.session.userId) {
    try {
      const user = await User.findByPk(req.session.userId);
      if (user) {
        res.locals.user = user;
      } else {
        res.locals.user = null;
      }
    } catch (err) {
      console.error('Error fetching user in middleware:', err);
      res.locals.user = null;
    }
  } else {
    res.locals.user = null;
  }
  next();
});

// import routes auth
const authRoutes = require('./routes/auth');
app.use('/', authRoutes);
//import models
const { sequelize, User, Product } = require('./models');

//create admin
async function createAdminUser() {
  try {
    const adminExists = await User.findOne({ where: { username: 'admin' } });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
      const hashedSecurityAnswer = await bcrypt.hash(process.env.ADMIN_SECURITY_ANSWER, 10);
      
      await User.create({
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        security_question_id: 1, //default security q
        security_answer: hashedSecurityAnswer 
      });

      console.log('Admin user created successfully.');
    } else {
      console.log('Admin user already exists.');
    }
  } catch (err) {
    console.error('Error creating admin user:', err);
  }
}
async function createExampleProducts() {
  try {
    const productCount = await Product.count();
    if (productCount === 0) {
      await Product.bulkCreate([
        {
          name: 'Eco-Friendly Bottle',
          description: 'A reusable eco-friendly bottle made from sustainable materials.',
          image: 'https://via.placeholder.com/150?text=Eco+Bottle',
        },
        {
          name: 'Biodegradable Packaging',
          description: 'High-quality biodegradable packaging solutions for your products.',
          image: 'https://via.placeholder.com/150?text=Biodegradable+Packaging',
        },
        {
          name: 'Recycled Paper Bags',
          description: 'Durable and stylish paper bags made from 100% recycled materials.',
          image: 'https://via.placeholder.com/150?text=Paper+Bags',
        },
      ]);
      console.log('Example products created successfully.');
    } else {
      console.log('Products already exist. Skipping creation of example products.');
    }
  } catch (err) {
    console.error('Error creating example products:', err);
  }
}

// Sync database and start server
sequelize.sync({ force: false }) // CHANGE TO TRUE IF ISSUES ARISE
  .then(async () => {
    console.log('Database synced successfully.');
    await createAdminUser(); //call create admin
    await createExampleProducts(); //call create products

    app.listen(3000, () => {
      console.log('Server is running on http://localhost:3000');
    });
  })
  .catch((err) => {
    console.error('Error syncing database:', err);
  });

// Handle 404
app.use((req, res, next) => {
  res.status(404).render('404');
});