// User routes definition
const express = require('express');
const {
    getAllUsers,
    getUser,
    updateUser,
    deleteUser,
    toggleAccountStatus,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // Protect all routes
router.use(authorize('admin')); // Restrict all routes to admin

router.get('/', getAllUsers);

router.route('/:id')
    .get(getUser)
    .put(updateUser)
    .delete(deleteUser);

router.patch('/:id/toggle-status', toggleAccountStatus);

module.exports = router;
