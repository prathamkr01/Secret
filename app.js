//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
// const encrypt = require('mongoose-encryption');
// const md5 = require('md5');
// const bcrypt = require('bcrypt');
// const saltRounds = 10;

const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')

const app = express();

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('public'));

app.set('view engine', 'ejs');


//For passport.js
app.use(session({
    secret:'Our little secret.',
    resave:false,
    saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB")

const userSchema = mongoose.Schema({
    username:{
        type: String,
        // required:true
    },
    password:{
        type: String,
        // required:true
    },
    googleId: String
});


// userSchema.plugin(encrypt,{secret:process.env.secret, encryptedFields:['password']}); // Moongoose encryption
userSchema.plugin(passportLocalMongoose);  // Passport.js plugin
userSchema.plugin(findOrCreate); // OAuth 2.0 Google with Passport

const User = new mongoose.model('User',userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get('/',(req,res)=>{
    res.render('home');
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get('/login',(req,res)=>{
    res.render('login');
});

app.get('/register',(req,res)=>{
    res.render('register');
});

app.get('/secrets',(req,res)=>{
    //VIMP 
    if(req.isAuthenticated()){
        res.render('secrets');        
    } else {
        res.redirect('/login');
    }
})

app.get('/logout',(req,res)=>{
    req.logout();
    res.redirect('/');
})


app.post('/register',(req,res)=>{

    //Level 4 Salting and hashing using bcypt
    // bcrypt.hash(req.body.password,saltRounds,(err,hash)=>{ 
    //         const newUser = new User({
    //             username: req.body.username,
    //             // password:md5(req.body.password)  //Level 3 md5 hashing
    //             password: hash //Level 4 Salting and hashing using bcypt
    //         })
            
    //         newUser.save(err=>{
    //             if(err) console.log(err);
    //             else res.render('secrets');
    //         });
    // });


    //Level 5 Using Passport.js
    User.register({username:req.body.username}, req.body.password, (err,user)=>{
        if(err){
            console.log(err);
            res.redirect('/register');
        } else{
            passport.authenticate('local')(req,res,()=>{
                res.redirect('/secrets')
            })
        }
    })
});

app.post('/login',(req,res)=>{
    //Level 4 Salting and hashing using bcypt
    // const enteredUsername = req.body.username;
    // const enteredPassword = req.body.password;
    
    // User.findOne({username:enteredUsername},(err,foundUser)=>{
    //     if(err) console.log(err);
    //     else {
    //         if(foundUser){
    //           console.log(foundUser);
    //         bcrypt.compare(enteredPassword,foundUser.password,(err,result)=>{
    //             if(result === true)
    //             res.render('secrets');
    //             else res.send('Wrong password entered');
    //         })
    //       }
    //   }
    // })

    //Level 5 Using Passport.js
    const user = new User({
      username:req.body.username,
      password:req.body.password
    });

    req.login(user,(err)=>{
        if(err) console.log(err);
        else{
            passport.authenticate('local')(req,res,()=>{
                res.redirect('/secrets')
            })
        }
    })
});

app.listen(3000,(req,res)=>{
    console.log('Server running on Port 3000');
})