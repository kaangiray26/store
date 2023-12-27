// index.js

import { v4 as uuidv4 } from 'uuid';
import express from 'express';
import path from 'path';
import cors from 'cors';
import multer from 'multer';
import { fileURLToPath } from 'url';
import db from './db.js';

// Print current directory
console.log(
    path.dirname(fileURLToPath(import.meta.url))
)

// Path
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, path.join(__dirname, "../uploads"))
        },
        filename: (req, file, cb) => {
            cb(null, uuidv4());
        }
    })
})

// Express
const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true, }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../uploads")))

// Authentication
function isAuthenticated(req, res, next) {
    db.isAuthenticated(req.headers).then((ok) => {
        if (ok) next()
        else res.status(401).json({ "status": "error", "response": "Authentication failed." })
    })
}

// Routes
app.get("/", (req, res) => {
    res.status(200).json({
        "response": "Our store is open!",
        "version": process.env.version
    })
})

app.get("/auth", isAuthenticated, (req, res) => {
    res.status(200).json({
        "status": "success",
        "response": "Authentication successful."
    })
})

// Add file
app.put("/add", isAuthenticated, upload.single("file"), db.addFile);

// Delete file
app.delete("/delete/:id", isAuthenticated, db.deleteFile);

// List files owned by user
app.get("/list", isAuthenticated, db.listFiles);

// Replace file
app.put("/replace/:id", isAuthenticated, upload.single("file"), db.replaceFile);

// Search files
app.get("/search", isAuthenticated, db.searchFiles);

// Get file details
app.get("/details/:id", db.getFileDetails);

// Export
export default app;