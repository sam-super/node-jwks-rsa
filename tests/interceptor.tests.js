const nock = require('nock');
const { expect } = require('chai');

const { x5cSingle, x5cMultiple } = require('./keys');
const { JwksClient } = require('../src/JwksClient');

describe('JwksClient (interceptor)', () => {
  const jwksHost = 'http://my-authz-server';

  beforeEach(() => {
    nock.cleanAll();
  });

  describe('#getSigningKeys', () => {
    it('should prefer key from interceptor', async () => {
      const client = new JwksClient({
        jwksUri: `${jwksHost}/.well-known/jwks.json`,
        getKeysInterceptor: () => Promise.resolve(x5cSingle.keys)
      });

      nock(jwksHost)
        .get('/.well-known/jwks.json')
        .replyWithError('Call to jwksUri not expected');

      const key = await client.getSigningKey('NkFCNEE1NDFDNTQ5RTQ5OTE1QzRBMjYyMzY0NEJCQTJBMjJBQkZCMA');
      expect(key.kid).to.equal('NkFCNEE1NDFDNTQ5RTQ5OTE1QzRBMjYyMzY0NEJCQTJBMjJBQkZCMA');
    });

    it('should fallback to fetch from jwksUri', async () => {
      const client = new JwksClient({
        jwksUri: `${jwksHost}/.well-known/jwks.json`,
        getKeysInterceptor: () => Promise.resolve([])
      });

      nock(jwksHost)
        .get('/.well-known/jwks.json')
        .reply(200, x5cMultiple);

      const key = await client.getSigningKey('RkI5MjI5OUY5ODc1N0Q4QzM0OUYzNkVGMTJDOUEzQkFCOTU3NjE2Rg');
      expect(key.kid).to.equal('RkI5MjI5OUY5ODc1N0Q4QzM0OUYzNkVGMTJDOUEzQkFCOTU3NjE2Rg');
    });

    it('should not fallback to fetch from jwksUri if jwksUriFallback=false', async () => {
      const client = new JwksClient({
        cache: false,
        jwksUri: `${jwksHost}/.well-known/jwks.json`,
        getKeysInterceptor: () => Promise.resolve([]),
        jwksUriFallback: false
      });

      nock(jwksHost)
        .get('/.well-known/jwks.json')
        .reply(200, x5cMultiple);

      try {
        await client.getSigningKey('RkI5MjI5OUY5ODc1N0Q4QzM0OUYzNkVGMTJDOUEzQkFCOTU3NjE2Rg');
        throw new Error('should have thrown error');
      } catch (err) {
        expect(err).not.to.be.null;
        expect(err.message).to.equal('Unable to find a signing key that matches \'RkI5MjI5OUY5ODc1N0Q4QzM0OUYzNkVGMTJDOUEzQkFCOTU3NjE2Rg\'');
      }

    });
  });
});
