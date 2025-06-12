const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();
const os = require("os");

const db = new sqlite3.Database("./db.sqlite");

// Helper lấy IP
function getClientIP(req) {
  return (req.headers["x-forwarded-for"] || req.connection.remoteAddress || '').split(',')[0].trim();
}

// Trang chủ
router.get("/", (req, res) => {
  if (req.session.user) {
    res.redirect("/dashboard");
  } else {
    res.sendFile(require("path").join(__dirname, "../public/index.html"));
  }
});

// Đăng nhập
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, user) => {
    if (user) {
      req.session.user = { username: user.username, role: user.role };
      res.redirect("/dashboard");
    } else {
      res.send("Login failed. <a href='/'>Try again</a>");
    }
  });
});

// Đăng ký
router.post("/register", (req, res) => {
  const { username, password } = req.body;
  db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", [username, password, "member"], (err) => {
    if (err) {
      if (err.message.includes("UNIQUE constraint")) {
        return res.send("Username already exists.");
      }
      return res.send("Registration error.");
    }
    res.redirect("/");
  });
});

// Dashboard (yêu cầu auth middleware áp dụng ở app.js)
router.get("/dashboard", (req, res) => {
  const search = req.query.search || "";
  const sql = search
    ? "SELECT * FROM logs WHERE username LIKE ? OR ip LIKE ? OR hostname LIKE ? ORDER BY timestamp DESC"
    : "SELECT * FROM logs ORDER BY timestamp DESC";
  const params = search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [];
  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.send("Database error loading logs.");
    }
    db.all("SELECT * FROM blocks", (err2, blocks) => {
      if (err2) return res.send("Database error loading blocks.");
      res.render("dashboard", { user: req.session.user, logs: rows, blocks, search });
    });
  });
});

// Thêm block
router.post("/block", (req, res) => {
  const { type, value } = req.body;
  if (!["ip", "hostname"].includes(type)) {
    return res.send("Invalid block type.");
  }
  db.run("INSERT INTO blocks (type, value) VALUES (?, ?)", [type, value], (err) => {
    if (err) {
      return res.send("Error adding block.");
    }
    res.redirect("/dashboard");
  });
});

// Xóa block
router.post("/unblock", (req, res) => {
  const { id } = req.body;
  db.run("DELETE FROM blocks WHERE id = ?", [id], (err) => {
    if (err) {
      return res.send("Error removing block.");
    }
    res.redirect("/dashboard");
  });
});

// Xóa log
router.post("/delete-log", (req, res) => {
  const { id } = req.body;
  db.run("DELETE FROM logs WHERE id = ?", [id], (err) => {
    if (err) {
      return res.send("Error deleting log.");
    }
    res.redirect("/dashboard");
  });
});

// Xóa tất cả log
router.post("/clear-logs", (req, res) => {
  db.run("DELETE FROM logs", (err) => {
    if (err) {
      return res.send("Error clearing logs.");
    }
    res.redirect("/dashboard");
  });
});

// Đăng xuất
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

module.exports = router;
