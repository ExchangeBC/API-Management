var express = require('express');
var session = require('express-session')
var passport = require('passport');
var GitHubStrategy = require('passport-github2').Strategy;
var config = require('../server-config');
var app = express();

// Init
// ----------------------------------------------------------------------------

app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: '4rfg5edggs',
}))
app.use(passport.initialize());
app.use(express.static('client'));
app.use(passport.session());
passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(user, done) {
  done(null, user);
});

passport.use(new GitHubStrategy({
    clientID: config.github.clientId,
    clientSecret: config.github.clientSecret,
    callbackURL: config.github.callbackURL
  },
  function(accessToken, refreshToken, profile, done) {
      process.nextTick(function () {
        
        //the object returned by this function is automatically added to the session, and will 
        //be accessible as the req.user object.
        //for example: 
        //  req.user.profile.id; 
        //  req.user.profile.username; 
        //  req.user.accessToken

        return done(null, {profile: profile, accessToken: accessToken});
      });
    }
));

// Functions
// ----------------------------------------------------------------------------

function isLoggedIn(req, res) {
  if (req.user)
    return true;
  return false;
}


// Login and Logout
// ----------------------------------------------------------------------------

app.get('/auth/github', function(req, res, next) {
  passport.authenticate('github', { scope: ["user","repo"] })(req, res, next);
});

app.get('/auth/github/callback', function(req, res, next){
  passport.authenticate('github', { 
    failureRedirect: 'login-failed', 
    successRedirect: '/api-list.html'
  })(req, res, next);
});

app.get('/logout', function(req, res){
  req.logout();
  console.log("logged out")
  if (req.headers.referer) {
    res.redirect(req.headers.referer);
  }
  else
    res.redirect('/api-list.html');
});

// API to support the client
// ----------------------------------------------------------------------------

/*
returns the account information for the user attached to the current session, or
an empty object if no user is logged in
*/
app.get('/api/account', function(req, res){
  var json = null;
  console.log("isLoggedIn:"+isLoggedIn(req, res));
  if (isLoggedIn(req, res)) {
    json = JSON.stringify({ 
      token: req.user.accessToken,
      id: parseInt(req.user.profile.id),      
      username: req.user.profile.username,      
    });    
  }
  else {
    json = JSON.stringify({})
  }
  
  //headers to prevent browsers from caching the page
  res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", 0);

  res.end(json);
});

// Startup
// ----------------------------------------------------------------------------

app.listen(config.port, function () {
  console.log('listening on port '+config.port);
});
