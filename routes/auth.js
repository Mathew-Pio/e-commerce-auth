const express = require('express');
const { check } = require('express-validator');

const authController = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.get('/reset', authController.getReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

router.post('/reset', authController.postReset);

router.post(
    '/signup',
    [ 
      check('email')
        .isEmail()
        .withMessage('Please enter a valid email')
        .custom((value, { req }) => {
          return User.findOne({ email: value })
            .then(userDoc => {
              if (userDoc) {
                return Promise.reject('E-mail already exists. Please pick a different one.');
              }
            });
        })
        .normalizeEmail(),
      check('password')
        .trim()
        .isLength({ min: 5 })
        .withMessage('Password must be at least 5 characters long')
        .isAlphanumeric()
        .withMessage('Password must only contain numbers and letters'),
      check('confirmPassword')
        .trim()
        .custom((value, { req }) => {
          if (value !== req.body.password) {
            throw new Error('Passwords must match');
          }
          return true;
        }),
    ],
    authController.postSignup
);
  
router.post('/login', 
 [
    check('email')
        .isEmail()
        .withMessage('Please enter a valid email')
        .normalizeEmail(),
    check('password', 'Password has to be Valid')
        .trim()
        .isLength({min:5})
        .isAlphanumeric(),
 ],
 authController.postLogin
 );

// POST => logout button for the website 
router.post('/logout', authController.postLogout);

module.exports = router;