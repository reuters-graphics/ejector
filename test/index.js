require('dotenv').config();
const Ejector = require('../dist');
const expect = require('expect.js');
const { createFsFromVolume, Volume } = require('memfs');
const path = require('path');

describe('Test Ejector', function() {
  this.timeout(10000);

  const fs = createFsFromVolume(new Volume());

  it('Should eject a dependency', async function() {
    const ejector = new Ejector({
      dependency: '@reuters-graphics/chart-module-globetrotter',
    }, fs);

    fs.mkdirSync(path.join(process.cwd(), 'src/js'), { recursive: true });

    await ejector.eject();
    const ejectDir = path.join(process.cwd(), 'src/js/chart-module-globetrotter');
    expect(fs.existsSync(ejectDir)).to.be(true);
    expect(fs.existsSync(path.join(ejectDir, 'lib/chart.js'))).to.be(true);
    expect(fs.existsSync(path.join(ejectDir, 'lib/utils/d3.js'))).to.be(true);
    expect(fs.existsSync(path.join(ejectDir, 'lib/base/errorClasses.js'))).to.be(true);
  });

  it('Should fail with a bad filter', async function() {
    const ejector = new Ejector({}, fs);

    try {
      await ejector.eject('@reuters-graphic/something-doesnt-exist');
    } catch (e) {
      expect(e.name).to.be('DependencyNotFoundError');
    }
  });
});
