const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const publikasiController = require("../controllers/publikasiController");
const exportController = require("../controllers/exportController");
const importController = require("../controllers/importController");
const { isAuthenticated } = require("../middlewares/auth");

// Multer config
const upload = multer({
  dest: "uploads/",
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== ".xlsx") return cb(new Error("Hanya file .xlsx yang diizinkan"));
    cb(null, true);
  },
});

router.get("/", isAuthenticated, publikasiController.index);
router.get("/export/pdf", isAuthenticated, exportController.exportPDF);
router.get("/create", isAuthenticated, publikasiController.create);
router.post("/store", isAuthenticated, publikasiController.store);
router.get("/import", isAuthenticated, importController.importPage);
router.get("/import/template", isAuthenticated, importController.downloadTemplate);
router.post("/import", isAuthenticated, upload.single("file"), importController.importExcel);

// API JSON
router.get("/json", publikasiController.apiGetAll);
router.get("/json/:id", publikasiController.apiGetById);

router.get("/:id/edit", isAuthenticated, publikasiController.edit);
router.post("/:id/update", isAuthenticated, publikasiController.update);
router.get("/:id/export/pdf", isAuthenticated, exportController.exportSinglePDF);
router.post("/:id/delete", isAuthenticated, publikasiController.destroy);
router.get("/:id", isAuthenticated, publikasiController.show);

module.exports = router;