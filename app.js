const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");
const db = require("./db/db");

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
  secret: "mysecret",
  resave: false,
  saveUninitialized: true
}));

app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware để ghi log
const logLogin = require("./middleware/logLogin");
app.use(logLogin);

// Middleware chặn IP/máy bị block
const blockCheck = require("./middleware/blockCheck");
app.use(blockCheck);

// Redirect / về /auth để tránh lỗi "Cannot GET /"
app.get("/", (req, res) => {
  res.redirect("/auth");
});

// Routes
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");

app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/admin", userRoutes);

// Xử lý logout
app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/auth");
  });
});

// Chạy server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
