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

    // Validasi semua field wajib diisi
    if (!title || !title.trim()) {
      return res.render("publikasi/create", { pageTitle: "Tambah Publikasi", user: getUser(req), error: "Error: Judul wajib diisi." });
    }
    if (!publication_type || !publication_type.trim()) {
      return res.render("publikasi/create", { pageTitle: "Tambah Publikasi", user: getUser(req), error: "Error: Jenis publikasi wajib dipilih." });
    }
    if (!publication_date || !publication_date.trim()) {
      return res.render("publikasi/create", { pageTitle: "Tambah Publikasi", user: getUser(req), error: "Error: Tanggal publikasi wajib diisi." });
    }
    if (!doi || !doi.trim()) {
      return res.render("publikasi/create", { pageTitle: "Tambah Publikasi", user: getUser(req), error: "Error: DOI wajib diisi." });
    }
    if (!url || !url.trim()) {
      return res.render("publikasi/create", { pageTitle: "Tambah Publikasi", user: getUser(req), error: "Error: URL publikasi wajib diisi." });
    }
    if (!abstract || !abstract.trim()) {
      return res.render("publikasi/create", { pageTitle: "Tambah Publikasi", user: getUser(req), error: "Error: Abstrak wajib diisi." });
    }

    // Validasi format DOI
    if (!doi.trim().match(/^10\.\d{4,}/)) {
      return res.render("publikasi/create", { pageTitle: "Tambah Publikasi", user: getUser(req), error: "Error: Format DOI tidak valid. Contoh: 10.1234/nama.jurnal.001" });
    }

    // Validasi DOI harus unik (belum dipakai publikasi lain)
    const [doiExists] = await db.query(
      `SELECT id FROM publications WHERE doi = ? LIMIT 1`,
      [doi.trim()]
    );
    if (doiExists.length > 0) {
      return res.render("publikasi/create", { pageTitle: "Tambah Publikasi", user: getUser(req), error: "Error: DOI tidak boleh sama dengan publikasi yang sudah ada." });
    }

    // Validasi format URL
    try {
      const parsed = new URL(url.trim());
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return res.render("publikasi/create", { pageTitle: "Tambah Publikasi", user: getUser(req), error: "Error: URL harus dimulai dengan http:// atau https://" });
      }
    } catch {
      return res.render("publikasi/create", { pageTitle: "Tambah Publikasi", user: getUser(req), error: "Error: Format URL tidak valid. Contoh: https://journal.unand.ac.id/artikel" });
    }

    await db.query(
      `INSERT INTO publications (title, publication_type, publication_date, doi, url, abstract) VALUES (?, ?, ?, ?, ?, ?)`,
      [title.trim(), publication_type.trim(), publication_date.trim(), doi.trim(), url.trim(), abstract.trim()]
    );
    res.redirect("/publikasi");
  } catch (err) { next(err); }
};

