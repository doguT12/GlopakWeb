const express = require('express');
const router = express.Router();
const { Product } = require('../models');
const ensureAdmin = require('../middleware/ensureAdmin');

// Fetch all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.findAll();
    res.render('products', { products, user: req.session.user });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).send('Internal server error.');
  }
});

// Add a new product
router.get('/add', ensureAdmin, (req, res) => {
  res.render('addproduct');
});

router.post('/add', ensureAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    const image = req.file ? req.file.filename : null; // Assuming file upload middleware is used
    await Product.create({ name, description, image });
    res.redirect('/products');
  } catch (err) {
    console.error('Error adding product:', err);
    res.status(500).send('Internal server error.');
  }
});

// Edit a product
router.post('/edit/:id', ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    await Product.update({ name, description }, { where: { id } });
    res.redirect('/products');
  } catch (err) {
    console.error('Error editing product:', err);
    res.status(500).send('Internal server error.');
  }
});

// Delete a product
router.post('/delete/:id', ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await Product.destroy({ where: { id } });
    res.redirect('/products');
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).send('Internal server error.');
  }
});

module.exports = router;