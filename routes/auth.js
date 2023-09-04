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
    .withMessage('Please enter valid email')
    .custom((value, { req }) => {
        // if(value === 'test@test.com'){
        //     throw new Error('This email address is forbidden');
        // }
        // return true;
        return User.findOne({email: value})
        .then(userDoc => {
            if(userDoc){
                return Promise.reject('E-mail already exists, Please pick a different one.');
            }
        })
    }) ,
    check(
            'password',
            'Please enter a password with only numbers and letters and at least 5 characters'
        )
        .isLength({min:5})
        .isAlphanumeric(),
    check('confirmPassword').custom((value, { req }) => {
        if(value !== req.body.password){
            throw new Error('Passwords have to match!!');
        }
        return true;
    })
],
 authController.postSignup
 );

router.post('/login', 
 [
    check('email')
    .isEmail()
    .withMessage('Please enter a valid email'),
    check('password', 'Password has to be Valid')
    .isLength({min:5})
    .isAlphanumeric()
 ],
 authController.postLogin
 );

// POST => logout button for the website 
router.post('/logout', authController.postLogout);

module.exports = router;