const db = require("../lib/db");
const PDFDocument = require("pdfkit");
const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, ShadingType } = require("docx");

// Export semua publikasi ke PDF
const exportPDF = async (req, res, next) => {
  try {
    const [publikasi] = await db.query(`SELECT * FROM publications ORDER BY id DESC`);

    const FTI_NAVY = "#3d4658";
    const FTI_BLUE = "#6d7898";
    const FTI_GREEN = "#008B4B";
    const TYPE_COLORS = {
      jurnal: { bg: "#e9ebf0", text: "#3d4658" },
      prosiding: { bg: "#eef0f3", text: "#4a5568" },
      buku: { bg: "#f3ece0", text: "#92622f" },
    };

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=daftar-publikasi.pdf");
    doc.pipe(res);

    // Header dengan aksen warna FTI
    doc.rect(50, doc.y, 495, 4).fill(FTI_GREEN);
    doc.moveDown(0.7);
    doc.fontSize(18).font("Helvetica-Bold").fillColor(FTI_NAVY).text("Daftar Publikasi Dosen", { align: "center" });
    doc.fontSize(11).font("Helvetica").fillColor(FTI_BLUE).text("Fakultas Teknologi Informasi - Universitas Andalas", { align: "center" });
    doc.fontSize(10).font("Helvetica").fillColor("#777").text("Sistem Publikasi Dosen FTI — Kelompok B14", { align: "center" });
    doc.moveDown(0.6);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(FTI_BLUE).lineWidth(1).stroke();
    doc.strokeColor("#000").lineWidth(1);
    doc.moveDown(1);

    if (publikasi.length === 0) {
      doc.fontSize(11).fillColor("#000").text("Belum ada data publikasi.", { align: "center" });
    } else {
      publikasi.forEach((item, index) => {
        doc.fontSize(12).font("Helvetica-Bold").fillColor("#000").text(`${index + 1}. ${item.title || '-'}`);

        // Badge jenis publikasi berwarna
        const jenisKey = (item.publication_type || '').toLowerCase();
        const jenisLabel = item.publication_type || null;
        if (jenisLabel) {
          const color = TYPE_COLORS[jenisKey] || { bg: "#eceef2", text: "#4a5568" };
          const badgeY = doc.y + 2;
          const badgeWidth = doc.widthOfString(jenisLabel, { font: "Helvetica-Bold", fontSize: 8 }) + 14;
          doc.roundedRect(50, badgeY, badgeWidth, 14, 7).fill(color.bg);
          doc.fontSize(8).font("Helvetica-Bold").fillColor(color.text).text(jenisLabel, 57, badgeY + 3.5);
          doc.fillColor("#000");
          doc.moveDown(0.6);
        }

        doc.fontSize(10).font("Helvetica").fillColor("#555")
          .text(`Tanggal: ${item.publication_date ? new Date(item.publication_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}`);
        if (item.doi) doc.text(`DOI: ${item.doi}`);
        if (item.url) doc.text(`URL: ${item.url}`);
        if (item.abstract) {
          doc.moveDown(0.3);
          doc.fontSize(10).fillColor("#333").text(`Abstrak: ${item.abstract}`, { width: 495 });
        }
        doc.fillColor("#000").moveDown(1);
        if (index < publikasi.length - 1) {
          doc.moveTo(50, doc.y).lineTo(545, doc.y).dash(3, { space: 3 }).strokeColor(FTI_BLUE).stroke().undash();
          doc.strokeColor("#000");
          doc.moveDown(0.5);
        }
      });
    }

    doc.fontSize(9).fillColor("#999").text(
      `Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`,
      { align: "right" }
    );
    doc.end();
  } catch (err) { next(err); }
};

