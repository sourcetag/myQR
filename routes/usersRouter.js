'use strict'
const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');

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

//GET logout
router.get('/logout', (req, res) => {
    req.logout();
    req.flash("success", "Succesfully logged out!");
    res.redirect("/users/login");
})

module.exports = router;