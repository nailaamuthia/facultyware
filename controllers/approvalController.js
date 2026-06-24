const db = require('../lib/db');

// Helper: kondisi WHERE supaya konsisten di semua query.
// - Dosen biasa hanya melihat baris penulis miliknya sendiri (lecturer_id = userId).
// - Role 'dosen' yang berperan sebagai admin (user pertama / Admin) juga melihat
//   penulis eksternal (lecturer_id IS NULL) karena merekalah yang harus approve.
const buildScope = (req) => {
  const userId = req.session.userId;
  const isAdmin = req.session.role === 'dosen'; // role non-dosen_anggota dianggap admin/dosen utama
  if (isAdmin) {
    return { clause: '(pa.lecturer_id = ? OR pa.lecturer_id IS NULL)', params: [userId] };
  }
  return { clause: 'pa.lecturer_id = ?', params: [userId] };
};

// 1. Daftar undangan publikasi (penulis yang menunggu/diproses approval)
const index = async (req, res, next) => {
  try {
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const scope = buildScope(req);

    const [undangan] = await db.query(`
      SELECT pa.id, pa.publication_id, pa.status,
             pa.approved_at, pa.approval_note,
             p.title, p.publication_type, p.publication_date
      FROM publication_authors pa
      JOIN publications p ON pa.publication_id = p.id
      WHERE ${scope.clause} AND p.title LIKE ?
      ORDER BY pa.created_at DESC
      LIMIT ? OFFSET ?
    `, [...scope.params, `%${search}%`, limit, offset]);

    const [[{ total }]] = await db.query(`
      SELECT COUNT(*) as total
      FROM publication_authors pa
      JOIN publications p ON pa.publication_id = p.id
      WHERE ${scope.clause} AND p.title LIKE ?
    `, [...scope.params, `%${search}%`]);

    res.render('approval/index', {
      title: 'Daftar Undangan Publikasi',
      user: { name: req.session.username, email: req.session.email, role: req.session.role },
      undangan,
      search,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
};

// 2. Detail undangan
const show = async (req, res, next) => {
  try {
    const { id } = req.params;
    const scope = buildScope(req);

    const [[undangan]] = await db.query(`
      SELECT pa.*, p.title, p.publication_type, p.publication_date,
             p.doi, p.url, p.abstract
      FROM publication_authors pa
      JOIN publications p ON pa.publication_id = p.id
      WHERE pa.id = ? AND ${scope.clause}
    `, [id, ...scope.params]);

    if (!undangan) return res.status(404).render('error', { message: 'Undangan tidak ditemukan', status: 404 });

    res.render('approval/show', {
      title: 'Detail Undangan Publikasi',
      user: { name: req.session.username, email: req.session.email, role: req.session.role },
      undangan,
    });
  } catch (err) {
    next(err);
  }
};

// 3. Proses approve/reject
const action = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, approval_note } = req.body;
    const scope = buildScope(req);

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status tidak valid' });
    }

    await db.query(`
      UPDATE publication_authors pa
      SET pa.status = ?, pa.approval_note = ?, pa.approved_at = NOW()
      WHERE pa.id = ? AND ${scope.clause}
    `, [status, approval_note || null, id, ...scope.params]);

    res.redirect(`/approval/${id}?success=1`);
  } catch (err) {
    next(err);
  }
};

// 4. Riwayat approval
const history = async (req, res, next) => {
  try {
    const scope = buildScope(req);
    const [riwayat] = await db.query(`
      SELECT pa.id, pa.status, pa.approval_note, pa.approved_at,
             p.title, p.publication_type, p.publication_date
      FROM publication_authors pa
      JOIN publications p ON pa.publication_id = p.id
      WHERE ${scope.clause} AND pa.status != 'pending'
      ORDER BY pa.approved_at DESC
    `, scope.params);

    res.render('approval/history', {
      title: 'Riwayat Approval',
      user: { name: req.session.username, email: req.session.email, role: req.session.role },
      riwayat,
    });
  } catch (err) {
    next(err);
  }
};

// 5. Download PDF
const download = async (req, res, next) => {
  try {
    const { id } = req.params;
    const scope = buildScope(req);

    const [[undangan]] = await db.query(`
      SELECT pa.*, p.title, p.publication_type, p.publication_date,
             p.doi, p.url, p.abstract
      FROM publication_authors pa
      JOIN publications p ON pa.publication_id = p.id
      WHERE pa.id = ? AND ${scope.clause}
    `, [id, ...scope.params]);

    if (!undangan) return res.status(404).send('Not found');

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="undangan-${id}.pdf"`);
    doc.pipe(res);

    doc.fontSize(18).font('Helvetica-Bold').text('Detail Undangan Publikasi', { align: 'center' });
    doc.fontSize(11).font('Helvetica').text('Sistem Publikasi Dosen FTI — Universitas Andalas', { align: 'center' });
    doc.moveDown(1.5);
    doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke();
    doc.moveDown(1);

    const baris = (label, nilai) => {
      doc.font('Helvetica-Bold').fontSize(10).text(label + ':', { continued: false });
      doc.font('Helvetica').fontSize(10).text(nilai || '-');
      doc.moveDown(0.5);
    };

    baris('Judul', undangan.title);
    baris('Tipe Publikasi', undangan.publication_type);
    baris('Tanggal Publikasi', undangan.publication_date
      ? new Date(undangan.publication_date).toLocaleDateString('id-ID')
      : '-');
    baris('DOI', undangan.doi);
    baris('URL', undangan.url);
    baris('Abstrak', undangan.abstract);

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke();
    doc.moveDown(1);

    const statusLabel = undangan.status === 'approved' ? 'Disetujui'
      : undangan.status === 'rejected' ? 'Ditolak' : 'Menunggu';
    baris('Status Approval', statusLabel);
    if (undangan.approved_at) {
      baris('Tanggal Aksi', new Date(undangan.approved_at).toLocaleString('id-ID'));
    }
    if (undangan.approval_note) {
      baris('Catatan', undangan.approval_note);
    }

    doc.moveDown(2);
    doc.fontSize(9).fillColor('gray')
      .text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, { align: 'right' });

    doc.end();
  } catch (err) {
    next(err);
  }
};

// 6. API JSON
const apiList = async (req, res, next) => {
  try {
    const [data] = await db.query(`
      SELECT pa.id, pa.status, pa.approved_at, pa.approval_note,
             p.title, p.publication_type, p.publication_date, p.doi
      FROM publication_authors pa
      JOIN publications p ON pa.publication_id = p.id
      ORDER BY pa.created_at DESC
    `);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = { index, show, action, history, download, apiList };