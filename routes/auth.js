const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { User, Chat, Message} = require('../models'); // Import User model
const securityQuestions = require('../config/securityQuestions'); // Import security questions from config
const { Op } = require('sequelize');  // Import Sequelize operators

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

  // Validate passwords 
  if (password !== repeat_password) {
    return res.render('signup', { error: 'Passwords do not match.', securityQuestions });
  }

  //security_question_id is between 1 and 5
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

    // Hash
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedSecurityAnswer = await bcrypt.hash(security_answer, 10);

    // Create new user
    await User.create({
      username,
      password: hashedPassword,
      security_question_id: questionId,
      security_answer: hashedSecurityAnswer, 
      role, 
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
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.render('login', { error: 'Invalid username or password.' });
    }

    // Compare passwords
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.render('login', { error: 'Invalid username or password.' });
    }

    // Save user ID and username
    req.session.userId = user.id;
    req.session.username = user.username;
    res.redirect('/dashboard');
    
  } catch (err) {
    console.error('Login Error:', err);
    res.render('login', { error: 'Error occurred during login.' });
  }
});

// GET Dashboard
router.get('/dashboard', async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }

  try {
    // Retrieve data
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

// GET Change Password
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

  // Validate that security_question_id is between 1 and 5
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

    // Compare security answer
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

// Information Page
router.get('/information', (req, res) => {
  res.render('information'); // Renders the information.ejs file
});

// CHAt

// GET DM
router.get('/dms', async (req, res) => {
  if (!req.session.username) {
    return res.redirect('/login');
  }

  try {
    // find chats where the user is either user1 or user2
    const userChats = await Chat.findAll({
      where: {
        [Op.or]: [
          { user1_username: req.session.username },
          { user2_username: req.session.username }
        ]
      }
    });

    // Map over the chats 
    const dms = userChats.map(chat => {
      const otherUsername = chat.user1_username === req.session.username ? chat.user2_username : chat.user1_username;
      return {
        otherUsername
      };
    });

    res.render('dms', { dms });
  } catch (err) {
    console.error('Error fetching DMs:', err);
    res.render('dms', { dms: [], error: 'Error loading direct messages.' });
  }
});
// POST NEW DM
router.post('/dms/new', async (req, res) => {
  const { username } = req.body;

  try {
    // Ensure req.session.username is defined
    if (!req.session.username) {
      return res.redirect('/login');  // Redirect if user is not logged in
    }

    // Find the other user by their username
    const otherUser = await User.findOne({ where: { username } });

    //check if otherUser exists
    //check  if the user is not trying to message themselves
    if (otherUser && otherUser.username !== req.session.username) {
      // Check if a chat already exists between the two users
      const existingChat = await Chat.findOne({
        where: {
          [Op.or]: [
            { user1_username: req.session.username, user2_username: otherUser.username },
            { user1_username: otherUser.username, user2_username: req.session.username }
          ]
        }
      });

      if (existingChat) {
        return res.redirect(`/dms/${otherUser.username}`);  
      }

      // If no existing chat, create a new one
      await Chat.create({
        user1_username: req.session.username,
        user2_username: otherUser.username
      });

      // Redirect to the new chat
      res.redirect(`/dms/${otherUser.username}`);
    } else {
      // If user not found or if user trying to message themselves
      res.render('dms', { dms: [], error: 'User not found or you cannot message yourself.' });
    }
  } catch (err) {
    console.error('Error starting new DM:', err);
    res.render('dms', { dms: [], error: 'Error starting new conversation.' });
  }
});
// GET DM other user
router.get('/dms/:otherUsername', async (req, res) => {
  const { otherUsername } = req.params;

  try {
    // Check if the chat exists 
    const chat = await Chat.findOne({
      where: {
        [Op.or]: [
          { user1_username: req.session.username, user2_username: otherUsername },
          { user1_username: otherUsername, user2_username: req.session.username }
        ]
      }
    });

    if (!chat) {
      return res.redirect('/dms');
    }

    // Fetch messages
    const messages = await Message.findAll({
      where: {
        chat_username1: chat.user1_username,
        chat_username2: chat.user2_username
      },
      order: [['timestamp', 'ASC']]
    });

    res.render('chat', {
      messages,
      otherUsername,
      currentUsername: req.session.username
    });
  } catch (err) {
    console.error('Error fetching chat:', err);
    res.redirect('/dms');
  }
});

// POST DM
router.post('/dms/:otherUsername', async (req, res) => {
  const { otherUsername } = req.params;
  const { message } = req.body;

  try {
    // Check if the chat exists
    const chat = await Chat.findOne({
      where: {
        [Op.or]: [
          { user1_username: req.session.username, user2_username: otherUsername },
          { user1_username: otherUsername, user2_username: req.session.username }
        ]
      }
    });

    if (!chat) {
      return res.redirect('/dms');
    }

    // Insert the new message into the Messages table
    await Message.create({
      chat_username1: chat.user1_username,
      chat_username2: chat.user2_username,
      sender_username: req.session.username,
      text: message
    });

    res.redirect(`/dms/${otherUsername}`);
  } catch (err) {
    console.error('Error sending message:', err);
    res.redirect(`/dms/${otherUsername}`);
  }
});

module.exports = router;

