const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config(); 

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect(process.env.MONGODB_URI, {
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
  imageUrl: String
});

const Product = mongoose.model('Product', ProductSchema);

app.get('/products', async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

app.post('/products', async (req, res) => {
  const product = new Product(req.body);
  await product.save();
  res.json(product);
});

app.delete('/products/:id', async (req, res) => {
  await Product.deleteOne({ id: req.params.id });
  res.json({ success: true });
});

app.put('/products/:id/toggle-marked', async (req, res) => {
  const product = await Product.findOne({ id: req.params.id });
  product.marked = !product.marked;
  await product.save();
  res.json(product);
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${req.params.id}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

app.post('/products/:id/upload-image', upload.single('image'), async (req, res) => {
  const product = await Product.findOne({ id: req.params.id });
  product.imageUrl = `/uploads/${req.file.filename}`;
  await product.save();
  res.json(product);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
