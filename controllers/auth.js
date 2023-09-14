const bcrypt = require('bcryptjs');
const User = require('../models/user');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { validationResult } = require('express-validator');

exports.getSignup = (req, res, next) => {
    let message = req.flash('error');
    if(message.length > 0){
        message = message[0];
    }else{
        message = null;
    }
    res.render('auth/signup',{
        path: '/signup',
        pageTitle: 'Sign-Up',
        isAuthenticated: false,
        errorMessage: message,
        oldInput: {
            email:'',
            password:'',
            confirmPassword:''
        },
        validationErrors: []
    });
}

exports.getLogin = (req, res, next) => {
    let message = req.flash('error');
    if(message.length > 0){
        message = message[0];
    }else{
        message = null;
    }
    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        isAuthenticated: false,
        errorMessage: message,
        oldInput: {
            email: '',
            password: ''
        },
        validationErrors: []
    });
};
  
exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        console.log(errors.array());
        return res.status(422).render('auth/login',{
            path: '/login',
            pageTitle: 'Login',
            isAuthenticated: false,
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email: email,
                password: password
            },
            validationErrors: errors.array()
        });
    }
    User.findOne({email: email})
    .then(user => {
        if(!user){
            return res.status(422).render('auth/login',{
                path: '/login',
                pageTitle: 'Login',
                isAuthenticated: false,
                errorMessage: 'Invalid email or password',
                oldInput: {
                    email: email,
                    password: password
                },
                validationErrors: []
            });
        }
        bcrypt.compare(password, user.password)
        .then(doMatch => {
            if(doMatch){
                req.session.user = user;
                req.session.isLoggedIn = true;
                return req.session.save(err => {
                console.log(err);
                res.redirect('/');
                });
            } 
            return res.status(422).render('auth/login',{
                path: '/login',
                pageTitle: 'Login',
                isAuthenticated: false,
                errorMessage: 'Invalid email or password',
                oldInput: {
                    email: email,
                    password: password
                },
                validationErrors: []
            });
        })
        .catch(err => {
            console.log(err);
            res.redirect('/login')
        })
    })
    .catch(err => console.log(err));
};

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        console.log(errors.array());
        return res.status(422).render('auth/signup',{
            path: '/signup',
            pageTitle: 'Sign-Up',
            isAuthenticated: false,
            errorMessage: errors.array()[0].msg,
            oldInput: {email: email, password: password, confirmPassword: req.body.confirmPassword},
            validationErrors: errors.array()
        });
    }
        bcrypt
        .hash(password, 12)
        .then(hashedPassword => {
            const user = new User({
                email: email,
                password: hashedPassword,
                cart: { items: [] }
            })
            return user.save();
        })
        .then(result => {
            let transporter = nodemailer.createTransport({
                service:'Gmail',
                auth:{
                    user: 'pionarco@gmail.com',
                    pass: 'eaxsrxhgxhavwkzp'
                }
            })

            let message = {
                from: 'pionarco@gmail.com', // sender address
                to: email,
                subject: "Hi Okononfua ✔", // Subject line
                text: "Successfully signed up!!", // plain text body
            };

            transporter.sendMail(message, function(error, info){
                if(error){
                    console.log(error)
                }else{
                    console.log('Email sent' + info.response); 
                }
            });
            return res.redirect('/login');
        })
    .catch(err => console.log(err));
};

exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        console.log(err);
        res.redirect('/');
    })
}

exports.getReset = (req, res, next) => {
    let message = req.flash('error');
    if(message.length > 0){
        message = message[0];
    }else{
        message = null;
    }
    res.render('auth/reset',{
        path: '/reset',
        pageTitle: 'Reset Password',
        isAuthenticated: false,
        errorMessage: message
    });
}

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if(err){
            console.log(err);
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        User.findOne({email: req.body.email})
        .then(user => {
            if(!user){
                req.flash('error', 'No account with that email found');
                return res.redirect('/reset');
            }
            user.resetToken = token;
            user.resetTokenExpiration = Date.now() + 3600000;
            return user.save();
        })
        .then(() => {
            let transporter = nodemailer.createTransport({
                service:'Gmail',
                auth:{
                    user: 'pionarco@gmail.com',
                    pass: 'eaxsrxhgxhavwkzp'
                }
            })

            let message = {
                from: 'pionarco@gmail.com', // sender address
                to: req.body.email,
                subject: "Password Reset ✔", // Subject line
                html: `
                    <p>You requested a password reset</p>
                    <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password</p>
                `
            };

            transporter.sendMail(message, function(error, info){
                if(error){
                    console.log(error)
                }else{
                    console.log('Email sent' + info.response); 
                }
            });
        })
        .then(result => {
            return res.redirect('/');
        })
        .catch(err => {
            console.log(err);
        })
    });
};

exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    User.findOne({resetToken: token, resetTokenExpiration:{$gt:Date.now()}})
    .then(user => {
        let message = req.flash('error');
        if(message.length > 0){
            message = message[0];
        }else{
            message = null;
        } 
        res.render('auth/new-password',{
            path: '/new-password',
            pageTitle: 'New Password',
            isAuthenticated: false,
            errorMessage: message,
            userId: user._id.toString(),
            passwordToken: token
        });   
    })
    .catch(err => {
        console.log(err);
    });
}

exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    let resetUser;

    User.findOne({resetToken: passwordToken, resetTokenExpiration:{$gt: Date.now()},
     _id:userId})
     .then(user => {
        resetUser = user;
        return bcrypt.hash(newPassword, 12);
     })
     .then(hashedPassword => {
        resetUser.password = hashedPassword;
        resetUser.resetToken = undefined;
        resetUser.resetTokenExpiration = undefined;
        return resetUser.save();
     })
     .then(result => {
        return res.redirect('/login');
     })
     .catch(err => {
        console.log(err);
    });
};








