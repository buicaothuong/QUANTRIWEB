const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "database.sqlite");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Could not connect to database", err);
  } else {
    console.log("Connected to SQLite database");
  }
});

// Tạo bảng nếu chưa có
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT,
      status TEXT DEFAULT 'active' -- thêm cột status
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT,
      ip TEXT,
      hostname TEXT,
      role TEXT,
      timestamp TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT,
      value TEXT
    )
  `);

  // Kiểm tra và thêm cột status nếu chưa có (phòng trường hợp bảng đã tạo từ trước)
  db.get("PRAGMA table_info(users)", (err, row) => {
    db.all("PRAGMA table_info(users)", (err, columns) => {
      const hasStatus = columns.some(col => col.name === "status");
      if (!hasStatus) {
        db.run("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'");
      }
    });
  });

  // Tạo admin mặc định nếu chưa có
  db.get("SELECT * FROM users WHERE role = 'admin'", (err, row) => {
    if (!row) {
      db.run("INSERT INTO users (username, password, role, status) VALUES (?, ?, ?, ?)", [
        "admin",
        "admin",
        "admin",
        "active"
      ]);
    }
  });
});

module.exports = db;
