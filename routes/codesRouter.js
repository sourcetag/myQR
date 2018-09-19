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
const {isLoggedIn, validateCode, isOwner} = require('../middleware');
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
  limits: {fileSize: 500000},
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
      res.redirect('/codes');
    })
});

router.get('/search', isLoggedIn, (req, res) => {
  const searchTerm = req.query.search;
  Code.find({title: {$regex: searchTerm, $options: 'i'}, author: req.user._id})
    .then(codes => {
      res.render('codes', {codes: codes});
    })
    .catch(err => {
      req.flash('error', 'Internal Server Error');
      res.redirect('/codes');
    })
});

router.get('/new', isLoggedIn, (req, res) => {
  res.render('new');
});

router.get('/upload', isLoggedIn, (req, res) => {
  res.render('upload');
});

router.get('/:id', isLoggedIn, (req, res) => {
  Code.findById(req.params.id)
    .then(code => {
      res.render('codePage', {code: code});
    })
    .catch(err => {
      req.flash('error', 'Internal Server Error');
      res.redirect('/codes');
    })
})

router.get('/:id/edit', isLoggedIn, (req, res) => {
  Code.findById(req.params.id)
    .then(code => {
      res.render('edit', {code: code});
    })
    .catch(err => {
      req.flash('error', 'Internal Server Error');
      res.redirect('/codes');
    })
});

router.get('/:id/share', (req, res) => {
  Code.findById(req.params.id)
    .then(code => {
      res.render('share', {code: code});
    })
    .catch(err => {
      req.flash('error', 'Internal Server Error');
      res.redirect('/codes');
    });
})

router.post('/', validateCode, (req, res) => {
  const pngStr = qr.imageSync(`${req.body.text}`, { type: 'png', size: 8 }).toString('base64');

  const newCode = {
    title: req.body.title,
    text: req.body.text,
    description: req.body.description,
    png: pngStr,
    favorite: false,
    created: Date.now(),
    author: req.user._id
  }

  Code.create(newCode)
    .then(code => {
      res.redirect('/codes');
    })
    .catch(err => {
      req.flash("error", "Internal Server Error");
      res.redirect('/codes/new');
    })
});

router.post('/upload', isLoggedIn, (req, res) => {
  upload(req, res, (err) => {
    if(err){
      req.flash('error', `${err}`);
      res.redirect('/codes/upload');
    } else {
      if (req.file){
        const imgData = processImgData(req.file);
        try {
          const code = jsQR(imgData.data, imgData.width, imgData.height);
          fs.unlinkSync(`./public/uploads/${req.file.filename}`);
          if(code){
            res.render('newFromUpload', {text: code.data, msg: 'Successfully read code'});
          } else {
            req.flash('error', 'Unable to read data from image');
            res.redirect('/codes/upload');
          }
        }
        catch(err) {
          req.flash('error', 'Unable to read data from image');
          res.redirect('/codes/upload');
        }
      } else {
        req.flash('error', 'Unable to upload file');
        res.redirect('/codes/upload');
      }
    }
  })
});

router.put('/:id', isOwner, (req, res) => {
  if(req.body.title && req.body.description){
    Code.findByIdAndUpdate(req.params.id, {$set: {title: req.body.title, description: req.body.description}})
    .then(code => {
      req.flash('success', `Successfully updated code`);
      res.redirect(`/codes/${req.params.id}`);
    })
    .catch(err => {
      req.flash('error', 'Internal Server Error');
      res.redirect(`/codes/${req.params.id}/edit`);
    });
  } else {
    req.flash('error', 'Field left blank')
    res.redirect(`/codes/${req.params.id}/edit`);
  }
});

router.put('/:id/favorite', isOwner, (req, res) => {
  Code.findById(req.params.id)
    .then(code => {
      if(code.favorite === false) {
        Code.findByIdAndUpdate(code._id, {$set: {favorite: true}}, {new: true})
          .then(code => {
            res.render('codePage', {code: code});
          })
          .catch(err => {
            req.flash('error', 'Internal Server Error');
            res.redirect('/codes');
          })
      } else {
        Code.findByIdAndUpdate(code._id, {$set: {favorite: false}}, {new: true})
          .then(code => {
            res.render('codePage', {code: code});
          })
          .catch(err => {
            req.flash('error', 'Internal Server Error');
            res.redirect('/codes');
          })
      }
    })
    .catch(err => {
      req.flash('error', 'Internal Server Error');
      res.redirect('/codes');
    })
})

router.delete('/:id', isOwner, (req, res) => {
  Code.findByIdAndRemove(req.params.id)
    .then(code => {
      req.flash('success', 'Code was successfully deleted');
      res.redirect('/codes');
    })
    .catch(err => {
      req.flash('error', 'Internal Server Error');
      res.redirect('/codes');
    })
});

module.exports = router;