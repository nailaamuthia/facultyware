const db = require("../lib/db");
const ExcelJS = require("exceljs");
const path = require("path");
const fs = require("fs");

const importPage = (req, res) => {
  res.render("publikasi/import", {
    pageTitle: "Import Publikasi",
    user: {
      name: req.session.username || 'User',
      email: req.session.email || '',
      role: req.session.role || 'dosen',
    },
    success: null,
    error: null,
  });
};

const importExcel = async (req, res, next) => {
  const user = {
    name: req.session.username || 'User',
    email: req.session.email || '',
    role: req.session.role || 'dosen',
  };

  try {
    if (!req.file) {
      return res.render("publikasi/import", {
        pageTitle: "Import Publikasi", user,
        error: "File belum dipilih. Silakan pilih file Excel (.xlsx).",
        success: null,
      });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);
    const sheet = workbook.worksheets[0];

    let imported = 0;
    let skipped = 0;

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // skip header
      const title = row.getCell(1).value;
      const publication_type = row.getCell(2).value;
      const publication_date = row.getCell(3).value;
      const doi = row.getCell(4).value;
      const url = row.getCell(5).value;
      const abstract = row.getCell(6).value;

      if (!title) { skipped++; return; }

      // Format tanggal
      let dateValue = null;
      if (publication_date instanceof Date) {
        dateValue = publication_date.toISOString().split('T')[0];
      } else if (typeof publication_date === 'string') {
        dateValue = publication_date;
      }

      db.query(
        `INSERT INTO publications (title, publication_type, publication_date, doi, url, abstract) VALUES (?, ?, ?, ?, ?, ?)`,
        [String(title), publication_type ? String(publication_type) : null, dateValue, doi ? String(doi) : null, url ? String(url) : null, abstract ? String(abstract) : null]
      );
      imported++;
    });

    // Hapus file temporary
    fs.unlinkSync(req.file.path);

    res.render("publikasi/import", {
      pageTitle: "Import Publikasi", user,
      success: `Berhasil import ${imported} data publikasi.${skipped > 0 ? ` ${skipped} baris dilewati (judul kosong).` : ''}`,
      error: null,
    });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    next(err);
  }
};

module.exports = { importPage, importExcel };

const downloadTemplate = async (req, res, next) => {
  try {
    const ExcelJS = require("exceljs");
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Template Publikasi");

    sheet.columns = [
      { header: "Judul Publikasi", key: "title", width: 40 },
      { header: "Jenis Publikasi", key: "publication_type", width: 20 },
      { header: "Tanggal Publikasi (YYYY-MM-DD)", key: "publication_date", width: 30 },
      { header: "DOI", key: "doi", width: 25 },
      { header: "URL", key: "url", width: 35 },
      { header: "Abstrak", key: "abstract", width: 50 },
    ];

    // Style header
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF006B35" } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin" }, left: { style: "thin" },
        bottom: { style: "thin" }, right: { style: "thin" }
      };
    });
    headerRow.height = 22;

    // Contoh data
    const exampleRow = sheet.addRow({
      title: "Contoh: Sistem Informasi Berbasis Web",
      publication_type: "Jurnal",
      publication_date: "2026-06-01",
      doi: "10.1234/contoh.001",
      url: "https://journal.unand.ac.id/contoh",
      abstract: "Abstrak penelitian di sini...",
    });
    exampleRow.eachCell((cell) => {
      cell.font = { italic: true, color: { argb: "FF888888" } };
      cell.border = {
        top: { style: "thin" }, left: { style: "thin" },
        bottom: { style: "thin" }, right: { style: "thin" }
      };
    });

    // Dropdown validasi jenis publikasi di kolom B
    sheet.getColumn('B').eachCell({ includeEmpty: true }, (cell, rowNumber) => {
      if (rowNumber > 1) {
        cell.dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: ['"Jurnal,Prosiding,Buku,Artikel Media Massa"'],
        };
      }
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=template-publikasi.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) { next(err); }
};

module.exports = { importPage, importExcel, downloadTemplate };