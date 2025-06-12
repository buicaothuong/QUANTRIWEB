const db = require("../db/db");

module.exports = function (req, res, next) {
  if (!req.session.user) {
    return next(); // Nếu chưa đăng nhập, bỏ qua
  }

  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const hostname = req.hostname || req.socket.remoteAddress; // hoặc bạn có thể lấy hostname khác nếu muốn

  // Kiểm tra IP hoặc hostname có bị block không
  db.get(
    "SELECT * FROM blocks WHERE (type = 'ip' AND value = ?) OR (type = 'hostname' AND value = ?)",
    [ip, hostname],
    (err, row) => {
      if (err) {
        console.error("Block check error:", err);
        return next();
      }
      if (row) {
        // Nếu bị block thì logout và trả về thông báo
        req.session.destroy(() => {
          res.status(403).send("Your IP or machine is blocked.");
        });
      } else {
        next();
      }
    }
  );
};
