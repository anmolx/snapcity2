const express = require('express');
const serverless = require('serverless-http');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();

// Add CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Rest of your server.js code goes here (copy from your existing server.js)
// Make sure to change the upload path and database path for Netlify

// Change these lines in your server code:
const UPLOADS_DIR = path.join('/tmp', 'uploads');
const DB_FILE = path.join('/tmp', 'db.sqlite');

// Export as serverless function
module.exports.handler = serverless(app);