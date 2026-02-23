const express = require('express');
const {
    getAllUsers,
    getUser,
    updateUser,
    deleteUser,
    updateUserRole,
} = require('../controllers/userController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.route('/')
    .get(getAllUsers);

router.route('/:id')
    .get(getUser)
    .put(updateUser)
    .delete(deleteUser);

router.put('/:id/role', updateUserRole);

module.exports = router;