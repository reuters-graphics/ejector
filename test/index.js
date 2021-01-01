require('dotenv').config();
const Ejector = require('../dist');
const expect = require('expect.js');

const ejector = new Ejector();

describe('test Ejector', function() {
  this.timeout(10000);

  it('Should return regions', function() {
    expect(ejector.run()).to.be('hello world');
  });
});
