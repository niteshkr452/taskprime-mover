const express = require('express');
const router = express.Router();
const Contact = require('./models/Contact'); // Corrected import path

// API to get all contact form messages
router.get('/messages', async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
