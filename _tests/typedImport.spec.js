// @flow

import { expect } from 'chai';
import rewiremock from '../src/index';

describe('typed import ', () => {
  it('should throw: ', () => {
    rewiremock.inScope(() => {
      rewiremock(() => import('./lib/typed/b.js')).with(() => 42);
      expect(() => rewiremock.enable()).to.throw();
      rewiremock.disable();
    });
  });

  it('import as a mock name: ', () => {
    const unmockedBaz = require('./lib/typed/a.js');
    expect(unmockedBaz.default()).to.be.equal(10);

    const mockedBazLoad = rewiremock.around(
      () => import('./lib/typed/a.js'),
      mock => {
        mock(() => import('./lib/typed/b.js')).with(() => 42).toBeUsed();
        mock(() => import('./lib/typed/a-delayed.js')).with(() => 24);
      });

    return mockedBazLoad.then(mockedBaz => {
      expect(mockedBaz.default()).to.be.equal(42)
    })
  });

  it('should disable mock: ', () => {
    const unmockedBaz = require('./lib/typed/a.js');
    expect(unmockedBaz.default()).to.be.equal(10);

    /* istanbul ignore next */
    const mockedBazLoad = rewiremock.around(
      () => import('./lib/typed/a.js'),
      mock => {
        mock(() => import('./lib/typed/b.js')).with(() => 42);

        mock.getMock(() => import('./lib/typed/b.js')).disable();
      });

    return mockedBazLoad.then(mockedBaz => {
      expect(mockedBaz.default()).to.be.equal(10)
    })
  });

  describe('check exports', () => {
    it('check exports - ok: ', () => {
      return rewiremock.inScope(() => {
        rewiremock('./b.js')
          .with({
            default: () => {
            }
          })
          .toBeUsed()
          .toMatchOrigin();
        rewiremock.enable();
        require('./lib/typed/a.js');
        rewiremock.disable();
      });
    });

    it('check exports - fail: ', () => {
      return rewiremock.inScope(() => {
        rewiremock('./b.js')
          .with({
            default: 42
          })
          .toBeUsed()
          .toMatchOrigin();
        rewiremock.enable();
        expect(() => require('./lib/typed/a.js')).to.throw();
        rewiremock.disable();
      });
    });

    it('check exports - fail: ', () => {
      return rewiremock.inScope(() => {
        rewiremock('./b.js')
          .with({
            somethingMissing: 42
          })
          .toBeUsed()
          .toMatchOrigin();
        rewiremock.enable();
        expect(() => require('./lib/typed/a.js')).to.throw();

        rewiremock.disable();
      });
    });
  });

  describe('import delayed: ', () => {
    it('import after: ', () => {
      const mockedBazLoad = rewiremock.around(
        () => import('./lib/typed/a-delayed.js'),
        mock => {
          mock(() => import('./lib/typed/b.js')).with(() => 0);
        });

      return mockedBazLoad.then(mockedBaz => {
        expect(mockedBaz.default()).not.to.be.equal('aa')
      })
    });

    it('import before: ', () => {
      return rewiremock.around(
        () =>
          import('./lib/typed/a-delayed.js')
            .then(module => module) // emulate time tick
            .then(mockedBaz => {
              expect(mockedBaz.default()).to.be.equal(5)
            }),
        mock => {
          mock(() => import('./lib/typed/b.js')).with(() => 5);
        });
    });
  });
});
