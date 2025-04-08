// This is a special server file for Vercel deployment only

const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the React build
app.use(express.static(path.join(__dirname, 'public')));

// Handle API requests (will be 404 in this simple version, but prevents showing source code)
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Always return the main index.html for any other request
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export the express app for Vercel
module.exports = app;
