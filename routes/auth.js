const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { User } = require('../models'); 
const securityQuestions = require('../config/securityquestions');

// GET Signup Page
router.get('/signup', (req, res) => {
  res.render('signup');
});

// POST Signup Data
router.post('/signup', async (req, res) => {
  const { username, password, repeat_password, security_question_id, security_answer } = req.body;

  // Validate that passwords match
  if (password !== repeat_password) {
    return res.render('signup', { error: 'Passwords do not match.' });
  }

  try {
    // Check if user already exists
    const userExists = await User.findOne({ where: { username } });
    if (userExists) {
      return res.render('signup', { error: 'Username already taken.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user with role and security question
    await User.create({
      username,
      password: hashedPassword,
      security_question_id: parseInt(security_question_id, 10), // Ensure it's an integer
      security_answer,
    });

    res.redirect('/login');
  } catch (err) {
    console.error('Signup Error:', err);
    res.render('signup', { error: 'Error occurred during signup.' });
  }
});

// GET Login Page
router.get('/login', (req, res) => {
  res.render('login');
});

// POST Login Data
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find user
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.send('Invalid username or password.');
    }

    // Compare passwords
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.send('Invalid username or password.');
    }

    // Save user ID in session
    req.session.userId = user.id;
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.send('Error occurred during login.');
  }
});

// GET Dashboard (Protected Route)
router.get('/dashboard', async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }

  try {
    // Retrieve user information
    const user = await User.findByPk(req.session.userId);
    console.log('Retrieved User:', user);
    if (!user) {
      return res.redirect('/login');
    }

    res.render('dashboard', { user });
  } catch (err) {
    console.error('Dashboard Error:', err);
    res.render('dashboard', { error: 'Error occurred while fetching dashboard.' });
  }
});

// GET Logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.send('Error occurred during logout.');
    }
    res.redirect('/login');
  });
});

module.exports = router;

