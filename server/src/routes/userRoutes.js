const express = require('express');
const {
    getAllUsers,
    getUser,
    updateUser,
    deleteUser,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // Protect all routes
router.use(authorize('Admin')); // Restrict all routes to admin

router.route('/')
    .get(getAllUsers);

router.route('/:id')
    .get(getUser)
    .put(updateUser)
    .delete(deleteUser);

module.exports = router;
