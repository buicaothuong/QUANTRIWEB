const express = require("express");
const router = express.Router();
const db = require("../db/db");

// Trang đăng nhập
router.get("/", (req, res) => {
  if (req.session.user) {
    return res.redirect("/admin/dashboard");
  }
  res.render("login", { error: null });
});

// Xử lý đăng nhập
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.get(
    "SELECT * FROM users WHERE username = ? AND password = ?",
    [username, password],
    (err, user) => {
      if (err) return res.send("Lỗi truy vấn database.");
if (user) {
  if (user.status === "banned") {
    return res.render("login", { error: "Tài khoản của bạn đã bị khóa vì vi phạm. Vui lòng liên hệ quản trị viên." });
  }
  req.session.user = { username: user.username, role: user.role };
  if (user.role === "admin") {
    res.redirect("/admin/dashboard");
  } else {
    res.redirect("/auth/welcome");
  }
}

      else {
        res.render("login", { error: "Đăng nhập thất bại. Vui lòng thử lại." });
      }
    }
  );
});

// Trang đăng ký
router.get("/register", (req, res) => {
  res.render("register", { error: null });
});

// Xử lý đăng ký
router.post("/register", (req, res) => {
  const { username, password } = req.body;

  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (err) return res.send("Lỗi truy vấn database.");

    if (user) {
      return res.render("register", { error: "Tên đăng nhập đã tồn tại!" });
    }

    db.run(
      "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
      [username, password, "member"],
      (err) => {
        if (err) return res.send("Lỗi đăng ký tài khoản.");
        res.redirect("/");
      }
    );
  });
});

// Xử lý logout
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

// Trang chào mừng user thường
router.get("/welcome", (req, res) => {
  if (req.session.user && req.session.user.role === "member") {
    res.render("welcome", { user: req.session.user });
  } else {
    res.redirect("/");
  }
});

module.exports = router;

