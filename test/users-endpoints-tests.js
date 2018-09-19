"use strict"

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const faker = require('faker');
const cheerio = require('cheerio');

const expect = chai.expect;

const Code = require('../models/code');
const User = require('../models/user');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

var agent;
var userID;
var $;

function tearDownDb() {
  console.warn('Deleting database');
  return mongoose.connection.dropDatabase();
}

describe('myQR users API resource', function() {
  before(function(){
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function(){
    agent = chai.request.agent(app);
  })

  afterEach(function(){
    return agent.close();
  })

  afterEach(function(){
    return tearDownDb();
  });

  after(function(){
    return closeServer();
  });

  describe('GET users endpoints',function(){
    it('should render sign up form', function(){
      return chai.request(app).get('/users/register')
        .then(function(res){
          expect(res).to.have.status(200);
          $ = cheerio.load(res.text);
          expect($('.user-form').find('form').length).to.be.at.least(1);
        })
    });

    it('should render login form', function(){
      return chai.request(app).get('/users/login')
        .then(function(res){
          expect(res).to.have.status(200);
          $ = cheerio.load(res.text);
          expect($('.user-form').find('form').length).to.be.at.least(1);
        })
    });

    it('should return current user id as JSON', function(){
      return agent.post('/users/register')
      .type('form')
      .send({
        username: 'testuser',
        password: 'password'
      })
      .then(function(res){
        return agent.get('/users/current')
      })
      .then(function(res){
        expect(res).to.be.json;
        expect(res.body).to.be.a('object');
        userID = res.body.userID;

        return User.findById(userID)
      })
      .then(function(user){
        expect(userID).to.equal(user._id.toString());
      })
    });
    
    it('should log the current user out', function(){
      return agent.post('/users/register')
      .type('form')
      .send({
        username: 'testuser',
        password: 'password'
      })
      .then(function(res){
        return agent.get('/users/logout')
      })
      .then(function(res){
        expect(res).to.have.status(200);
        $ = cheerio.load(res.text);
        expect($('.alert-message').text()).to.equal('Successfully logged out!');
      })
    });
  });

  describe('POST users endpoints', function(){
    it('should register a new user', function(){
      return agent.post('/users/register')
      .type('form')
      .send({
        username: 'testuser',
        password: 'password'
      })
      .then(function(res){
        expect(res).to.have.status(200);
        $ = cheerio.load(res.text);
        expect($('.alert-message').text()).to.equal('Welcome to myQR: testuser!')
      })
    });

    it('should login a registered user', function(){
      return agent.post('/users/register')
      .type('form')
      .send({
        username: 'testuser',
        password: 'password'
      })
      .then(function(res){
        return agent.get('/users/logout')
      })
      .then(function(res){
        return agent.post('/users/login').type('form').send({
          username: 'testuser',
          password: 'password'
        })
      })
      .then(function(res){
        expect(res).to.have.status(200);
        expect(res.redirects[0].split('/')[3]).to.equal('codes'); //A successful login redirects to /codes
      })
    });
  });

});