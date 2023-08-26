const User = require('../models/user');

exports.getSignup = (req, res, next) => {
    res.render('auth/signup',{
        path: 'signup',
        pageTitle: 'Sign-Up',
        isAuthenticated: false
    });
}

exports.getLogin = (req, res, next) => {
    console.log(req.session.isLoggedIn);
    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        isAuthenticated: false
    });
};
  
exports.postLogin = (req, res, next) => {
    User.findById('64e3f8e17783cd2e2c9b2931')
    .then(user => {
      req.session.user = user;
      req.session.isLoggedIn = true;
      req.session.save((err) => {
        console.log(err);
        res.redirect('/');
      })
    })
    .catch(err => console.log(err));
};

exports.postSignup = (req, res, next) => {
    
};

exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        console.log(err);
        res.redirect('/');
    })
}