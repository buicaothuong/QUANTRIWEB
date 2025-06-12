const express = require("express");
const router = express.Router();
const db = require("../db/db");

// Middleware: chỉ cho phép admin truy cập
function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === "admin") {
    next();
  } else {
    res.status(403).send("Bạn không có quyền truy cập.");
  }
}

// Trang quản lý user
router.get("/users", isAdmin, (req, res) => {
  db.all("SELECT * FROM users", [], (err, users) => {
    if (err) return res.send("Lỗi truy vấn người dùng.");
    res.render("users/manage", { users });
  });
});

// Tạo user mới
router.post("/users/create", isAdmin, (req, res) => {
  const { username, password, role } = req.body;
  db.run("INSERT INTO users (username, password, role, status) VALUES (?, ?, ?, ?)",
    [username, password, role, "active"], (err) => {
      if (err) return res.send("Lỗi tạo tài khoản.");
      res.redirect("/admin/users");
    });
});

// Sửa user
router.post("/users/edit", isAdmin, (req, res) => {
  const { id, password, role } = req.body;
  db.run("UPDATE users SET password = ?, role = ? WHERE id = ?",
    [password, role, id], (err) => {
      if (err) return res.send("Lỗi sửa tài khoản.");
      res.redirect("/admin/users");
    });
});

// Xoá user
router.post("/users/delete", isAdmin, (req, res) => {
  const { id } = req.body;
  db.run("DELETE FROM users WHERE id = ?", [id], (err) => {
    if (err) return res.send("Lỗi xoá tài khoản.");
    res.redirect("/admin/users");
  });
});

// Khoá / mở khoá user
router.post("/users/toggle-block", isAdmin, (req, res) => {
  const { id, status } = req.body;
  const newStatus = status === "active" ? "banned" : "active";
  db.run("UPDATE users SET status = ? WHERE id = ?", [newStatus, id], (err) => {
    if (err) return res.send("Lỗi cập nhật trạng thái.");
    res.redirect("/admin/users");
  });
});

module.exports = router;
