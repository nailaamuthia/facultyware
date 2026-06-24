var express = require('express');
var router = express.Router();
const approvalController = require('../controllers/approvalController');
const { isAuthenticated } = require('../middlewares/auth');

router.get('/', isAuthenticated, approvalController.index);
router.get('/history', isAuthenticated, approvalController.history);
router.get('/api/list', isAuthenticated, approvalController.apiList);
router.get('/:id', isAuthenticated, approvalController.show);
router.post('/:id/action', isAuthenticated, approvalController.action);
router.get('/:id/download', isAuthenticated, approvalController.download);

module.exports = router;