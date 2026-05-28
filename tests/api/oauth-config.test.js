/**
 * OAuth provider configuration contract tests.
 * Keeps deployed Netlify env names and legacy aliases from drifting apart.
 * @tags smoke, api, auth
 */

import { expect } from 'chai';
import { getOAuthProviderConfig } from '../../middleware/netlify-db-service/src/auth/passport.js';

const OAUTH_ENV_KEYS = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_CALLBACK_URL',
  'OAUTH_GOOGLE_CLIENT_ID',
  'OAUTH_GOOGLE_CLIENT_SECRET',
  'FACEBOOK_APP_ID',
  'FACEBOOK_APP_SECRET',
  'FACEBOOK_CALLBACK_URL',
  'OAUTH_FACEBOOK_CLIENT_ID',
  'OAUTH_FACEBOOK_CLIENT_SECRET'
];

describe('API > OAuth configuration', function () {
  let originalEnv;

  beforeEach(function () {
    originalEnv = Object.fromEntries(OAUTH_ENV_KEYS.map(key => [key, process.env[key]]));
    for (const key of OAUTH_ENV_KEYS) delete process.env[key];
  });

  afterEach(function () {
    for (const key of OAUTH_ENV_KEYS) {
      if (originalEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalEnv[key];
      }
    }
  });

  it('uses Netlify Facebook env names as the primary production contract', function () {
    process.env.FACEBOOK_APP_ID = 'facebook-app-id';
    process.env.FACEBOOK_APP_SECRET = 'facebook-app-secret';
    process.env.FACEBOOK_CALLBACK_URL = 'https://example.netlify.app/api/auth/facebook/callback';

    const config = getOAuthProviderConfig('facebook');

    expect(config).to.include({
      clientID: 'facebook-app-id',
      clientSecret: 'facebook-app-secret',
      callbackURL: 'https://example.netlify.app/api/auth/facebook/callback',
      configured: true
    });
  });

  it('accepts legacy OAUTH Facebook aliases without changing Netlify env names', function () {
    process.env.OAUTH_FACEBOOK_CLIENT_ID = 'legacy-facebook-client-id';
    process.env.OAUTH_FACEBOOK_CLIENT_SECRET = 'legacy-facebook-client-secret';

    const config = getOAuthProviderConfig('facebook');

    expect(config).to.include({
      clientID: 'legacy-facebook-client-id',
      clientSecret: 'legacy-facebook-client-secret',
      callbackURL: 'http://localhost:3001/api/auth/facebook/callback',
      configured: true
    });
  });

  it('treats placeholder Facebook credentials as unconfigured', function () {
    process.env.FACEBOOK_APP_ID = 'your-facebook-app-id';
    process.env.FACEBOOK_APP_SECRET = 'your-facebook-app-secret';

    const config = getOAuthProviderConfig('facebook');

    expect(config.configured).to.equal(false);
  });
});
