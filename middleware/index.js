const Code = require('../models/code');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;


const isLoggedIn = function(req,res,next){
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash("error", "You need to be logged in to do that");
  res.redirect("/users/login");
}

const validateCode = function(req,res,next){
  if (req.isAuthenticated()){
    if (!('title' in req.body) || !('text' in req.body)) {
      req.flash("error", "Missing field");
      res.redirect("/codes/new");
    } else {
      if (req.body.title.length <= 1 || req.body.text.length <= 1) {
        req.flash("error", "Field too short");
        res.redirect("/codes/new");
      } else {
        next();
      }
    }
  } else {
    req.flash("error", "You need to be logged in to do that");
    res.redirect("/users/login");
  }
}

const isOwner = function(req,res,next){
  if (req.isAuthenticated()) {
    Code.findById(req.params.id)
      .then(code => {
        if (code.author.equals(req.user._id)){
          next();
        } else {
          req.flash("error", "Internal Server Error");
          res.redirect('/codes')
        }
      })
      .catch(err => {
        req.flash("error", "Internal Server Error");
        res.redirect('/codes')
      })
  } else {
    req.flash("error", "You need to be logged in to do that");
    res.redirect("/users/login");
  }
}

module.exports = {isLoggedIn, validateCode, isOwner};