/**
 * Passport.js Hook with Twitter integration
 */

var passport = require('passport');
var TwitterStrategy = require('passport-twitter');

module.exports = function PassportTwitter (sails) {

  var hook;
  var settings;

  return {

    // Settings
    defaults: {
      twitter: {
        consumerKey: '',
        consumerSecret: '',
        callbackURL: '/auth/callback',
        authorizeURL: '/auth/authorize',
        logoutURL: '/auth/logout',
        redirectURL: '/'
      }
    },


    // Namespace configuration
    configure: function () {
      settings = sails.config.twitter;
      var self = this;

      /**
       * Callback URL the user is redirected to by LinkedIn after
       * authorizing (or rejecting) the app.
       * (by default, this is the same as the `authorize` route/action)
       */

      sails.after('router:after', function () {
        sails.router.bind(settings.authorizeURL, self.authorize);
        sails.router.bind(settings.callbackURL, self.callback);
        sails.router.bind(settings.logoutURL, self.logout);
      });
    },


    // Initalize the hook and set the TwitterStrategy
    initialize: function (done) {
      hook = this;

      if (!sails.config.hooks.orm) {
        return done(new Error('The Passport-Twitter hook depends on the `orm` hook, which is not currently enabled.'));
      }


      var strategy = new TwitterStrategy({
        consumerKey: settings.consumerKey,
        consumerSecret: settings.consumerSecret,
        callbackURL: sails.getBaseurl() + settings.callbackURL
      },

      function _verify (accessToken, tokenSecret, profile, cb) {

        // Normalize Twitter API data to Profile Model
        var profileData = {
          service: 'twitter',
          serviceID: profile.id,
          username: profile.username,
          accessToken: accessToken,
          avatar: profile._json.profile_image_url
        };

        // Find or create a new profile
        Profile.findOrCreate({
          service: 'twitter',
          serviceID: profile.id
        }, profileData)
        .exec(function(err, profileRecord) {
          if(err) return cb(err);

          // Attach an actual id to the profile
          profileData.id = profileRecord.id;

          // Look to see if the user has an account already, if not create one and update the profile.
          if(!profileRecord.account) {

            Account.create()
            .exec(function(err, account) {
              if(err) return cb(err);

              profileData.account = account.id;

              Profile.update({ id: profileData.id }, profileData).exec(function(err, profileData) {
                if(err) return cb(err);
                return cb(null, profileData);
              });
            });
          }

          else {

            profileData.account = profileRecord.account;

            // Return profile object to serialze into a session
            // The session will be replaced by an account id later
            return cb(null, profileData);
          }
        });
      });

      // Wait until after sails has lifted so we have access to
      // `sails.getBaseurl()` to build the callback route.
      sails.after('lifted', function () {

        hook.passport = passport;
        hook.passport.use(strategy);

        hook.passport.serializeUser(function noop (user, done) { done(null, user); });
        hook.passport.deserializeUser(function noop (user, done) { done(null, user); });
      });

      return done();
    },


    // "Controller" routes


    authorize: function (req, res, cb) {
      hook.passport.authenticate('twitter', function(err, user, info) {})(req, res, cb);
    },


    callback: function (req, res, cb) {

      // Call Passport.authenticate to check against the Twitter API
      hook.passport.authenticate('twitter', function(err, profile, info) {
        if(err) return cb(err);
        if(!profile) return cb(new Error('Invalid profile returned from Twitter.'));

        // Handle Updating Session
        req.session.user = profile;
        res.redirect(settings.redirectURL);

      })(req, res, cb);
    },


    logout: function (req, res) {
      delete req.session.user;
      res.redirect(settings.redirectURL);
    }

  };

};
