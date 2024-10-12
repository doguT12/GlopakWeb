const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { User, Chat, Message, Product, CustomerSurvey} = require('../models'); // Import User model
const securityQuestions = require('../config/securityQuestions'); // Import security questions from config
const { Op } = require('sequelize');  // Import Sequelize operators
const ensureAdmin = require('../middleware/ensureAdmin');

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

// GET Products Page
router.get('/products', async (req, res) => {
  try {
    const products = await Product.findAll({
      order: [['createdAt', 'DESC']],
    });
    console.log('Fetched Products:', products);
    
    let user = null;
    if (req.session.userId) {
      user = await User.findByPk(req.session.userId);
    }
    
    res.render('products', { products, user, error: null });
  } catch (err) {
    console.error('Error fetching products:', err);
    
    // Fetch the current user
    let user = null;
    if (req.session.userId) {
      user = await User.findByPk(req.session.userId);
    }
    
    res.render('products', { error: 'Error fetching products.', products: [], user });
  }
});


router.get('/products', async (req, res) => {
  try {
    const products = await Product.findAll({
      order: [['createdAt', 'DESC']],
    });
    console.log('Fetched Products:', products);

    // Fetch the current user if logged in
    let user = null;
    if (req.session.userId) {
      user = await User.findByPk(req.session.userId);
    }

    // Always pass 'error', set to null if no error
    res.render('products', { products, user, error: null });
  } catch (err) {
    console.error('Error fetching products:', err);

    // Fetch the current user if logged in
    let user = null;
    if (req.session.userId) {
      user = await User.findByPk(req.session.userId);
    }

    res.render('products', { error: 'Error fetching products.', products: [], user });
  }
});

//GET ADD PRODUCT
router.get('/addproduct', ensureAdmin, (req, res) => {
  User.findByPk(req.session.userId)
    .then(user => {
      res.render('addproduct', { user, error: null });
    })
    .catch(err => {
      console.error('Error fetching user for addproduct:', err);
      res.status(500).send('Internal Server Error');
    });
});

//POST ADD PRODUCT
router.post('/addproduct', ensureAdmin, async (req, res) => {
  const { name, description, image } = req.body;

  try {
    if (!name || !description || !image) {
      return res.render('addproduct', { error: 'All fields are required.', user: await User.findByPk(req.session.userId) });
    }

    // Create the product
    await Product.create({ name, description, image });
    console.log(`Product "${name}" added successfully.`);

    res.redirect('/products');
  } catch (err) {
    console.error('Error adding product:', err);
    res.render('addproduct', { error: 'Error adding product. Please try again.', user: await User.findByPk(req.session.userId) });
  }
});

// GET EDIT PRODUCT
router.get('/editproduct/:id', ensureAdmin, async (req, res) => {
  const productId = req.params.id;

  try {
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).send('Product not found.');
    }

    // Fetch the current user
    const user = await User.findByPk(req.session.userId);

    res.render('editproduct', { product, user, error: null });
  } catch (err) {
    console.error('Error fetching product for editing:', err);
    res.status(500).send('Internal Server Error');
  }
});

//POST EDIT PRODUCT
router.post('/editproduct/:id', ensureAdmin, async (req, res) => {
  const productId = req.params.id;
  const { name, description, image } = req.body;

  try {
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).send('Product not found.');
    }

    // Update the product details
    product.name = name || product.name;
    product.description = description || product.description;
    product.image = image || product.image;

    await product.save();
    console.log(`Product "${product.name}" updated successfully.`);

    res.redirect('/products');
  } catch (err) {
    console.error('Error updating product:', err);
    // Fetch the current user
    const user = await User.findByPk(req.session.userId);
    res.render('editproduct', { product, user, error: 'Error updating product. Please try again.' });
  }
});

//POST REMOVE PRODUCT
router.post('/removeproduct/:id', ensureAdmin, async (req, res) => {
  const productId = req.params.id;

  try {
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).send('Product not found.');
    }

    await product.destroy();
    console.log(`Product "${product.name}" removed successfully.`);

    res.redirect('/products');
  } catch (err) {
    console.error('Error removing product:', err);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/customersurvey', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).send('Unauthorized. Please log in.');
  }

  try {
    const user = await User.findByPk(req.session.userId);

    if (user && (user.role === 'customer' || user.role === 'admin')) {
      res.render('customersurvey', { user, error: null });
    } else {
      res.status(403).send('Access denied. Customers and admins only.');
    }
  } catch (err) {
    console.error('Error fetching user for customersurvey:', err);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/customersurvey', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).send('Unauthorized. Please log in.');
  }

  try {
    const user = await User.findByPk(req.session.userId);

    if (user && (user.role === 'customer' || user.role === 'admin')) {
      const { speed, cost, quality } = req.body;

      const speedValue = parseInt(speed, 10);
      const costValue = parseInt(cost, 10);
      const qualityValue = parseInt(quality, 10);

      if (
        isNaN(speedValue) || speedValue < 0 || speedValue > 10 ||
        isNaN(costValue) || costValue < 0 || costValue > 10 ||
        isNaN(qualityValue) || qualityValue < 0 || qualityValue > 10
      ) {
        return res.render('customersurvey', { user, error: 'Please provide valid ratings between 0 and 10.' });
      }

      await CustomerSurvey.create({
        username: user.username,
        speed: speedValue,
        cost: costValue,
        quality: qualityValue,
      });

      // Send a thank you message
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Thank You</title>
          <style>
            body {
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              background-color: #f4f4f4;
              font-family: Arial, sans-serif;
              text-align: center;
            }
            .message-box {
              background-color: #ffffff;
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            .message-box h1 {
              color: #27ae60;
            }
            .message-box p {
              color: #555555;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="message-box">
            <h1>Thank You!</h1>
            <p>Your survey has been submitted successfully.</p>
            <p>You will be redirected to the Products page shortly.</p>
          </div>
          <script>
            // Redirect after 3 seconds (3000 milliseconds)
            setTimeout(() => {
              window.location.href = '/products';
            }, 3000);
          </script>
        </body>
        </html>
      `);
    } else {
      res.status(403).send('Access denied. Customers and admins only.');
    }
  } catch (err) {
    console.error('Error handling customer survey submission:', err);
    res.status(500).send('Internal Server Error');
  }
});
module.exports = router;

