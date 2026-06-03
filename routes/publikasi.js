const express = require("express");
const router = express.Router();
const publikasiController = require("../controllers/publikasiController");

router.get("/", publikasiController.index);
router.get("/create", publikasiController.create);
router.post("/store", publikasiController.store);

module.exports = router;