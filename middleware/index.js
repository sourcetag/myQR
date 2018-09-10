const isLoggedIn = function(req,res,next){
  if (req.isAuthenticated()) {
    return next();
  }
  /*req.flash("error", "You need to be logged in to do that");
  res.redirect("/users/login");*/
  res.status(500);
  res.render('index', {msg: 'You need to be logged in to do that'})
}

const validateCode = function(req,res,next){
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
}

module.exports = {isLoggedIn, validateCode};