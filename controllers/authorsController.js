const db = require("../lib/db");
const ExcelJS = require("exceljs");

const getUser = (req) => ({
  name: req.session.username || 'User',
  email: req.session.email || '',
  role: req.session.role || 'dosen',
});

// ========== WEB VIEW HANDLERS ==========

const index = async (req, res, next) => {
  try {
    const [authors] = await db.query(`
      SELECT pa.*, COUNT(ap.id) as publication_count 
      FROM authors pa 
      LEFT JOIN author_publications ap ON pa.id = ap.author_id 
      GROUP BY pa.id 
      ORDER BY pa.name ASC
    `);
    res.render("authors/index", { 
      pageTitle: "Daftar Penulis Publikasi", 
      user: getUser(req), 
      authors 
    });
  } catch (err) { next(err); }
};

const create = (req, res) => {
  res.render("authors/create", { 
    pageTitle: "Tambah Penulis Publikasi", 
    user: getUser(req), 
    error: null 
  });
};

const store = async (req, res, next) => {
  try {
    const { name, email, institution, expertise } = req.body;
    
    if (!name) {
      return res.render("authors/create", {
        pageTitle: "Tambah Penulis Publikasi", 
        user: getUser(req),
        error: "Nama penulis wajib diisi.",
      });
    }

    // Check if author already exists
    const [existing] = await db.query(
      `SELECT id FROM authors WHERE LOWER(name) = LOWER(?) LIMIT 1`,
      [name]
    );

    if (existing.length > 0) {
      return res.render("authors/create", {
        pageTitle: "Tambah Penulis Publikasi", 
        user: getUser(req),
        error: "Penulis dengan nama yang sama sudah ada.",
      });
    }

    await db.query(
      `INSERT INTO authors (name, email, institution, expertise) VALUES (?, ?, ?, ?)`,
      [name, email || null, institution || null, expertise || null]
    );

    res.redirect("/authors");
  } catch (err) { next(err); }
};

const show = async (req, res, next) => {
  try {
    const [rows] = await db.query(`SELECT * FROM authors WHERE id = ?`, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).render("error", { 
        pageTitle: "Tidak Ditemukan", 
        user: getUser(req), 
        message: "Data penulis tidak ditemukan." 
      });
    }

    const author = rows[0];

    // Get associated publications
    const [publications] = await db.query(`
      SELECT p.* FROM publications p
      INNER JOIN author_publications ap ON p.id = ap.publication_id
      WHERE ap.author_id = ?
      ORDER BY p.publication_date DESC
    `, [req.params.id]);

    res.render("authors/detail", { 
      pageTitle: "Detail Penulis", 
      user: getUser(req), 
      author,
      publications 
    });
  } catch (err) { next(err); }
};

const edit = async (req, res, next) => {
  try {
    const [rows] = await db.query(`SELECT * FROM authors WHERE id = ?`, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).render("error", { 
        pageTitle: "Tidak Ditemukan", 
        user: getUser(req), 
        message: "Data penulis tidak ditemukan." 
      });
    }

    res.render("authors/edit", { 
      pageTitle: "Edit Penulis Publikasi", 
      user: getUser(req), 
      author: rows[0], 
      error: null 
    });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { name, email, institution, expertise } = req.body;
    const { id } = req.params;

    if (!name) {
      const [rows] = await db.query(`SELECT * FROM authors WHERE id = ?`, [id]);
      return res.render("authors/edit", {
        pageTitle: "Edit Penulis Publikasi", 
        user: getUser(req),
        author: rows[0], 
        error: "Nama penulis wajib diisi.",
      });
    }

    // Check if name already exists for other authors
    const [existing] = await db.query(
      `SELECT id FROM authors WHERE LOWER(name) = LOWER(?) AND id != ? LIMIT 1`,
      [name, id]
    );

    if (existing.length > 0) {
      const [rows] = await db.query(`SELECT * FROM authors WHERE id = ?`, [id]);
      return res.render("authors/edit", {
        pageTitle: "Edit Penulis Publikasi", 
        user: getUser(req),
        author: rows[0], 
        error: "Penulis dengan nama yang sama sudah ada.",
      });
    }

    await db.query(
      `UPDATE authors SET name=?, email=?, institution=?, expertise=?, updated_at=NOW() WHERE id=?`,
      [name, email || null, institution || null, expertise || null, id]
    );

    res.redirect("/authors/" + id);
  } catch (err) { next(err); }
};

const destroy = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const [rows] = await db.query(`SELECT * FROM authors WHERE id = ?`, [id]);
    if (rows.length === 0) {
      return res.status(404).render("error", {
        pageTitle: "Tidak Ditemukan", 
        user: getUser(req), 
        message: "Data penulis tidak ditemukan."
      });
    }

    // Delete author from publications
    await db.query(`DELETE FROM author_publications WHERE author_id = ?`, [id]);
    
    // Delete author
    await db.query(`DELETE FROM authors WHERE id = ?`, [id]);
    
    res.redirect("/authors");
  } catch (err) { next(err); }
};

// ========== EXPORT FUNCTIONALITY ==========

const exportCSV = async (req, res, next) => {
  try {
    const [authors] = await db.query(`
      SELECT pa.*, COUNT(ap.id) as publication_count 
      FROM authors pa 
      LEFT JOIN author_publications ap ON pa.id = ap.author_id 
      GROUP BY pa.id 
      ORDER BY pa.name ASC
    `);

    const csv = generateCSV(authors);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=penulis-publikasi.csv");
    res.send(csv);
  } catch (err) { next(err); }
};

