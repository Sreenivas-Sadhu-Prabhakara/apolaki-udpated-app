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
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientID || !clientSecret || clientID.startsWith('your_')) {
    console.log('Google OAuth is not configured; sign-in is unavailable.');
    return;
  }

  passport.use(
    new GoogleStrategy.Strategy(
      {
        clientID,
        clientSecret,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback'
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
  const clientID = process.env.FACEBOOK_APP_ID;
  const clientSecret = process.env.FACEBOOK_APP_SECRET;
  if (!clientID || !clientSecret || clientID.startsWith('your_')) {
    console.log('Facebook OAuth is not configured; sign-in is unavailable.');
    return;
  }

  passport.use(
    new FacebookStrategy.Strategy(
      {
        clientID,
        clientSecret,
        callbackURL: process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:3001/api/auth/facebook/callback',
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
