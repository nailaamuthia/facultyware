const express = require("express");
const router = express.Router();
const authorsController = require("../controllers/authorsController");
const { isAuthenticated } = require("../middlewares/auth");

// Web routes
router.get("/", isAuthenticated, authorsController.index);
router.get("/create", isAuthenticated, authorsController.create);
router.post("/store", isAuthenticated, authorsController.store);
router.get("/export/csv", isAuthenticated, authorsController.exportCSV);
router.get("/export/excel", isAuthenticated, authorsController.exportExcel);

router.get("/:id/edit", isAuthenticated, authorsController.edit);
router.post("/:id/update", isAuthenticated, authorsController.update);
router.post("/:id/delete", isAuthenticated, authorsController.destroy);
router.get("/:id", isAuthenticated, authorsController.show);

// API JSON endpoints
router.get("/json/all", authorsController.apiGetAll);
router.post("/json/create", authorsController.apiCreate);
router.get("/json/:id", authorsController.apiGetById);
router.put("/json/:id/update", authorsController.apiUpdate);
router.delete("/json/:id/delete", authorsController.apiDelete);

module.exports = router;
