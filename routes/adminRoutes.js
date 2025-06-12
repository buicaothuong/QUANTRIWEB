const express = require("express");
const router = express.Router();
const db = require("../db/db");

// Middleware kiểm tra đã đăng nhập và phải là admin
function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === "admin") {
    next();
  } else {
    res.status(403).send("Bạn không có quyền truy cập.");
  }
}

// Trang dashboard admin - hiển thị logs (có hỗ trợ tìm kiếm)
router.get("/dashboard", isAdmin, (req, res) => {
  const keyword = req.query.keyword || "";
  const likeKeyword = `%${keyword}%`;
  
  const query = `
    SELECT * FROM logs 
    WHERE username LIKE ? OR ip LIKE ? OR hostname LIKE ?
    ORDER BY timestamp DESC
  `;
  
  db.all(query, [likeKeyword, likeKeyword, likeKeyword], (err, logs) => {
    if (err) return res.send("Lỗi truy vấn logs.");
    res.render("logs/logs", { user: req.session.user, logs, keyword });
  });
});

// Thêm block IP hoặc hostname
router.post("/block", isAdmin, (req, res) => {
  const { type, value } = req.body;
  if (!type || !value) {
    return res.send("Thiếu thông tin block.");
  }
  db.run("INSERT INTO blocks (type, value) VALUES (?, ?)", [type, value], (err) => {
    if (err) return res.send("Lỗi khi thêm block.");
    res.redirect("/admin/dashboard");
  });
});

// Xóa 1 log theo id
router.post("/delete-log", isAdmin, (req, res) => {
  const { id } = req.body;
  if (!id) return res.send("Thiếu id log.");
  db.run("DELETE FROM logs WHERE id = ?", [id], (err) => {
    if (err) return res.send("Lỗi khi xóa log.");
    res.redirect("/admin/dashboard");
  });
});

// Clear tất cả logs
router.post("/clear-logs", isAdmin, (req, res) => {
  db.run("DELETE FROM logs", (err) => {
    if (err) return res.send("Lỗi khi xóa logs.");
    res.redirect("/admin/dashboard");
  });
});
// Khóa tài khoản
router.post("/users/block/:id", isAdmin, (req, res) => {
  const userId = req.params.id;
  db.run("UPDATE users SET status = 'banned' WHERE id = ?", [userId], (err) => {
    if (err) return res.send("Lỗi khi khóa tài khoản.");
    res.redirect("/admin/users");
  });
});

// Mở khóa tài khoản
router.post("/users/unblock/:id", isAdmin, (req, res) => {
  const userId = req.params.id;
  db.run("UPDATE users SET status = 'active' WHERE id = ?", [userId], (err) => {
    if (err) return res.send("Lỗi khi mở khóa tài khoản.");
    res.redirect("/admin/users");
  });
});


module.exports = router;
