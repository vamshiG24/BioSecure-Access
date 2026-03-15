const express = require('express');
const { getUsers, deleteUser } = require('../controllers/userController');

const router = express.Router();

router.get('/users', getUsers);
router.post('/delete_user', deleteUser);

module.exports = router;
