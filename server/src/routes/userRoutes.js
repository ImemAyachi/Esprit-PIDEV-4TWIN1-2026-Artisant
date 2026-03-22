const express = require('express');

const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/', userController.getAllUsers);
router.post('/bulk', userController.bulkUserAction);
router.get('/:id', userController.getUser);
router.get('/:id/activity', userController.getUserActivity);
router.post('/:id/elevate', userController.elevateUserPermissions);
router.post('/:id/impersonate', userController.impersonateUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.put('/:id/role', userController.updateUserRole);

module.exports = router;