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
app.use(passport.session());
app.use(express.static('../client'));
passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(user, done) {
  done(null, user);
});

passport.use(new GitHubStrategy({
    clientID: config.github.clientId,
    clientSecret: config.github.clientSecret,
    callbackURL: config.host+":"+config.port+"/auth/github/callback"
  },
  function(accessToken, refreshToken, profile, done) {
      process.nextTick(function () {
        
        //the github profile is automatically added to the session, and will 
        //be accessible as the req.user object.
        //for example: req.user.id; req.user.username;

        //todo: store username and id by creating a new consumer in kong
        // (if it doesn't already exist)
        
        //console.log(profile)
        return done(null, profile);
      });
    }
));

// Login and Logout
// ----------------------------------------------------------------------------

app.get('/auth/github',
  passport.authenticate('github', { scope: ["user"] }));

app.get('/auth/github/callback', 
  passport.authenticate('github', { failureRedirect: 'login-failed' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect(req.headers.referer); 
  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect(req.headers.referer);
  //res.redirect('/api-list.html');
});

// API to support the client
// ----------------------------------------------------------------------------

/*
returns the account information for the user attached to the current session, or
an empty object if no user is logged in
*/
app.get('/api/account', function(req, res){
  var json = null;
  if (req.user) {
    json = JSON.stringify({ 
      //id: req.user.id,
      username: req.user.username
    });    
  }
  else {
    json = JSON.stringify({})
  }
  res.end(json);
});

// Startup
// ----------------------------------------------------------------------------

app.listen(config.port, function () {
  console.log('listening on port '+config.port);
});