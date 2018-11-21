myQR [![Build Status](https://travis-ci.org/drewlara/myQR.svg?branch=master)](https://travis-ci.org/drewlara/myQR)
====

A simple, minimalistic QR code manager 
--------------------------------------

### [Live Link](https://myqr.herokuapp.com/) 
<strong>Demo The App</strong>
* Username: demouser
* Password: demopassword
--------------------------------------------

Summary
=======
myQR is a full-stack application that allows users to create, view, modify, and delete QR Codes. Users can create new QR codes with their own encoded text. Users have the ability to download and share these codes with current and non-users of the app. Users are also able to organize and search through all of their own codes. Users also have the option to upload an image of an existing QR Code (this feature currently supports small png/jpg images).

Screenshots
-----------
![alt text](public/assets/screenshots/landing.png)
![alt text](public/assets/screenshots/codes.png)
![alt text](public/assets/screenshots/codes-entries.png)
![alt text](public/assets/screenshots/newcode.png)
![alt text](public/assets/screenshots/codepage.png)
![alt text](public/assets/screenshots/codesearch.png)
![alt text](public/assets/screenshots/codefav.png)

# Technologies

## Frontend
  * HTML
  * CSS3
  * Javascript
  * jquery

## Backend
  * Node.js
  * Express.js
  * Passport
  * Mongoose
  * jsqr
  * qr-image
  * multer
  * jpeg-js
  * pngparse-sync

## Testing
  * Mocha
  * Chai
  * Faker
  * Cheerio
  * Travis CI

# Hosted on
  Heroku

# Future Features
 * Improved uploading/QR Recognition
 * Supporting more image types
