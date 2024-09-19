import express from 'express';
import path from 'path';

const router = express.Router();

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

export default router;
