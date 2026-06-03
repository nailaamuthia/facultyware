const db = require("../lib/db");

const index = async (req, res, next) => {
  try {
    const [publikasi] = await db.query(`
      SELECT * FROM publications
      ORDER BY id DESC
    `);

    res.render("publikasi/index", {
      pageTitle: "Daftar Publikasi",
      user: req.session.user,
      publikasi,
    });
  } catch (err) {
    next(err);
  }
};

const create = (req, res) => {
  res.render("publikasi/create", {
    pageTitle: "Tambah Publikasi",
    user: req.session.user,
    error: null,
  });
};

const store = async (req, res, next) => {
  try {
    const { title, publication_date, doi, url, abstract } = req.body;

    if (!title || !publication_date) {
      return res.render("publikasi/create", {
        pageTitle: "Tambah Publikasi",
        user: req.session.user,
        error: "Judul dan tanggal publikasi wajib diisi.",
      });
    }

    await db.query(
      `
      INSERT INTO publications
      (title, publication_date, doi, url, abstract)
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        title,
        publication_date,
        doi || null,
        url || null,
        abstract || null,
      ]
    );

    res.redirect("/publikasi");
  } catch (err) {
    next(err);
  }
};

module.exports = {
  index,
  create,
  store,
};