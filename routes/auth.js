// routes/auth.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { User } = require('../models'); // Import User model
const securityQuestions = require('../config/securityQuestions'); // Import security questions from config

const allowedRoles = ['customer', 'supplier'];
// GET Signup Page
router.get('/signup', (req, res) => {
  try {
    res.render('signup', { securityQuestions });
  } catch (err) {
    console.error('Signup Page Error:', err);
    res.render('signup', { error: 'Error loading signup page.', securityQuestions });
  }
});

// POST Signup Data
router.post('/signup', async (req, res) => {
  const { username, password, repeat_password, security_question_id, security_answer, role } = req.body;

  // Validate that passwords match
  if (password !== repeat_password) {
    return res.render('signup', { error: 'Passwords do not match.', securityQuestions });
  }

  // Validate that security_question_id is an integer between 1 and 5
  const questionId = parseInt(security_question_id, 10);
  if (isNaN(questionId) || questionId < 1 || questionId > 5) {
    return res.render('signup', { error: 'Invalid security question selected.', securityQuestions });
  }

  // Validate role
  if (!allowedRoles.includes(role)) {
    return res.render('signup', { error: 'Invalid role selected.', securityQuestions });
  }

  try {
    // Check if user already exists
    const userExists = await User.findOne({ where: { username } });
    if (userExists) {
      return res.render('signup', { error: 'Username already taken.', securityQuestions });
    }

    // Hash password and security answer
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedSecurityAnswer = await bcrypt.hash(security_answer, 10);

    // Create new user with role and security question
    await User.create({
      username,
      password: hashedPassword,
      security_question_id: questionId,
      security_answer: hashedSecurityAnswer, // Hashed for security
      role, // **Include role here**
    });

    res.redirect('/login');
  } catch (err) {
    console.error('Signup Error:', err);
    res.render('signup', { error: 'Error occurred during signup.', securityQuestions });
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
      return res.render('login', { error: 'Invalid username or password.' });
    }

    // Compare passwords
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.render('login', { error: 'Invalid username or password.' });
    }

    // Save user ID in session
    req.session.userId = user.id;
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Login Error:', err);
    res.render('login', { error: 'Error occurred during login.' });
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
    if (!user) {
      return res.redirect('/login');
    }

    res.render('dashboard', { user });
  } catch (err) {
    console.error('Dashboard Error:', err);
    res.render('dashboard', { error: 'Error occurred while fetching dashboard.' });
  }
});

// GET Change Password Page
router.get('/changepassword', (req, res) => {
  try {
    res.render('changepassword', { securityQuestions });
  } catch (err) {
    console.error('Change Password Page Error:', err);
    res.render('changepassword', { error: 'Error loading change password page.', securityQuestions });
  }
});

// POST Change Password Data
router.post('/changepassword', async (req, res) => {
  const { username, security_question_id, security_answer, new_password, repeat_new_password } = req.body;

  // Validate that new passwords match
  if (new_password !== repeat_new_password) {
    return res.render('changepassword', { error: 'New passwords do not match.', securityQuestions });
  }

  // Validate that security_question_id is an integer between 1 and 5
  const questionId = parseInt(security_question_id, 10);
  if (isNaN(questionId) || questionId < 1 || questionId > 5) {
    return res.render('changepassword', { error: 'Invalid security question selected.', securityQuestions });
  }

  try {
    // Find the user by username and security_question_id
    const user = await User.findOne({
      where: {
        username: username,
        security_question_id: questionId
      }
    });

    if (!user) {
      return res.render('changepassword', { error: 'Username and security question do not match.', securityQuestions });
    }

    // Compare hashed security answer
    const match = await bcrypt.compare(security_answer, user.security_answer);
    if (!match) {
      return res.render('changepassword', { error: 'Security answer is incorrect.', securityQuestions });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(new_password, 10);

    // Update the user's password in the database
    user.password = hashedNewPassword;
    await user.save();

    res.render('changepassword', { success: 'Password has been updated successfully. You can now login with your new password.', securityQuestions });
  } catch (err) {
    console.error('Change Password Error:', err);
    res.render('changepassword', { error: 'Error occurred while changing password.', securityQuestions });
  }
});

// GET Logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout Error:', err);
      return res.render('dashboard', { error: 'Error occurred during logout.' });
    }
    res.redirect('/login');
  });
});

module.exports = router;

