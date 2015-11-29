var passport = require('passport');
var _ = require('lodash');
var async = require('async');
var crypto = require('crypto');
var passport = require('passport');
var User = require('../schema/user.js');
var Sequelize = require('sequelize');
var pg = require('pg');
var conString = process.env.DATABASE_URL || "postgres://aashna956:Charu@956@localhost:5432/projectx";
/*
 * GET /login
 * Login page.
 */
exports.getLogin = function(request, response) {
  //console.log(req);
  if (request.user) return response.redirect('/');
  response.render('pages/login');
};

/**
 * POST /login
 * Sign in using email and password.
 */
exports.postLogin = function(req, res, next) {

  passport.authenticate('local', function(err, user, info) {
    if (err) return next(err);
    if (!user) {
      console.log(req.password);
      console.log("invalid");
      return res.redirect('/login');
    }
    req.logIn(user, function(err) {
      console.log("logging in");
      if (err) return next(err);
      req.flash('success', { msg: 'Success! You are logged in.' });
      res.redirect(req.session.returnTo || '/');
    });
  })(req, res, next);
};

/**
 * GET /logout
 * Log out.
 */
exports.logout = function(req, res) {
  req.logout();
  res.redirect('/');
};

/**
 * GET /signup
 * Signup page.
 */
exports.getSignup = function(request, response) {
  //if (req.user) return res.redirect('/');
  response.render('pages/signup');
  console.log('get ');
};

/**
 * POST /signup
 * Create a new local account.
 */
exports.postSignup = function(req, res, next) {

User.findOne({where: {username:req.body.username}})
  .then(function(user){
      if(user) {
          req.flash('errors', { msg: 'Account with that email address already exists.' });
          console.log("nope");
          return res.redirect('/signup');
        }
      else{
          var t_user = User.create({
            username: req.body.username,
            password: req.body.password,
            followers: 0,
            following: 0
        }).then(function(t_user){
            req.logIn(t_user,function(err){
            if (err) return next(err);
            return res.redirect('/profile/'+t_user.username);
            });
          });
      }
  });
};


/*** GET PROFILE ***/
exports.getUser = function(req, res) {
  // If no username is specified, go to the logged in user's profile
  console.log(req.user);
  if (!req.params.username) {
    req.params.username = req.user.username;
  }
  User
    .findOne({where: { username: req.params.username }})
    .then(function(user) {
      // Check to see if a user with the specified username exists
      if (!user) {
        req.flash('errors', { msg: 'User with that username does not exist.' });
        console.log("Still weird");
        return res.redirect('/');
      }
      else{
          res.render('pages/profile', { currentuser: req.user.username, username: user.username, followers: user.followers, following: user.following, index: false, profile: true});
        }
    });
};

exports.addFollower = function(req,res){
  if(!req.params.username){ //no username specified 
    res.redirect("/");
  }
  if(!req.user){    // not logged in
    res.redirect('/');
  }
  else{
  User
    .findOne({where: { username: req.params.username }})
    .then(function(user) {
      // Check to see if a user with the specified username exists
      if (!user) {
        req.flash('errors', { msg: 'User with that username does not exist.' });
        console.log("weird stuff");
        return res.redirect('/');
      }
      else{
        var client = new pg.Client(conString);
        client.connect();
          client.query("select * from follows where follower=$1 and followee=$2",[req.user.username, req.params.username], function(err,result){
              if(result.rowCount==0){
                client.query("INSERT INTO follows VALUES ($1,$2) ", [req.user.username, req.params.username], function(err){
                  if (err) {
                    console.log(err);
                    client.end();
                    res.sendStatus(400);
                  } 
                });
                client.query("UPDATE users SET followers=followers+1 WHERE username=$1", [req.params.username], function(err) {
                  if (err) {
                    console.log(err);
                    client.end();
                    res.sendStatus(400);
                  } 
                });
                client.query("UPDATE users SET following=following+1 WHERE username=$1", [req.user.username], function(err) {
                  if (err) {
                    console.log(err);
                    client.end();
                    res.sendStatus(400);
                  }
                  else{
                    console.log("render in follow");
                  res.render('pages/profile', { currentuser: req.user.username, username: user.username, followers: user.followers, following: user.following, index: false, profile: true});
                   client.end();
                 }
                });  
              }
              else {
                res.redirect('/profile/'+req.params.username);
              }
            });
        }
    });
  }
};
exports.getFollowers = function(req,res){

  if(!req.user){    // not logged in
    res.redirect('/');
  }
  else{
  User
    .findOne({where: { username: req.params.username }})
    .then(function(user) {
      // Check to see if a user with the specified username exists
      if (!user) {
        req.flash('errors', { msg: 'User with that username does not exist.' });
        return res.redirect('/');
      }
      else{
        var client = new pg.Client(conString);
        client.connect();
          client.query("select follower from follows where followee=$1",[user.username], function(err,result){
              if(err){
                client.end();
                res.sendStatus(400);
              }
              res.json(result.rows);
              client.end();
            });
        }
    });
  }
};
exports.getFollowees = function(req,res){

  if(!req.user){    // not logged in
    res.redirect('/');
  }
  else{
  if (!req.params.username) {
    req.params.username = req.user.username;
  }
  User
    .findOne({where: { username: req.params.username }})
    .then(function(user) {
      // Check to see if a user with the specified username exists
      if (!user) {
        req.flash('errors', { msg: 'User with that username does not exist.' });
        return res.redirect('/');
      }
      else{
        var client = new pg.Client(conString);
        client.connect();
          client.query("select followee from follows where follower=$1",[user.username], function(err,result){
              if(err){
                client.end();
                res.sendStatus(400);
              }
              res.json(result.rows);
              client.end();
            });
        }
    });
  }
};