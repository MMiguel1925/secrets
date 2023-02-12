//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require(`ejs`);
const _ = require(`lodash`);
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(express.json()); // to support JSON-encoded bodies

app.use(express.static(`public`));
app.set(`view engine`, `ejs`);
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    // cookie: { secure: false }
  })
);

app.use(passport.initialize());
app.use(passport.session());

//const uri = `${process.env.SERVIDOR_BD}://${process.env.UTILIZADOR}:${process.env.PALAVRA_CHAVE}@${process.env.CLUSTER}/${process.env.DB_DATABASE}?retryWrites=true&w=majority`;
//ligacao a server remoto: MongoAtlas ou localhost
mongoose.set("strictQuery", false);
mongoose.connect(`mongodb://127.0.0.1:27017/userDB`, { useNewUrlParser: true });

console.log(`Sucesso a ligar a BD`);

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

// passport local mongoose: as 3 linhas abaixo só sao necesseaias qd usamos a sessao
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
// **********************************************

const port = process.env.LOCALHOST_PORT;

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register", { messageError: null });
});

app.get("/secrets", (req, res) => {
  res.set("Cache-Control", "no-cache, private, no-store, must-revalidate, max-stal e=0, post-check=0, pre-check=0");
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", (req, res, next) => {
  console.log("Session exit..");
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.post("/register", (req, res) => {
  User.register({ username: req.body.username }, req.body.password, (err, user) => {
    if (err) {
      res.render("register", { messageError: "Message: " + err.message });
      console.log("ERRO user duplicado: " + err.name);
    } else {
      console.log("Successefuly user register");
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/login", passport.authenticate("local", { failureRedirect: "/", successRedirect: "/secrets", failureMessage: true }), (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  req.login(user, (err) => {
    if (err) {
      console.log(err);
      console.log("user login failed");
    }
  });
});

app.listen(port, function () {
  console.log("Server is running on port " + port);
});
