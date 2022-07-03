//jshint esversion:6
require('dotenv').config(); //always put it on top aor at the earliest


const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');


//Regular template//
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
//Regular template//


// const encrypt = require("mongoose-encryption"); //less security in this method 
// const md5 = require("md5"); //for hashing passwords
//we remove md5 and use bcrypt which has even more security for passwords.
// const bcrypt = require("bcrypt");
// const saltRounds = 10; //adds 10 randomly generated characters in our password making is more difficult to crack.
//we remove bcrypt and add passport .js 


app.use(session({

    secret: "Little Lakshmi's Secret.",
    resave: false,
    saveUninitialized: false

}))

app.use(passport.initialize());
app.use(passport.session());



//connect to mongo
mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true });


//creating a userSchema
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secrets: String
});


userSchema.plugin(passportLocalMongoose); //to hash passwords
userSchema.plugin(findOrCreate);



//creating a secret --> long string for encryption
//removed this technique coz it's not that advanced 
// userSchema.plugin(encrypt, {
//     secret: process.env.SECRET,
//     encryptedFields: ["password"]
// }); 
//add the plugin before creating the mongoose model
//while save() mongoose will encrypt the passowrd field;



//making the usermodel
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());


passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    })
});


passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    function(accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ googleId: profile.id }, function(err, user) {
            return cb(err, user);
        });
    }
));



//rendering home page 
app.get("/", function(req, res) {
    res.render("home");
});

//signup with google 

app.get("/auth/google",
    passport.authenticate("google", { scope: ["profile"] })
);


app.get("/auth/google/secrets",
    passport.authenticate('google', { failureRedirect: "/login" }),
    function(req, res) {
        // Successful authentication, redirect home.
        res.redirect("/secrets");
    });



//rendering login page 
app.get("/login", function(req, res) {
    res.render("login");
});

//rendering register page 
app.get("/register", function(req, res) {
    res.render("register");
});


app.get("/secrets", function(req, res) {
    User.find({ "secrets": { $ne: null } }, function(err, foundUsers) {
        if (err) {
            console.log(err)
        } else {
            if (foundUsers) {
                res.render("secrets", { usersWithMessage: foundUsers });
            }
        }
    });
});


//post request in register page 
// app.post("/register", function(req, res) {

//     bcrypt.hash(req.body.password, saltRounds, function(err, hash) {

//         // Store hash in your password DB.

//         //creating a new user using the User model which uses Userschema
//         const newUser = new User({
//             email: req.body.username,
//             // password: md5(req.body.password) //turning the passowrd into hash --> hashing password // md5 is an API thant hashes strings 
//             password: hash

//         });
//         newUser.save(function(err) {
//             if (!err) {
//                 console.log("Successfully saved");
//                 res.render("secrets");
//             }
//         });


//     });


// });


// //post request from login page 
// app.post("/login", function(req, res) {

//     const username = req.body.username;
//     // const password = md5(req.body.password); //md5 generates same hash for same strings 
//     const password = (req.body.password);

//     User.findOne({ email: username }, function(err, foundUser) {
//         if (err) {
//             console.log(err);
//         } else {
//             if (foundUser) {
//                 // if (foundUser.password == password) {
//                 //     res.render("secrets");
//                 // } //we will use bcrypt compare method

//                 bcrypt.compare(password, foundUser.password, function(err, result) {
//                     // result == true
//                     if (result == true) {
//                         res.render("secrets");
//                     }
//                 });


//             }
//         }
//     });

// });



app.get("/logout", function(req, res) {

    req.logout(function(err) {
        if (!err) {
            res.redirect("/");
        }
    });
});

//rendering submit page 
app.get("/submit", function(req, res) {

    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login");
    }

});

//submitting the message 
app.post("/submit", function(req, res) {

    const submitted = req.body.secrets;

    User.findById(req.user.id, function(err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                foundUser.secrets = submitted;
                foundUser.save(function() {
                    res.redirect("/secrets");
                });
            }
        }

    });

});





//making a very new app.post("/register and /login") with passport.js 

app.post("/register", function(req, res) {

    User.register({ username: req.body.username }, req.body.password, function(err, user) {
        if (err) {
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function() {
                res.redirect("/secrets");
            });
        }
    });

});



app.post("/login", function(req, res) {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err) {
        if (!err) {
            passport.authenticate("local")(req, res, function() {
                res.redirect("/secrets");
            });
        }

    });

});



let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}


app.listen(port, function() {
    console.log("Server started on port 3000");
});