// Export satu publikasi ke PDF
const exportSinglePDF = async (req, res, next) => {
  try {
    const [rows] = await db.query(`SELECT * FROM publications WHERE id = ?`, [req.params.id]);
    if (rows.length === 0) return res.status(404).send("Publikasi tidak ditemukan");

    const item = rows[0];

    const FTI_NAVY = "#3d4658";
    const FTI_BLUE = "#6d7898";
    const FTI_GREEN = "#008B4B";
    const TYPE_COLORS = {
      jurnal: { bg: "#e9ebf0", text: "#3d4658" },
      prosiding: { bg: "#eef0f3", text: "#4a5568" },
      buku: { bg: "#f3ece0", text: "#92622f" },
    };

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=publikasi-${item.id}.pdf`);
    doc.pipe(res);

    // Header dengan aksen warna FTI
    doc.rect(50, doc.y, 495, 4).fill(FTI_GREEN);
    doc.moveDown(0.7);
    doc.fontSize(18).font("Helvetica-Bold").fillColor(FTI_NAVY).text("Detail Publikasi", { align: "center" });
    doc.fontSize(11).font("Helvetica").fillColor(FTI_BLUE).text("Fakultas Teknologi Informasi - Universitas Andalas", { align: "center" });
    doc.fontSize(10).font("Helvetica").fillColor("#777").text("Sistem Publikasi Dosen FTI — Kelompok B14", { align: "center" });
    doc.moveDown(0.6);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(FTI_BLUE).lineWidth(1).stroke();
    doc.strokeColor("#000").lineWidth(1);
    doc.moveDown(1);

    // Judul publikasi
    doc.fontSize(14).font("Helvetica-Bold").fillColor("#000").text(item.title || '-');

    // Badge jenis publikasi berwarna
    const jenisKey = (item.publication_type || '').toLowerCase();
    const jenisLabel = item.publication_type || null;
    if (jenisLabel) {
      const badgeY = doc.y + 4;
      const badgeWidth = doc.widthOfString(jenisLabel, { font: "Helvetica-Bold", fontSize: 9 }) + 16;
      const color = TYPE_COLORS[jenisKey] || { bg: "#eceef2", text: "#4a5568" };
      doc.roundedRect(50, badgeY, badgeWidth, 16, 8).fill(color.bg);
      doc.fontSize(9).font("Helvetica-Bold").fillColor(color.text).text(jenisLabel, 58, badgeY + 4);
      doc.fillColor("#000");
      doc.y = badgeY + 24;
    }
    doc.moveDown(0.8);

    const fields = [
      ["Tanggal Publikasi", item.publication_date ? new Date(item.publication_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'],
      ["DOI", item.doi || '-'],
      ["URL", item.url || '-'],
      ["Abstrak", item.abstract || '-'],
    ];

    fields.forEach(([label, value]) => {
      doc.fontSize(9).font("Helvetica-Bold").fillColor(FTI_BLUE).text(label.toUpperCase());
      doc.fontSize(11).font("Helvetica").fillColor("#222").text(value, { width: 495 });
      doc.moveDown(0.8);
    });

    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#e2e5eb").lineWidth(1).stroke();
    doc.strokeColor("#000");
    doc.moveDown(0.5);
    doc.fontSize(9).fillColor("#999").text(
      `Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`,
      { align: "right" }
    );
    doc.end();
  } catch (err) { next(err); }
};

// Export semua publikasi ke DOCX
const exportDOCX = async (req, res, next) => {
  try {
    const [publikasi] = await db.query(`SELECT * FROM publications ORDER BY id DESC`);

    const rows = publikasi.map((item, index) => new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(index + 1), size: 20 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.title || '-', size: 20, bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.publication_date ? new Date(item.publication_date).toLocaleDateString('id-ID') : '-', size: 20 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.doi || '-', size: 20 })] })] }),
      ],
    }));

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ children: [new TextRun({ text: "Daftar Publikasi Dosen", bold: true, size: 32, color: "3d4658" })], heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ children: [new TextRun({ text: "Sistem Publikasi Dosen FTI — Kelompok B14", size: 22, color: "6d7898" })], heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: "" }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                tableHeader: true,
                children: [
                  new TableCell({ shading: { type: ShadingType.SOLID, color: "008B4B", fill: "008B4B" }, children: [new Paragraph({ children: [new TextRun({ text: "No", bold: true, size: 20, color: "FFFFFF" })] })] }),
                  new TableCell({ shading: { type: ShadingType.SOLID, color: "008B4B", fill: "008B4B" }, children: [new Paragraph({ children: [new TextRun({ text: "Judul Publikasi", bold: true, size: 20, color: "FFFFFF" })] })] }),
                  new TableCell({ shading: { type: ShadingType.SOLID, color: "008B4B", fill: "008B4B" }, children: [new Paragraph({ children: [new TextRun({ text: "Tanggal", bold: true, size: 20, color: "FFFFFF" })] })] }),
                  new TableCell({ shading: { type: ShadingType.SOLID, color: "008B4B", fill: "008B4B" }, children: [new Paragraph({ children: [new TextRun({ text: "DOI", bold: true, size: 20, color: "FFFFFF" })] })] }),
                ],
              }),
              ...rows,
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({ children: [new TextRun({ text: `Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`, size: 18, color: "888888" })] }),
        ],
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", "attachment; filename=daftar-publikasi.docx");
    res.send(buffer);
  } catch (err) { next(err); }
};

// Export semua publikasi ke Excel
const exportExcel = async (req, res, next) => {
  try {
    const ExcelJS = require("exceljs");
    const [publikasi] = await db.query(`SELECT * FROM publications ORDER BY id DESC`);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Daftar Publikasi");

    sheet.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "Judul Publikasi", key: "title", width: 40 },
      { header: "Tanggal Publikasi", key: "publication_date", width: 20 },
      { header: "DOI", key: "doi", width: 25 },
      { header: "URL", key: "url", width: 35 },
      { header: "Abstrak", key: "abstract", width: 50 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF008B4B" } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin" }, left: { style: "thin" },
        bottom: { style: "thin" }, right: { style: "thin" }
      };
    });
    headerRow.height = 20;

    publikasi.forEach((item, index) => {
      const row = sheet.addRow({
        no: index + 1,
        title: item.title || "-",
        publication_date: item.publication_date
          ? new Date(item.publication_date).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })
          : "-",
        doi: item.doi || "-",
        url: item.url || "-",
        abstract: item.abstract || "-",
      });
      row.eachCell((cell) => {
        cell.alignment = { vertical: "top", wrapText: true };
        cell.border = {
          top: { style: "thin" }, left: { style: "thin" },
          bottom: { style: "thin" }, right: { style: "thin" }
        };
      });
      if (index % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F7F3" } };
        });
      }
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=daftar-publikasi.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) { next(err); }
};

module.exports = { exportPDF, exportSinglePDF, exportDOCX, exportExcel };