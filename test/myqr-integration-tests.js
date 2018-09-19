"use strict"

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const qr = require('qr-image');
const faker = require('faker');
const cheerio = require('cheerio');
const fs = require('fs');

const expect = chai.expect;

const Code = require('../models/code');
const User = require('../models/user');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

var agent;
var userID;
var $;

function seedCodeData(){
  let seedData = [];

  for(let i = 1; i <= 5; i++){
    seedData.push(generateCodeData());
  }

  return Code.insertMany(seedData);
}

function generateCodeData(){
  const testCodeData = faker.lorem.sentence(4);
  const testPngStr = qr.imageSync(`${testCodeData}`, { type: 'png', size: 8 }).toString('base64');
  return {
    title: faker.lorem.sentence(2),
    text: testCodeData,
    description: faker.lorem.paragraph(2),
    png: testPngStr,
    favorite: false,
    created: Date.now(),
    author: userID
  }
}

function tearDownDb() {
  console.warn('Deleting database');
  return mongoose.connection.dropDatabase();
}

describe('myQR API resource', function() {
  before(function(){
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function(){
    agent = chai.request.agent(app);
  })

  beforeEach(function(){
    return agent.post('/users/register')
      .type('form')
      .send({
        username: 'testuser',
        password: 'password'
      })
      .then(function(res){
        return agent.get('/users/current')
          .then(function(res){
            userID = res.body.userID;
          })
      })
  })

  beforeEach(function(){
    return seedCodeData();
  });

  afterEach(function(){
    return agent.close();
  })

  afterEach(function(){
    return tearDownDb();
  });

  after(function(){
    return closeServer();
  });

  describe('GET codes endpoints', function(){
    it('should return all existing codes', function(){
      return agent.get('/codes')
        .then(function(res){
          $ = cheerio.load(res.text);
          expect(res).to.have.status(200);
          expect($('.code-grid').children().length).to.be.at.least(1);
          return Code.count({author: userID});
        })
        .then(function(count){
          expect($('.code-grid').children().length).to.equal(count); //Making sure codes display on page == codes that belong to the user in the database
        })
    });

    it('should return all existing codes with correct fields', function(){
      let codeID;
      let codeTitle;
      let codePng;
      let codeFav;
      return agent.get('/codes')
        .then(function(res){
          $ = cheerio.load(res.text);
          expect(res).to.have.status(200);
          expect($('.code-grid').find('img').length).to.be.at.least(1);
          expect($('.code-grid').find('.code-thumbnail-title').length).to.be.at.least(1);
          expect($('.code-grid').find('.view-code').length).to.be.at.least(1);
          expect($('.code-grid').find('.code-thumbnail').attr('data-fav')).to.equal('false');

          let codeThumbnail = $('.code-thumbnail').toArray()[0]; //Selecting One Code from page
          codeID = codeThumbnail.children[5].children[1].attribs.href.split('/')[2]; //Getting the code ID
          codeTitle = codeThumbnail.children[3].children[1].children[0].data; //Getting the code Title
          codePng = codeThumbnail.children[1].attribs.src.split(' ')[1]; //Getting the base64 img string
          codeFav = codeThumbnail.attribs['data-fav'] //Getting data-fav attribute value
          return Code.findById(codeID)
        })
        .then(function(code){
          expect(codeID).to.equal(code._id.toString()); //Making sure code ID from page == code ID from database
          expect(codeTitle).to.equal(code.title); //Making sure code Title from page == code Title from database
          expect(codePng).to.equal(code.png); //Making sure code base64 img string from page == code base64 img string from database
          expect(userID).to.equal(code.author.toString()); //Making sure userID from current user == code author from database
          expect(codeFav).to.equal(code.favorite.toString()); //Making sure codeFav == value from database
        })
    });

    it('should render new code form', function(){
      return agent.get('/codes/new')
        .then(function(res){
          $ = cheerio.load(res.text);
          expect($('.new-form').find('form').length).to.be.at.least(1)
        })
    });

    it('should render upload code form', function(){
      return agent.get('/codes/upload')
        .then(function(res){
          $ = cheerio.load(res.text);
          expect($('.upload-form-container').find('form').length).to.be.at.least(1)
        })
    });

    it('should search for, find, and render code based on code title query', function(){
      let searchTerm;
      return agent.get('/codes')
        .then(function(res){
          $ = cheerio.load(res.text);
          let codeThumbnail = $('.code-thumbnail').toArray()[0]; //Selecting One Code from page
          searchTerm = codeThumbnail.children[3].children[1].children[0].data; //Getting the searchTerm (the code Title)

          return agent.get('/codes/search').type('form').query({search: searchTerm})
        })
        .then(function(res){
          $ = cheerio.load(res.text);
          expect(res).to.have.status(200);
          expect($('.code-thumbnail-title').text()).to.equal(searchTerm); //Making sure the found code title == the searchTerm
        })
    });

    it('should render edit form for a single code', function(){
      let codeID;
      return agent.get('/codes')
        .then(function(res){
          $ = cheerio.load(res.text);
          let codeThumbnail = $('.code-thumbnail').toArray()[0]; //Selecting One Code from page
          codeID = codeThumbnail.children[5].children[1].attribs.href.split('/')[2]; //Getting the code ID

          return agent.get(`/codes/${codeID}/edit`)
        })
        .then(function(res){
          expect(res).to.have.status(200);
          $ = cheerio.load(res.text);
          expect($('.code-edit-form').find('form').length).to.be.at.least(1)
        })
    });

    it('should render a code page for a single code with the correct fields', function(){
      let codeID;
      let codeTitle;
      let codePng;
      let codeText;
      let codeDesc;
      let codeCreated;
      return agent.get('/codes')
        .then(function(res){
          $ = cheerio.load(res.text);
          let codeThumbnail = $('.code-thumbnail').toArray()[0]; //Selecting One Code from page
          codeID = codeThumbnail.children[5].children[1].attribs.href.split('/')[2]; //Getting the code ID

          return agent.get(`/codes/${codeID}`)
        })
        .then(function(res){
          expect(res).to.have.status(200);
          $ = cheerio.load(res.text);
          codeTitle = $('.code-title').text();
          codePng = $('img').attr('src').split(' ')[1];
          codeText = $('.code-data').text();
          codeDesc = $('.code-description').text();
          codeCreated = $('.code-created').text();

          /* Making sure the expected fields are rendered */
          expect(codeTitle.length).to.be.at.least(1);
          expect(codePng.length).to.be.at.least(1);
          expect(codeText.length).to.be.at.least(1);
          expect(codeDesc.length).to.be.at.least(1);
          expect(codeCreated.length).to.be.at.least(1);

          return Code.findById(codeID)
        })
        .then(function(code){
          /* Making sure the expected fields have the correct values */
          expect(codeID).to.equal(code._id.toString());
          expect(userID).to.equal(code.author.toString());
          expect(codeTitle).to.equal(code.title);
          expect(codePng).to.equal(code.png);
          expect(codeText).to.equal(code.text);
          expect(codeDesc).to.equal(code.description);
          expect(codeCreated).to.equal(code.created.toString());
        })
    });

    it('should render a shareable code page for a single code with the correct fields', function(){
      let codeID;
      let codeTitle;
      let codePng;
      let codeText;
      let codeDesc;
      return agent.get('/codes')
        .then(function(res){
          $ = cheerio.load(res.text);
          let codeThumbnail = $('.code-thumbnail').toArray()[0]; //Selecting One Code from page
          codeID = codeThumbnail.children[5].children[1].attribs.href.split('/')[2]; //Getting the code ID

          return chai.request(app).get(`/codes/${codeID}/share`) //Share page should be accessible without auth
        })
        .then(function(res){
          $ = cheerio.load(res.text);
          codeTitle = $('.code-title').text();
          codePng = $('img').attr('src').split(' ')[1];
          codeText = $('.code-data').text();
          codeDesc = $('.code-description').text();

          /* Making sure the expected fields are rendered */
          expect(codeTitle.length).to.be.at.least(1);
          expect(codePng.length).to.be.at.least(1);
          expect(codeText.length).to.be.at.least(1);
          expect(codeDesc.length).to.be.at.least(1);

          return Code.findById(codeID)
        })
        .then(function(code){
          /* Making sure the expected fields have the correct values */
          expect(codeID).to.equal(code._id.toString());
          expect(codeTitle).to.equal(code.title);
          expect(codePng).to.equal(code.png);
          expect(codeText).to.equal(code.text);
          expect(codeDesc).to.equal(code.description);
        })
    });
  });

  describe('POST codes endpoints', function(){
    it('should create and add a new code to the database', function(){
      let codeID;
      const newCode = generateCodeData();
      return agent.post('/codes').type('form').send({
        title: newCode.title,
        text: newCode.text,
        description: newCode.description
      })
        .then(function(res){
          expect(res).to.have.status(200);
          expect(res.redirects[0].split('/')[3]).to.equal('codes') //A successful post request redirects to /codes
          $ = cheerio.load(res.text);
          expect($('.code-grid').children().last().find('.code-thumbnail-title').text()).to.equal(newCode.title) //New code title should be equal to the code title on the last displayed code on /codes

          codeID = $('.code-grid').children().last().find('.view-code').attr('href').split('/')[2]; //Getting the codeID from newCode
          return Code.findById(codeID);
        })
        .then(function(code){
          /* Making sure the newCode is equal to the created code in the database */
          expect(codeID).to.equal(code._id.toString());
          expect(userID).to.equal(code.author.toString());
          expect(newCode.title).to.equal(code.title);
          expect(newCode.text).to.equal(code.text);
          expect(newCode.description).to.equal(code.description);
        })
    });

    it('should read in data from a QRCode png image uploaded by the user', function(){
      return agent.post('/codes/upload')
        .attach('upload', fs.readFileSync(__dirname + '/testcode.png'), 'testcode.png')
        .set('Contet-Type', 'image/png')
        .then(function(res){
          expect(res).to.have.status(200);
          $ = cheerio.load(res.text);
          expect($('.alert-message').text()).to.equal('Successfully read code'); //Making sure success message is rendered
          expect($('textarea').text()).to.equal('This is a test code'); //Making sure expected code data is read and rendered
          /* Since nothing is added to the database, there are no database tests here */
        })
    });
  });

  describe('PUT codes endpoints', function(){
    it('should update fields that are sent over', function(){
      let codeID;
      let newCode = generateCodeData();
      return agent.get('/codes')
        .then(function(res){
          $ = cheerio.load(res.text);
          let codeThumbnail = $('.code-thumbnail').toArray()[0]; //Selecting One Code from page
          codeID = codeThumbnail.children[5].children[1].attribs.href.split('/')[2]; //Getting the code ID

          return agent.put(`/codes/${codeID}`).type('form').send({
            title: newCode.title,
            description: newCode.description
          })
        })
        .then(function(res){
          expect(res).to.have.status(200);
          $ = cheerio.load(res.text);
          expect($('.alert-message').text()).to.equal('Successfully updated code'); //Making sure success message is rendered
          expect($('.code-title').text()).to.equal(newCode.title); //Making sure edited title renders on page
          expect($('.code-description').text()).to.equal(newCode.description); //Making sure edited description renders on page
          expect($('.code-edit').attr('href').split('/')[2]).to.equal(codeID); //Making sure rendered codeID matches selected codeID

          return Code.findById(codeID)
        })
        .then(function(code){
          /* Making sure edited code is equal to edited code in database */
          expect($('.code-title').text()).to.equal(code.title);
          expect($('.code-description').text()).to.equal(code.description);
        })
    });

    it('should update code favorite field when a code is favorited/unfavorited', function(){
      let codeID;
      return agent.get('/codes')
        .then(function(res){
          $ = cheerio.load(res.text);
          let codeThumbnail = $('.code-thumbnail').toArray()[0]; //Selecting One Code from page
          codeID = codeThumbnail.children[5].children[1].attribs.href.split('/')[2]; //Getting the code ID

          return agent.put(`/codes/${codeID}/favorite`)
        })
        .then(function(res){
          expect(res).to.have.status(200);
          $ = cheerio.load(res.text);
          expect($('.code-favorite').attr('data-fav')).to.equal('true'); //Sending put request to /codes/:id/favorite changed code favorite to true

          return Code.findById(codeID)
        })
        .then(function(code){
          expect(code.favorite).to.equal(true); //Making sure the change was save in the database
        })
    });
  });

  describe('DELETE codes endpoint', function(){
    it('delete a code by id', function(){
      let codeID;
      return agent.get('/codes')
        .then(function(res){
          $ = cheerio.load(res.text);
          let codeThumbnail = $('.code-thumbnail').toArray()[0]; //Selecting One Code from page
          codeID = codeThumbnail.children[5].children[1].attribs.href.split('/')[2]; //Getting the code ID

          return agent.delete(`/codes/${codeID}`)
        })
        .then(function(res){
          $ = cheerio.load(res.text);
          expect($('.alert-message').text()).to.equal('Code was successfully deleted');

          return Code.findById(codeID);
        })
        .then(function(code){
          expect(code).to.be.null;
        })
    });
  });
});
