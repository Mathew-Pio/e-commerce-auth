const bcrypt = require('bcryptjs');
const User = require('../models/user');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

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
        errorMessage: message
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
        errorMessage: message
    });
};
  
exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    User.findOne({email: email})
    .then(user => {
        if(!user){
            req.flash('error', 'Invalid email or Password.');
            return res.redirect('/login');
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
            req.flash('error', 'Invalid email or Password.');
            res.redirect('/login');
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
    const confirmPassword = req.body.confirmPassword;

    User.findOne({email: email})
    .then(userDoc => {
        if(userDoc){
            req.flash('error', 'E-mail already exists, Please pick a different one.');
            return res.redirect('/signup');
        }
        return bcrypt
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