"use strict"

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const expect = chai.expect;

const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

describe('initial-test', function(){
  it('GET req to / should return status 200', function(){
    return chai.request(app)
      .get('/')
      .then(function(res){
        expect(res).to.have.status(200);
      });
  });
});