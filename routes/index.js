var express = require("express");
var router = express.Router();
const indexController = require("../controllers/indexController");
const homeController = require('../controllers/homeController');
const { isAuthenticated } = require("../middlewares/auth");

router.get("/", indexController.index);

router.get("/home", isAuthenticated, homeController.index);

router.get("/login", indexController.loginPage);

router.post("/login", indexController.login);

router.get("/logout", indexController.logout);

module.exports = router;