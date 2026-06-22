const bcrypt = require("bcryptjs");
const db = require("../lib/db");

const index = (req, res) => {
  if (req.session.userId) return res.redirect("/home");
  res.redirect("/login");
};

const home = async (req, res, next) => {
  try {
    // Stat: total publikasi
    const [[{ totalPublikasi }]] = await db.query(
      "SELECT COUNT(*) as totalPublikasi FROM publications"
    );

    // Stat: total jurnal
    const [[{ totalJurnal }]] = await db.query(
      "SELECT COUNT(*) as totalJurnal FROM publications WHERE LOWER(TRIM(publication_type)) = 'jurnal'"
    );

    // Stat: total prosiding
    const [[{ totalProsiding }]] = await db.query(
      "SELECT COUNT(*) as totalProsiding FROM publications WHERE LOWER(TRIM(publication_type)) = 'prosiding'"
    );

    // Stat: publikasi tahun ini
    const [[{ publikasiTahunIni }]] = await db.query(
      "SELECT COUNT(*) as publikasiTahunIni FROM publications WHERE publication_date IS NOT NULL AND YEAR(publication_date) = YEAR(CURDATE())"
    );

    // 5 publikasi terbaru
    const [publikasiTerbaru] = await db.query(
        "SELECT id, title, publication_type, publication_date FROM publications ORDER BY created_at DESC LIMIT 5"
    );


    res.render("home", {
      title: "Beranda",
      user: {
        name: req.session.username,
        email: req.session.email || "",
        role: req.session.role || "dosen",
      },
      stats: {
        totalPublikasi,
        totalJurnal,
        totalProsiding,
        publikasiTahunIni,
      },
      publikasiTerbaru,
    });
  } catch (err) {
    next(err);
  }
};

const loginPage = (req, res) => {
  if (req.session.userId) {
    return res.redirect("/home");
  }
  res.render("login", { title: "Login", error: null });
};

const login = async (req, res, next) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.query(
      "SELECT * FROM users WHERE email = ? OR name = ? LIMIT 1",
      [username, username]
    );

    if (rows.length === 0) {
      return res.render("login", {
        title: "Login",
        error: "Invalid username or password",
      });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.render("login", {
        title: "Login",
        error: "Invalid username or password",
      });
    }

    req.session.userId = user.id;
    req.session.username = user.name;
    req.session.email = user.email;
    req.session.role =
      user.email === "salmiah@gmail.com" ? "dosen_anggota" : "dosen";

    res.redirect("/home");
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