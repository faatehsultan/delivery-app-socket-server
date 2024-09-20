const express = require('express');
const router = express.Router();
const path = require('path');

// Route for the homepage
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route for the test portal
router.get('/test-portal', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'test-portal.html'));
});

// Route for socket io library
router.get('/socket.io/socket.io.js', (req, res) => {
  res.sendFile(
    path.join(__dirname, '/node_modules/socket.io/client-dist/socket.io.js'),
  );
});

module.exports = router;
