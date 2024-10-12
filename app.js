const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcrypt');
const multer = require('multer');
require('dotenv').config();

// Initialize app
const app = express();

// Setting up view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//body parser
app.use(bodyParser.urlencoded({ extended: false }));

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

// import routes auth
const authRoutes = require('./routes/auth');
app.use('/', authRoutes);
//import models
const { sequelize, User } = require('./models');

// import routes product
const productRoutes = require('./routes/product');
app.use('/products', productRoutes);
// image upload
const upload = multer({ dest: 'public/uploads/' });

app.use(upload.single('image'));

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

// Sync database and start server
sequelize.sync({ force: false }) // CHANGE TO TRUE IF ISSUES ARISE
  .then(async () => {
    console.log('Database synced successfully.');
    await createAdminUser(); //call create admin

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