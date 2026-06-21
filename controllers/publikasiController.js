const db = require("../lib/db");

const getUser = (req) => ({
  name: req.session.username || 'User',
  email: req.session.email || '',
  role: req.session.role || 'dosen',
});

const index = async (req, res, next) => {
  try {
    const [publikasi] = await db.query(`SELECT * FROM publications ORDER BY id DESC`);
    res.render("publikasi/index", { pageTitle: "Daftar Publikasi", user: getUser(req), publikasi });
  } catch (err) { next(err); }
};

const create = (req, res) => {
  res.render("publikasi/create", { pageTitle: "Tambah Publikasi", user: getUser(req), error: null });
};

const store = async (req, res, next) => {
  try {
    const { title, publication_type, publication_date, doi, url, abstract } = req.body;
    if (!title || !publication_date) {
      return res.render("publikasi/create", {
        pageTitle: "Tambah Publikasi", user: getUser(req),
        error: "Judul dan tanggal publikasi wajib diisi.",
      });
    }
    await db.query(
      `INSERT INTO publications (title, publication_type, publication_date, doi, url, abstract) VALUES (?, ?, ?, ?, ?, ?)`,
      [title, publication_type || null, publication_date, doi || null, url || null, abstract || null]
    );
    res.redirect("/publikasi");
  } catch (err) { next(err); }
};

const show = async (req, res, next) => {
  try {
    const [rows] = await db.query(`SELECT * FROM publications WHERE id = ?`, [req.params.id]);
    if (rows.length === 0) return res.status(404).render("error", { pageTitle: "Tidak Ditemukan", user: getUser(req), message: "Data publikasi tidak ditemukan." });
    res.render("publikasi/detail", { pageTitle: "Detail Publikasi", user: getUser(req), publikasi: rows[0] });
  } catch (err) { next(err); }
};

const edit = async (req, res, next) => {
  try {
    const [rows] = await db.query(`SELECT * FROM publications WHERE id = ?`, [req.params.id]);
    if (rows.length === 0) return res.status(404).render("error", { pageTitle: "Tidak Ditemukan", user: getUser(req), message: "Data publikasi tidak ditemukan." });
    res.render("publikasi/edit", { pageTitle: "Edit Publikasi", user: getUser(req), publikasi: rows[0], error: null });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { title, publication_type, publication_date, doi, url, abstract } = req.body;
    const { id } = req.params;
    if (!title || !publication_date) {
      const [rows] = await db.query(`SELECT * FROM publications WHERE id = ?`, [id]);
      return res.render("publikasi/edit", {
        pageTitle: "Edit Publikasi", user: getUser(req),
        publikasi: rows[0], error: "Judul dan tanggal publikasi wajib diisi.",
      });
    }
    await db.query(
      `UPDATE publications SET title=?, publication_type=?, publication_date=?, doi=?, url=?, abstract=?, updated_at=NOW() WHERE id=?`,
      [title, publication_type || null, publication_date, doi || null, url || null, abstract || null, id]
    );
    res.redirect("/publikasi/" + id);
  } catch (err) { next(err); }
};

const destroy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(`SELECT * FROM publications WHERE id = ?`, [id]);
    if (rows.length === 0) return res.status(404).render("error", {
      pageTitle: "Tidak Ditemukan", user: getUser(req), message: "Data publikasi tidak ditemukan."
    });
    await db.query(`DELETE FROM publications WHERE id = ?`, [id]);
    res.redirect("/publikasi");
  } catch (err) { next(err); }
};

const apiGetAll = async (req, res, next) => {
  try {
    const [publikasi] = await db.query(`SELECT * FROM publications ORDER BY id DESC`);
    res.json({ status: "success", total: publikasi.length, data: publikasi });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

const apiGetById = async (req, res, next) => {
  try {
    const [rows] = await db.query(`SELECT * FROM publications WHERE id = ?`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ status: "error", message: "Publikasi tidak ditemukan." });
    res.json({ status: "success", data: rows[0] });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// POST /publikasi/json - tambah publikasi baru via API
const apiCreate = async (req, res, next) => {
  try {
    const { title, publication_type, publication_date, doi, url, abstract } = req.body;

    if (!title || !publication_date) {
      return res.status(422).json({
        status: "error",
        message: "Judul dan tanggal publikasi wajib diisi.",
      });
    }

    const [result] = await db.query(
      `INSERT INTO publications (title, publication_type, publication_date, doi, url, abstract) VALUES (?, ?, ?, ?, ?, ?)`,
      [title, publication_type || null, publication_date, doi || null, url || null, abstract || null]
    );

    const [rows] = await db.query(`SELECT * FROM publications WHERE id = ?`, [result.insertId]);
    res.status(201).json({ status: "success", message: "Publikasi berhasil ditambahkan.", data: rows[0] });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// PUT /publikasi/json/:id - update publikasi via API
const apiUpdate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, publication_type, publication_date, doi, url, abstract } = req.body;

    const [existing] = await db.query(`SELECT * FROM publications WHERE id = ?`, [id]);
    if (existing.length === 0) {
      return res.status(404).json({ status: "error", message: "Publikasi tidak ditemukan." });
    }

    if (!title || !publication_date) {
      return res.status(422).json({
        status: "error",
        message: "Judul dan tanggal publikasi wajib diisi.",
      });
    }

    await db.query(
      `UPDATE publications SET title=?, publication_type=?, publication_date=?, doi=?, url=?, abstract=?, updated_at=NOW() WHERE id=?`,
      [title, publication_type || null, publication_date, doi || null, url || null, abstract || null, id]
    );

    const [rows] = await db.query(`SELECT * FROM publications WHERE id = ?`, [id]);
    res.json({ status: "success", message: "Publikasi berhasil diperbarui.", data: rows[0] });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// DELETE /publikasi/json/:id - hapus publikasi via API
const apiDelete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query(`SELECT * FROM publications WHERE id = ?`, [id]);
    if (existing.length === 0) {
      return res.status(404).json({ status: "error", message: "Publikasi tidak ditemukan." });
    }

    await db.query(`DELETE FROM publications WHERE id = ?`, [id]);
    res.json({ status: "success", message: "Publikasi berhasil dihapus." });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

module.exports = { index, create, store, show, edit, update, destroy, apiGetAll, apiGetById, apiCreate, apiUpdate, apiDelete };