const exportExcel = async (req, res, next) => {
  try {
    const [authors] = await db.query(`
      SELECT pa.*, COUNT(ap.id) as publication_count 
      FROM authors pa 
      LEFT JOIN author_publications ap ON pa.id = ap.author_id 
      GROUP BY pa.id 
      ORDER BY pa.name ASC
    `);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Penulis Publikasi");

    // Header styling
    const headerStyle = {
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF008B4B" } },
      font: { bold: true, color: { argb: "FFFFFFFF" } },
      alignment: { horizontal: "center", vertical: "center" }
    };

    // Add headers
    worksheet.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "Nama", key: "name", width: 30 },
      { header: "Email", key: "email", width: 25 },
      { header: "Institusi", key: "institution", width: 30 },
      { header: "Keahlian", key: "expertise", width: 20 },
      { header: "Jumlah Publikasi", key: "publication_count", width: 15 }
    ];

    // Apply header style
    worksheet.getRow(1).eachCell((cell) => {
      Object.assign(cell, headerStyle);
    });

    // Add data
    authors.forEach((author, idx) => {
      worksheet.addRow({
        no: idx + 1,
        name: author.name,
        email: author.email || "-",
        institution: author.institution || "-",
        expertise: author.expertise || "-",
        publication_count: author.publication_count
      });
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=penulis-publikasi.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) { next(err); }
};

// ========== API ENDPOINTS ==========

const apiGetAll = async (req, res, next) => {
  try {
    const [authors] = await db.query(`
      SELECT pa.*, COUNT(ap.id) as publication_count 
      FROM authors pa 
      LEFT JOIN author_publications ap ON pa.id = ap.author_id 
      GROUP BY pa.id 
      ORDER BY pa.name ASC
    `);
    
    res.json({ 
      status: "success", 
      total: authors.length, 
      data: authors 
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

const apiGetById = async (req, res, next) => {
  try {
    const [rows] = await db.query(`SELECT * FROM authors WHERE id = ?`, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ status: "error", message: "Penulis tidak ditemukan." });
    }

    const author = rows[0];

    // Get associated publications
    const [publications] = await db.query(`
      SELECT p.* FROM publications p
      INNER JOIN author_publications ap ON p.id = ap.publication_id
      WHERE ap.author_id = ?
      ORDER BY p.publication_date DESC
    `, [req.params.id]);

    res.json({ 
      status: "success", 
      data: { ...author, publications } 
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

const apiCreate = async (req, res, next) => {
  try {
    const { name, email, institution, expertise } = req.body;

    if (!name) {
      return res.status(400).json({ 
        status: "error", 
        message: "Nama penulis wajib diisi." 
      });
    }

    // Check if author already exists
    const [existing] = await db.query(
      `SELECT id FROM authors WHERE LOWER(name) = LOWER(?) LIMIT 1`,
      [name]
    );

    if (existing.length > 0) {
      return res.status(400).json({ 
        status: "error", 
        message: "Penulis dengan nama yang sama sudah ada." 
      });
    }

    const result = await db.query(
      `INSERT INTO authors (name, email, institution, expertise) VALUES (?, ?, ?, ?)`,
      [name, email || null, institution || null, expertise || null]
    );

    const authorId = result[0].insertId;

    const [newAuthor] = await db.query(`SELECT * FROM authors WHERE id = ?`, [authorId]);

    res.status(201).json({ 
      status: "success", 
      message: "Penulis berhasil ditambahkan",
      data: newAuthor[0]
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

const apiUpdate = async (req, res, next) => {
  try {
    const { name, email, institution, expertise } = req.body;
    const { id } = req.params;

    if (!name) {
      return res.status(400).json({ 
        status: "error", 
        message: "Nama penulis wajib diisi." 
      });
    }

    // Check if author exists
    const [rows] = await db.query(`SELECT * FROM authors WHERE id = ?`, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ status: "error", message: "Penulis tidak ditemukan." });
    }

    // Check if name already exists for other authors
    const [existing] = await db.query(
      `SELECT id FROM authors WHERE LOWER(name) = LOWER(?) AND id != ? LIMIT 1`,
      [name, id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ 
        status: "error", 
        message: "Penulis dengan nama yang sama sudah ada." 
      });
    }

    await db.query(
      `UPDATE authors SET name=?, email=?, institution=?, expertise=?, updated_at=NOW() WHERE id=?`,
      [name, email || null, institution || null, expertise || null, id]
    );

    const [updatedAuthor] = await db.query(`SELECT * FROM authors WHERE id = ?`, [id]);

    res.json({ 
      status: "success", 
      message: "Penulis berhasil diperbarui",
      data: updatedAuthor[0]
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

const apiDelete = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(`SELECT * FROM authors WHERE id = ?`, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ status: "error", message: "Penulis tidak ditemukan." });
    }

    // Delete author from publications
    await db.query(`DELETE FROM author_publications WHERE author_id = ?`, [id]);

    // Delete author
    await db.query(`DELETE FROM authors WHERE id = ?`, [id]);

    res.json({ 
      status: "success", 
      message: "Penulis berhasil dihapus" 
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ========== HELPER FUNCTIONS ==========

function generateCSV(authors) {
  let csv = "No,Nama,Email,Institusi,Keahlian,Jumlah Publikasi\n";
  
  authors.forEach((author, idx) => {
    const row = [
      idx + 1,
      `"${author.name || ''}"`,
      `"${author.email || ''}"`,
      `"${author.institution || ''}"`,
      `"${author.expertise || ''}"`,
      author.publication_count || 0
    ].join(",");
    csv += row + "\n";
  });

  return csv;
}

module.exports = {
  // Web view handlers
  index,
  create,
  store,
  show,
  edit,
  update,
  destroy,
  
  // Export functionality
  exportCSV,
  exportExcel,
  
  // API endpoints
  apiGetAll,
  apiGetById,
  apiCreate,
  apiUpdate,
  apiDelete
};