const show = async (req, res, next) => {
  try {
    const [rows] = await db.query(`SELECT * FROM publications WHERE id = ?`, [req.params.id]);
    if (rows.length === 0) return res.status(404).render("error", {
      pageTitle: "Tidak Ditemukan", user: getUser(req),
      message: "Data publikasi tidak ditemukan."
    });

    const [penulis] = await db.query(`
      SELECT pa.*, u.name as dosen_name, u.email as dosen_email
      FROM publication_authors pa
      LEFT JOIN users u ON pa.lecturer_id = u.id
      WHERE pa.publication_id = ?
      ORDER BY pa.author_order ASC
      `, [req.params.id]);

    // Daftar dosen (tabel users) yang BELUM jadi penulis di publikasi ini,
    // supaya muncul sebagai pilihan di modal "Pilih Penulis"
    const [semuaPenulis] = await db.query(`
      SELECT u.* FROM users u
      WHERE u.id NOT IN (
        SELECT lecturer_id FROM publication_authors
        WHERE publication_id = ? AND lecturer_id IS NOT NULL
      )
      ORDER BY u.name ASC
      `, [req.params.id]);

    res.render("publikasi/detail", {
      pageTitle: "Detail Publikasi",
      user: getUser(req),
      publikasi: rows[0],
      penulis: penulis,
      semuaPenulis: semuaPenulis
    });
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

    const [rows] = await db.query(`SELECT * FROM publications WHERE id = ?`, [id]);
    if (rows.length === 0) return res.status(404).render("error", { pageTitle: "Tidak Ditemukan", user: getUser(req), message: "Data tidak ditemukan." });

    const renderEdit = (error) => res.render("publikasi/edit", {
      pageTitle: "Edit Publikasi", user: getUser(req), publikasi: rows[0], error
    });

    // Validasi semua field wajib diisi
    if (!title || !title.trim()) return renderEdit("Error: Judul wajib diisi.");
    if (!publication_type || !publication_type.trim()) return renderEdit("Error: Jenis publikasi wajib dipilih.");
    if (!publication_date || !publication_date.trim()) return renderEdit("Error: Tanggal publikasi wajib diisi.");
    if (!doi || !doi.trim()) return renderEdit("Error: DOI wajib diisi.");
    if (!url || !url.trim()) return renderEdit("Error: URL publikasi wajib diisi.");
    if (!abstract || !abstract.trim()) return renderEdit("Error: Abstrak wajib diisi.");

    // Validasi format DOI
    if (!doi.trim().match(/^10\.\d{4,}/)) return renderEdit("Error: Format DOI tidak valid. Contoh: 10.1234/nama.jurnal.001");

    // Validasi DOI harus unik (belum dipakai publikasi LAIN, selain dirinya sendiri)
    const [doiExists] = await db.query(
      `SELECT id FROM publications WHERE doi = ? AND id != ? LIMIT 1`,
      [doi.trim(), id]
    );
    if (doiExists.length > 0) {
      return renderEdit("Error: DOI tidak boleh sama dengan publikasi yang sudah ada.");
    }

    // Validasi format URL
    try {
      const parsed = new URL(url.trim());
      if (!['http:', 'https:'].includes(parsed.protocol)) return renderEdit("Error: URL harus dimulai dengan http:// atau https://");
    } catch {
      return renderEdit("Error: Format URL tidak valid. Contoh: https://journal.unand.ac.id/artikel");
    }

    await db.query(
      `UPDATE publications SET title=?, publication_type=?, publication_date=?, doi=?, url=?, abstract=?, updated_at=NOW() WHERE id=?`,
      [title.trim(), publication_type.trim(), publication_date.trim(), doi.trim(), url.trim(), abstract.trim(), id]
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

    // Validasi DOI unik (jika diisi)
    if (doi) {
      const [doiExists] = await db.query(`SELECT id FROM publications WHERE doi = ? LIMIT 1`, [doi]);
      if (doiExists.length > 0) {
        return res.status(422).json({
          status: "error",
          message: "DOI ini sudah digunakan oleh publikasi lain.",
        });
      }
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

    // Validasi DOI unik (jika diisi), kecuali milik publikasi ini sendiri
    if (doi) {
      const [doiExists] = await db.query(`SELECT id FROM publications WHERE doi = ? AND id != ? LIMIT 1`, [doi, id]);
      if (doiExists.length > 0) {
        return res.status(422).json({
          status: "error",
          message: "DOI ini sudah digunakan oleh publikasi lain.",
        });
      }
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

// POST /publikasi/:id/tambah-penulis - hubungkan dosen (users) sebagai penulis publikasi
const tambahPenulis = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { lecturer_id } = req.body;

    if (!lecturer_id) return res.redirect("/publikasi/" + id);

    // Ambil data dosen dari tabel users
    const [users] = await db.query(`SELECT * FROM users WHERE id = ?`, [lecturer_id]);
    if (users.length === 0) return res.redirect("/publikasi/" + id);

    const dosen = users[0];

    // Cek apakah dosen ini sudah jadi penulis di publikasi ini
    const [existing] = await db.query(
      `SELECT id FROM publication_authors WHERE publication_id = ? AND lecturer_id = ?`,
      [id, lecturer_id]
    );
    if (existing.length > 0) return res.redirect("/publikasi/" + id);

    // Tentukan author_order berikutnya
    const [[{ maxOrder }]] = await db.query(
      `SELECT COALESCE(MAX(author_order), 0) as maxOrder FROM publication_authors WHERE publication_id = ?`,
      [id]
    );

    await db.query(
      `INSERT INTO publication_authors (publication_id, lecturer_id, author_order, name, email, status) VALUES (?, ?, ?, ?, ?, 'pending')`,
      [id, lecturer_id, maxOrder + 1, dosen.name, dosen.email]
    );

    res.redirect("/publikasi/" + id);
  } catch (err) { next(err); }
};

// POST /publikasi/:id/penulis/:penulisId/delete - hapus penulis dari publikasi
const hapusPenulis = async (req, res, next) => {
  try {
    const { id, penulisId } = req.params;
    await db.query(
      `DELETE FROM publication_authors WHERE id = ? AND publication_id = ?`,
      [penulisId, id]
    );
    res.redirect("/publikasi/" + id);
  } catch (err) { next(err); }
};

module.exports = { index, create, store, show, edit, update, destroy, tambahPenulis, hapusPenulis, apiGetAll, apiGetById, apiCreate, apiUpdate, apiDelete };