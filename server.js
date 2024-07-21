const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const multer = require('multer');
const upload = multer();

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  dateAdded: { type: Date, default: Date.now },
  marked: { type: Boolean, default: false },
  comments: { type: String, default: '' },
  category: { type: String, required: true },
  image: { type: Buffer },
  imageUrl: { type: String }
}, { 
  _id: true // This ensures we're using MongoDB's default _id
});

const Product = mongoose.model('Product', ProductSchema);

app.get('/products', async (req, res) => {
  console.log('GET /products');
  try {
    const products = await Product.find();
    console.log('Products retrieved:', products.length);
    res.json(products);
  } catch (error) {
    console.error('Error retrieving products:', error);
    res.status(500).json({ error: 'Error retrieving products' });
  }
});

app.post('/products', async (req, res) => {
  console.log('POST /products', req.body);
  try {
    const product = new Product(req.body);
    const savedProduct = await product.save();
    console.log('Product created:', savedProduct);
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(400).json({ error: 'Error creating product', details: error.message });
  }
});

app.delete('/products/:id', async (req, res) => {
  console.log('DELETE /products/:id', req.params.id);
  try {
    const result = await Product.findByIdAndDelete(req.params.id);
    if (!result) {
      console.log('Product not found:', req.params.id);
      return res.status(404).json({ error: 'Product not found' });
    }
    console.log('Product deleted:', req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Error deleting product', details: error.message });
  }
});

app.put('/products/:id', async (req, res) => {
  console.log('PUT /products/:id', req.params.id, req.body);
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    console.log('Product updated:', product);
    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(400).json({ error: 'Error updating product', details: error.message });
  }
});

app.put('/products/:id/toggle-marked', async (req, res) => {
  console.log('PUT /products/:id/toggle-marked', req.params.id);
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    product.marked = !product.marked;
    await product.save();
    console.log('Product marked status toggled:', product);
    res.json(product);
  } catch (error) {
    console.error('Error toggling product marked status:', error);
    res.status(500).json({ error: 'Error toggling product marked status' });
  }
});

app.post('/products/:id/upload-image', upload.single('image'), async (req, res) => {
  console.log('POST /products/:id/upload-image', req.params.id);
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    // Replace the existing image
    product.image = req.file.buffer;
    product.imageUrl = `/products/${req.params.id}/image`;
    
    await product.save();
    console.log('Image uploaded/replaced for product:', product._id);
    res.json(product);
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Error uploading image' });
  }
});

app.get('/products/:id/image', async (req, res) => {
  console.log('GET /products/:id/image', req.params.id);
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.image) {
      console.log('Image not found for product:', req.params.id);
      return res.status(404).json({ error: 'Image not found' });
    }
    res.set('Content-Type', 'image/png');
    res.send(product.image);
    console.log('Image sent for product:', req.params.id);
  } catch (error) {
    console.error('Error retrieving image:', error);
    res.status(500).json({ error: 'Error retrieving image' });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});