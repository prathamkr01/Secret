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
    email:{
        type: String,
        // required:true
    },
    password:{
        type: String,
        // required:true
    } 
});


// userSchema.plugin(encrypt,{secret:process.env.secret, encryptedFields:['password']}); // Moongoose encryption
userSchema.plugin(passportLocalMongoose);  // Passport.js plugin

const User = new mongoose.model('User',userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get('/',(req,res)=>{
    res.render('home');
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
    //             email: req.body.username,
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
    
    // User.findOne({email:enteredUsername},(err,foundUser)=>{
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