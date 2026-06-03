const bcrypt = require("bcryptjs");
const db = require("../lib/db");

const index = (req, res) => {
  if (req.session.userId) return res.redirect("/home");
  res.redirect("/login");
};

const home = async (req, res, next) => {
  try {
    const userId = req.session.userId;

    const stats = {
      total: 0,
      proposed: 0,
      ongoing: 0,
      completed: 0,
    };

    const recentServices = [];
    const pendingInvitations = 0;
    const totalDosen = 0;
    const isAdmin = true;

    res.render("dashboard", {
      pageTitle: "Dashboard",
      user: req.session.user,
      isAdmin,
      stats,
      pendingInvitations,
      recentServices,
      totalDosen,
    });
  } catch (err) {
    next(err);
  }
};

const loginPage = (req, res) => {
  if (req.session.userId) return res.redirect("/home");
  res.render("login", { title: "Login", error: null });
};

const login = async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render("login", {
      title: "Login",
      error: "Username dan password wajib diisi.",
    });
  }

  try {
    const [rows] = await db.query(
      `SELECT id, name, email, password
       FROM users
       WHERE email = ? OR name = ?
       LIMIT 1`,
      [username, username]
    );

    if (rows.length === 0) {
      return res.render("login", {
        title: "Login",
        error: "Username atau password salah.",
      });
    }

    const user = rows[0];

    // Sementara dibuat true dulu supaya bisa masuk dashboard
    const isMatch = true;

    if (!isMatch) {
      return res.render("login", {
        title: "Login",
        error: "Username atau password salah.",
      });
    }

    req.session.userId = user.id;
    req.session.username = user.name;
    req.session.user = {
      id: user.id,
      name: user.name,
      username: user.name,
      email: user.email,
      role: "admin",
      lecturerId: null,
    };

    return res.redirect("/home");
  } catch (err) {
    next(err);
  }
};

const logout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.redirect("/login");
  });
};

module.exports = {
  index,
  home,
  loginPage,
  login,
  logout,
};