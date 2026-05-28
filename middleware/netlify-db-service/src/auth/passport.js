/**
 * OAuth identity provider configuration.
 * Authentication is intentionally restricted to Google and Facebook.
 */

import passportModule from 'passport';
import FacebookStrategyModule from 'passport-facebook';
import GoogleStrategyModule from 'passport-google-oauth20';
import { ensureSchema, oauthProviders, users } from '../db.js';

const passport = passportModule.default || passportModule;
const FacebookStrategy = FacebookStrategyModule.default || FacebookStrategyModule;
const GoogleStrategy = GoogleStrategyModule.default || GoogleStrategyModule;

const OAUTH_CONFIG = {
  google: {
    idEnv: ['GOOGLE_CLIENT_ID', 'OAUTH_GOOGLE_CLIENT_ID'],
    secretEnv: ['GOOGLE_CLIENT_SECRET', 'OAUTH_GOOGLE_CLIENT_SECRET'],
    callbackEnv: 'GOOGLE_CALLBACK_URL',
    fallbackCallbackURL: 'http://localhost:3001/api/auth/google/callback'
  },
  facebook: {
    idEnv: ['FACEBOOK_APP_ID', 'OAUTH_FACEBOOK_CLIENT_ID'],
    secretEnv: ['FACEBOOK_APP_SECRET', 'OAUTH_FACEBOOK_CLIENT_SECRET'],
    callbackEnv: 'FACEBOOK_CALLBACK_URL',
    fallbackCallbackURL: 'http://localhost:3001/api/auth/facebook/callback'
  }
};

function readFirstEnv(names) {
  return names.map(name => process.env[name]).find(Boolean);
}

function isConfiguredCredential(value) {
  return Boolean(value) && !/^your[-_]/i.test(value) && !value.startsWith('<');
}

export function getOAuthProviderConfig(provider) {
  const definition = OAUTH_CONFIG[provider];
  if (!definition) return null;

  const clientID = readFirstEnv(definition.idEnv);
  const clientSecret = readFirstEnv(definition.secretEnv);

  return {
    clientID,
    clientSecret,
    callbackURL: process.env[definition.callbackEnv] || definition.fallbackCallbackURL,
    configured: isConfiguredCredential(clientID) && isConfiguredCredential(clientSecret)
  };
}

async function findOrCreateUser(provider, providerId, email, profile = {}) {
  await ensureSchema();

  const providerRecord = await oauthProviders.getByProvider(provider, providerId);
  if (providerRecord) {
    return users.getById(providerRecord.user_id);
  }

  let user = await users.getByEmail(email);
  if (!user) {
    user = await users.create({
      email,
      passwordHash: null,
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      profilePictureUrl: profile.picture || null
    });
  }

  // The providers are used for identity only; provider API tokens are not retained.
  await oauthProviders.upsert({
    userId: user.id,
    provider,
    providerId,
    providerEmail: email,
    accessToken: null,
    refreshToken: null,
    tokenExpiresAt: null,
    rawData: { displayName: profile.displayName || '' }
  });

  return user;
}

export function setupGoogleStrategy() {
  const { clientID, clientSecret, callbackURL, configured } = getOAuthProviderConfig('google');
  if (!configured) {
    console.log('Google OAuth is not configured; sign-in is unavailable.');
    return;
  }

  passport.use(
    new GoogleStrategy.Strategy(
      {
        clientID,
        clientSecret,
        callbackURL
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(null, false, { message: 'Google did not provide an email address.' });

          const user = await findOrCreateUser('google', profile.id, email, {
            firstName: profile.name?.givenName,
            lastName: profile.name?.familyName,
            displayName: profile.displayName,
            picture: profile.photos?.[0]?.value
          });
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
}

export function setupFacebookStrategy() {
  const { clientID, clientSecret, callbackURL, configured } = getOAuthProviderConfig('facebook');
  if (!configured) {
    console.log('Facebook OAuth is not configured; sign-in is unavailable.');
    return;
  }

  passport.use(
    new FacebookStrategy.Strategy(
      {
        clientID,
        clientSecret,
        callbackURL,
        profileFields: ['id', 'displayName', 'name', 'emails', 'picture.type(large)']
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(null, false, { message: 'Facebook did not provide an email address.' });

          const user = await findOrCreateUser('facebook', profile.id, email, {
            firstName: profile.name?.givenName,
            lastName: profile.name?.familyName,
            displayName: profile.displayName,
            picture: profile.photos?.[0]?.value
          });
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
}

export function initializePassport() {
  setupGoogleStrategy();
  setupFacebookStrategy();
}
