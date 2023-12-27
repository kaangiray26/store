// db.js
import fs from "fs";
import path from "path";
import pgPromise from 'pg-promise';
import { fileURLToPath } from 'url';
import crypto from "crypto";

// Use environment settings to connect to database.
const pgp = pgPromise();

const db = pgp({
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT),
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function init() {
    // Create tables if they don't exist
    db.task(async t => {
        // Create tables if they don't exist
        await t.none("CREATE TABLE IF NOT EXISTS objects (id UUID PRIMARY KEY, filename TEXT, extension TEXT, title TEXT, date TIMESTAMP, owner TEXT);");
        await t.none("CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, username TEXT, password TEXT);");

        // Check users
        const users = await t.any("SELECT COUNT(*) FROM users");

        // Return if at least one user exists
        if (users[0].count >= 1) {
            return
        }

        // Create user
        const username = crypto.randomBytes(16).toString("hex");
        const password = crypto.randomBytes(24).toString("hex");
        await t.none("INSERT INTO users(username, password) VALUES($1, $2)", [username, password]);
        console.log("Created user:", username, password);
    })
}

async function addFile(req, res) {
    // Check if file was uploaded
    if (!req.file) {
        res.status(400).json({
            "status": "error",
            "response": "No file uploaded."
        })
        return
    }

    // Check for title
    if (!req.body.title) {
        req.body.title = req.file.originalname
    }

    // Store metadata in database
    db.task(async t => {
        await t.none("INSERT INTO objects(id, filename, extension, title, date, owner) VALUES($1, $2, $3, $4, $5, $6)", [req.file.filename, req.file.originalname, path.extname(req.file.originalname), req.body.title, new Date(), req.headers.username]);
        res.status(200).json({
            "status": "success",
            "file": req.file.filename,
        })
    })
}

async function isAuthenticated(headers) {
    if (!headers.username || !headers.password) {
        return false
    }

    // Check if user exists
    const user = await db.oneOrNone("SELECT * FROM users WHERE username=$1 AND password=$2", [headers.username, headers.password]);
    if (!user) {
        return false
    }

    return true
}

async function deleteFile(req, res) {
    // Delete file if user is owner
    const object = await db.oneOrNone("DELETE FROM objects WHERE id=$1 AND owner=$2 RETURNING *", [req.params.id, req.headers.username]);
    if (!object) {
        res.status(401).json({
            "status": "error",
            "response": "You are not the owner of this file."
        })
        return
    }

    // Delete file from disk
    const filepath = path.join(__dirname, "../uploads", object.id);
    fs.unlinkSync(filepath);

    res.status(200).json({
        "status": "success",
        "response": "File deleted."
    })
}

async function listFiles(req, res) {
    // Get parameters
    const sort = req.query.sort || "date";
    if (!["title", "date"].includes(sort)) {
        res.status(400).json({
            "status": "error",
            "response": "Invalid sort parameter."
        })
        return
    }

    const order = req.query.order || "DESC";
    if (!["ASC", "DESC"].includes(order)) {
        res.status(400).json({
            "status": "error",
            "response": "Invalid order parameter."
        })
        return
    }

    const limit = req.query.limit || 12;
    const offset = req.query.offset || 0;

    // List files
    const objects = await db.any("SELECT * FROM objects WHERE owner=$1 ORDER BY $2:raw $3:raw LIMIT $4 OFFSET $5", [req.headers.username, sort, order, limit, offset]);
    res.status(200).json({
        "status": "success",
        "response": objects
    })
}

async function replaceFile(req, res) {
    // Check if user is owner of file
    const object = await db.oneOrNone("SELECT * FROM objects WHERE id=$1 AND owner=$2", [req.params.id, req.headers.username]);
    if (!object) {
        // Delete uploaded file from disk
        const filepath = path.join(__dirname, "../uploads", req.file.filename);
        fs.unlinkSync(filepath);
        res.status(401).json({
            "status": "error",
            "response": "You are not the owner of this file."
        })
        return
    }

    // Delete old file from disk
    const filepath = path.join(__dirname, "../uploads", object.id);
    fs.unlinkSync(filepath);

    // Rename uploaded file
    fs.renameSync(path.join(__dirname, "../uploads", req.file.filename), filepath);

    // Update database
    await db.none("UPDATE objects SET filename=$1 WHERE id=$2", [req.file.originalname, object.id]);

    res.status(200).json({
        "status": "success",
        "response": "File replaced."
    })
}

async function searchFiles(req, res) {
    // Fuzzy search for files owned by user
    const objects = await db.any("SELECT * FROM objects WHERE strict_word_similarity(title, $1) > 0.2 ORDER BY strict_word_similarity(title, $1) DESC LIMIT 5", [req.query.title]);

    res.status(200).json({
        "status": "success",
        "response": objects
    })
}

async function getFileDetails(req, res) {
    // Get file details
    const object = await db.oneOrNone("SELECT * FROM objects WHERE id=$1", [req.params.id]);
    if (!object) {
        res.status(404).json({
            "status": "error",
            "response": "File not found."
        })
        return
    }

    res.status(200).json({
        "status": "success",
        "response": object
    })
}

export default {
    init,
    isAuthenticated,
    addFile,
    deleteFile,
    listFiles,
    replaceFile,
    searchFiles,
    getFileDetails
}