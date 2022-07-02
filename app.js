//jshint esversion:6
require('dotenv').config(); //always put it on top aor at the earliest

console.log(process.env.API_KEY);


const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const _ = require("lodash");
const encrypt = require("mongoose-encryption");
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));



//connect to mongo
mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true });

//creating a userSchema
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

//creating a secret --> long string for encryption


userSchema.plugin(encrypt, {
    secret: process.env.SECRET,
    encryptedFields: ["password"]
}); //add the plugin before creating the mongoose model

//while save() mongoose will encrypt the passowrd field;

//making the usermodel
const User = new mongoose.model("User", userSchema);

//rendering home page 
app.get("/", function(req, res) {
    res.render("home");
});

//rendering login page 
app.get("/login", function(req, res) {
    res.render("login");
});

//rendering register page 
app.get("/register", function(req, res) {
    res.render("register");
});


//post request in register page 
app.post("/register", function(req, res) {

    //creating a new user using the User model which uses Userschema
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });
    newUser.save(function(err) {
        if (!err) {
            console.log("Successfully saved");
            res.render("secrets");
        }
    });
});


//post request from login page 
app.post("/login", function(req, res) {

    const username = req.body.username;
    const password = req.body.password;

    User.findOne({ email: username }, function(err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                if (foundUser.password == password) {
                    res.render("secrets");
                }
            }
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