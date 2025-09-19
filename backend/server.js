// server.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || '*'; // set this to your Netlify URL for stricter CORS

const app = express();

// CORS config
if (FRONTEND_URL === '*') {
  app.use(cors()); // dev: allow all origins
} else {
  app.use(cors({ origin: FRONTEND_URL, credentials: true }));
}

// body parsing for non-file form fields
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ensure uploads dir exists
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '';
    cb(null, unique + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } }); // 15MB limit

// SQLite setup
const DB_FILE = path.join(__dirname, 'db.sqlite');
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) return console.error('DB error:', err);
  console.log('Connected to SQLite DB:', DB_FILE);
});
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT,
    originalname TEXT,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// serve uploaded images
app.use('/uploads', express.static(UPLOADS_DIR));

// POST /upload - accepts multipart/form-data with file field 'image'
// and other form fields or a single 'details' JSON field
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded. Use field name "image".' });

  // parse details: prefer JSON string in `details`, otherwise use other form fields
  let details = {};
  if (req.body.details) {
    try {
      details = JSON.parse(req.body.details);
    } catch (e) {
      // details was not JSON; keep raw string
      details = req.body.details;
    }
  } else {
    // copy all non-file fields into details
    const copy = { ...req.body };
    delete copy.image;
    details = copy;
  }

  const filename = req.file.filename;
  const originalname = req.file.originalname;
  const detailsStr = typeof details === 'string' ? details : JSON.stringify(details);

  db.run(
    `INSERT INTO entries (filename, originalname, details) VALUES (?, ?, ?)`,
    [filename, originalname, detailsStr],
    function (err) {
      if (err) return res.status(500).json({ success: false, message: 'DB insert error', error: err.message });
      const entry = {
        id: this.lastID,
        filename,
        originalname,
        details: typeof details === 'string' ? details : details,
        fileUrl: `${req.protocol}://${req.get('host')}/uploads/${filename}`,
        created_at: new Date().toISOString()
      };
      res.json({ success: true, entry });
    }
  );
});

// GET /gallery - returns all entries (most recent first)
app.get('/gallery', (req, res) => {
  db.all(`SELECT id, filename, originalname, details, created_at FROM entries ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: 'DB error', error: err.message });
    const out = rows.map(r => {
      let parsedDetails = r.details;
      try { parsedDetails = JSON.parse(r.details); } catch (e) { parsedDetails = r.details; }
      return {
        id: r.id,
        originalname: r.originalname,
        details: parsedDetails,
        fileUrl: `${req.protocol}://${req.get('host')}/uploads/${r.filename}`,
        created_at: r.created_at
      };
    });
    res.json(out);
  });
});

// simple health route
app.get('/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

app.listen(PORT, () => console.log(`Server running: http://localhost:${PORT}  (CORS FRONTEND_URL=${FRONTEND_URL})`));
