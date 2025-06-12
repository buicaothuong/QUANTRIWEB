const os = require("os");
const db = require("../db/db");

module.exports = function (req, res, next) {
  if (req.session.user) {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const hostname = os.hostname();

    // Lưu log đăng nhập mỗi lần request
    db.run(
      `INSERT INTO logs (username, ip, hostname, role, timestamp) VALUES (?, ?, ?, ?, datetime('now'))`,
      [req.session.user.username, ip, hostname, req.session.user.role],
      (err) => {
        if (err) {
          console.error("Error logging login:", err);
        }
      }
    );
  }
  next();
};
