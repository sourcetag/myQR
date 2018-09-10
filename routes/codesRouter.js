const express = require('express');
const mongoose = require('mongoose');
const qr = require('qr-image');
const multer = require('multer');
const path = require('path');
const util = require('util');
const fs = require('fs');
const jpeg = require('jpeg-js');
const png = require('pngparse-sync');
const jsQR = require('jsqr');
const router = express.Router();
const {isLoggedIn, validateCode} = require('../middleware');
const Code = require('../models/code');
mongoose.Promise = global.Promise;

const storage = multer.diskStorage({
  destination: './public/uploads',
  filename: function(req, file, cb){
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {filesize: 500000},
  fileFilter: function(req, file, cb){
    checkFileType(file, cb);
  }
}).single('upload');

function checkFileType(file, cb){
  const fileTypes = /jpeg|jpg|png/;
  const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeType = fileTypes.test(file.mimetype);
  if (mimeType && extName) {
    return cb(null, true);
  } else {
    cb('Error: Images Only');
  }
}

function processImgData(file){
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') {
    const jpegData = fs.readFileSync(`./public/uploads/${file.filename}`);
    const rawJpegData = jpeg.decode(jpegData, true);
    return rawJpegData;
  } else {
    const pngData = fs.readFileSync(`./public/uploads/${file.filename}`);
    const rawPngData = png(pngData);
    return rawPngData;
  }
}

router.get('/', isLoggedIn, (req, res) => {
  Code.find({author: `${req.user._id}`})
    .then(codes => {
      res.render('codes', {codes: codes})
    })
    .catch(err => {
      req.flash('error', 'Internal Server Error');
      res.status(500);
    })
});

router.get('/new', isLoggedIn, (req, res) => {
  res.render('new');
});

router.get('/upload', isLoggedIn, (req, res) => {
  res.render('upload');
});

router.post('/', isLoggedIn, (req, res) => {
  const svgStr = qr.imageSync(`${req.body.text}`, { type: 'svg', size: 5 });

  const newCode = {
    title: req.body.title,
    text: req.body.text,
    svg: svgStr,
    favorite: req.body.fav || false,
    created: Date.now(),
    author: req.user._id
  }

  Code.create(newCode)
    .then(code => {
      res.redirect('/codes');
    })
    .catch(err => {
      req.flash("error", "Internal Server Error");
      res.redirect('/codes');
    })
});

router.post('/upload', (req, res) => {
  upload(req, res, (err) => {
    if(err){
      req.flash('error', `${err}`);
      res.redirect('/upload');
    } else {
      console.log('Got File:',req.file.filename);
      const imgData = processImgData(req.file);
      const code = jsQR(imgData.data, imgData.width, imgData.height);
      fs.unlinkSync(`./public/uploads/${req.file.filename}`);
      if(code){
        res.render('newFromUpload', {text: code.data, msg: 'Succesfully read code'});
      } else {
        req.flash('error', 'Unable to read data from image');
        res.redirect('/codes/upload');
      }
    }
  })
});

module.exports = router;