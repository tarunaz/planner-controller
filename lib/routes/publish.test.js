'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const supertest = require('supertest');
const express = require('express');
describe(__filename, function () {

  let requires, mod, app, request, responseStub;
  const stompit = 'stompit';
  const requestStub = 'request';
  const stompitStub = {
    send: sinon.stub().returns({write: sinon.stub(), end: sinon.stub()}),
    disconnect: sinon.stub()
  };
  beforeEach(function () {
    require('clear-require').all();
    responseStub = sinon.stub();
    requires = {
      [stompit]: {
        connect: sinon.stub()
      },
      [requestStub]: {
        defaults: sinon.stub().returns(responseStub)
      }
    };

    mod = proxyquire('./publish.js', requires);
    app = express();
    app.use('/publish', mod);
    request = supertest(app);
  });

  it('should return a request error', function (done) {
    requires[stompit].connect.yields('Error', null);
    responseStub.yields(null, 'success');
    const data = [
          {
          	'branchNumber': 1234,
          	'routeNumber':'P*001'
          }
        ];
    request.post('/publish')
      .send(data)
      .expect(200)
      .end(function (err, res) {
        expect(res.status).to.be.eql(500);
        done();
      });
  });

  it('should post message', function (done) {
    const data = [
      {
      	'branchNumber': 1234,
      	'routeNumber':'P*001'
      }
    ];
    requires[stompit].connect.yields(null, stompitStub);
    responseStub.yields(null, 'success');
    request.post('/publish')
    .send(data)
    .expect(200)
    .end(function(err, res) {
      expect(err).to.not.exist;
      expect(res.body).to.exist;
      done();
    });
  });
});
