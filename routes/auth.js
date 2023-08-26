const express = require('express');

const authController = require('../controllers/auth')

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup)

router.post('/login', authController.postLogin);

// POST => logout button for the website 
router.post('/logout', authController.postLogout);

module.exports = router;