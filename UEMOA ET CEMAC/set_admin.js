const Database = require('better-sqlite3');
const db = new Database(process.env.DB_PATH || './regularena.db');
db.prepare("UPDATE users SET role='admin' WHERE email='abdou.ndao@regularena.com'").run();
const user = db.prepare("SELECT id,email,role FROM users WHERE email='abdou.ndao@regularena.com'").get();
console.log('Result:', user);
db.close();
