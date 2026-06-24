const db = require('../lib/db');

exports.index = async (req, res) => {
  const user = {
    id: req.session.userId,
    name: req.session.username,
    email: req.session.email,
    role: req.session.role || 'dosen',
  };

  try {
    if (user.role === 'dosen_anggota') {
      const [[{ totalUndangan }]] = await db.query(
        `SELECT COUNT(*) AS totalUndangan FROM undangan_approval WHERE invited_user_id = ?`,
        [user.id]
      );
      const [[{ totalDisetujui }]] = await db.query(
        `SELECT COUNT(*) AS totalDisetujui FROM undangan_approval WHERE invited_user_id = ? AND status = 'approved'`,
        [user.id]
      );
      const [[{ totalDitolak }]] = await db.query(
        `SELECT COUNT(*) AS totalDitolak FROM undangan_approval WHERE invited_user_id = ? AND status = 'rejected'`,
        [user.id]
      );
      const [[{ totalPending }]] = await db.query(
        `SELECT COUNT(*) AS totalPending FROM undangan_approval WHERE invited_user_id = ? AND status = 'pending'`,
        [user.id]
      );
      const [undanganTerbaru] = await db.query(
        `SELECT ua.id, ua.status, ua.created_at,
                p.title, p.publication_type, p.publication_date
         FROM undangan_approval ua
         JOIN publications p ON ua.publication_id = p.id
         WHERE ua.invited_user_id = ?
         ORDER BY ua.created_at DESC LIMIT 5`,
        [user.id]
      );

      return res.render('home', {
        user,
        stats: { totalUndangan, totalDisetujui, totalDitolak, totalPending },
        undanganTerbaru,
        publikasiTerbaru: []
      });

    } else {
      const [[{ totalPublikasi }]] = await db.query(
        `SELECT COUNT(*) AS totalPublikasi FROM publications`
      );
      const [[{ totalJurnal }]] = await db.query(
        `SELECT COUNT(*) AS totalJurnal FROM publications WHERE LOWER(TRIM(publication_type)) = 'jurnal'`
      );
      const [[{ totalProsiding }]] = await db.query(
        `SELECT COUNT(*) AS totalProsiding FROM publications WHERE LOWER(TRIM(publication_type)) = 'prosiding'`
      );
      const [[{ publikasiTahunIni }]] = await db.query(
        `SELECT COUNT(*) AS publikasiTahunIni FROM publications WHERE publication_date IS NOT NULL AND YEAR(publication_date) = YEAR(CURDATE())`
      );
      const [publikasiTerbaru] = await db.query(
        `SELECT id, title, publication_type, publication_date FROM publications ORDER BY created_at DESC LIMIT 5`
      );

      return res.render('home', {
        user,
        stats: { totalPublikasi, totalJurnal, totalProsiding, publikasiTahunIni },
        publikasiTerbaru,
        undanganTerbaru: []
      });
    }

  } catch (err) {
    console.error('homeController error:', err);
    return res.status(500).render('error', { message: 'Gagal memuat halaman beranda.' });
  }
};
