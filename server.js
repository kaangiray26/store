// server.js

import app from './js/index.js';
import db from "./js/db.js";

// Start server
console.log("\x1b[32m%s\x1b[0m", "..: Opening store :..");
app.listen(process.env.port, '0.0.0.0', () => {
    db.init();
    console.log("\x1b[32m%s\x1b[0m", `..: Server:    http://0.0.0.0:${process.env.port}/ :..`);
});