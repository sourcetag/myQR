'use strict'
const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');
const {isLoggedIn, validateCode, isOwner} = require('../middleware');

//GET signup form
router.get('/register', (req, res) => {
  res.render('signup');
})

//POST newuser
router.post('/register', (req, res) => {
  const newUser = new User({
    username: req.body.username
  });
  User.register(newUser, req.body.password)
    .then(user => {
      passport.authenticate("local")(req, res, function(){
        req.flash('success', `Welcome to myQR: ${user.username}!`);
        res.redirect("/codes");
      });
    })
    .catch(err => {
      req.flash("error", err.message);
      return res.redirect('/users/register');
    });
});

//GET login form
router.get('/login', (req, res) => {
  res.render('login');
});

//POST login
router.post('/login', passport.authenticate("local",
{
  successRedirect: '/codes',
  failureRedirect: '/users/login',
  failureFlash: true
}), (req,res) => {});

//GET current user (testing)
router.get('/current', isLoggedIn, (req, res) => {
  const userID = req.user._id;
  res.json({userID});
})

//GET logout
router.get('/logout', (req, res) => {
    req.logout();
    req.flash("success", "Successfully logged out!");
    res.redirect("/users/login");
})

module.exports = router;