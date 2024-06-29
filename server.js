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
});

const ProductSchema = new mongoose.Schema({
  id: Number,
  name: String,
  amount: Number,
  dateAdded: Date,
  marked: Boolean,
  comments: String,
  category: String,  // Added category field
  image: Buffer,
  imageUrl: String,
});

const Product = mongoose.model('Product', ProductSchema);

app.get('/products', async (req, res) => {
  console.log('GET /products');
  const products = await Product.find();
  console.log('Products retrieved:', products);
  res.json(products);
});

app.post('/products', async (req, res) => {
  console.log('POST /products', req.body);
  const product = new Product(req.body);
  await product.save();
  console.log('Product created:', product);
  res.json(product);
});

app.delete('/products/:id', async (req, res) => {
  console.log('DELETE /products/:id', req.params.id);
  await Product.deleteOne({ id: req.params.id });
  console.log('Product deleted:', req.params.id);
  res.json({ success: true });
});

app.put('/products/:id', async (req, res) => {
  console.log('PUT /products/:id', req.params.id, req.body);
  const product = await Product.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  console.log('Product updated:', product);
  res.json(product);
});

app.put('/products/:id/toggle-marked', async (req, res) => {
  console.log('PUT /products/:id/toggle-marked', req.params.id);
  const product = await Product.findOne({ id: req.params.id });
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  product.marked = !product.marked;
  await product.save();
  console.log('Product marked status toggled:', product);
  res.json(product);
});

app.post('/products/:id/upload-image', upload.single('image'), async (req, res) => {
  console.log('POST /products/:id/upload-image', req.params.id);
  const product = await Product.findOne({ id: req.params.id });
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  product.image = req.file.buffer;
  product.imageUrl = `/products/${req.params.id}/image`;
  await product.save();
  console.log('Image uploaded for product:', product);
  res.json(product);
});

app.get('/products/:id/image', async (req, res) => {
  console.log('GET /products/:id/image', req.params.id);
  const product = await Product.findOne({ id: req.params.id });
  if (!product || !product.image) {
    console.log('Image not found for product:', req.params.id);
    return res.status(404).json({ error: 'Image not found' });
  }
  res.set('Content-Type', 'image/png');
  res.send(product.image);
  console.log('Image sent for product:', req.params.id);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
