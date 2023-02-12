//jshint esversion:6
require("dotenv").config();

const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");

const bcrypt = require("bcrypt");
const saltRounds = 10;

mongoose.set("strictQuery", false);

//const uri = `${process.env.SERVIDOR_BD}://${process.env.UTILIZADOR}:${process.env.PALAVRA_CHAVE}@${process.env.CLUSTER}/${process.env.DB_DATABASE}?retryWrites=true&w=majority`;

//ligacao a server remoto: MongoAtlas ou localhost

mongoose.connect(`mongodb://127.0.0.1:27017/userDB`, { useNewUrlParser: true });

console.log(`Sucesso a ligar a BD`);

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

// const secret = process.env.SECRET_DB;
// userSchema.plugin(encrypt, { secret: secret, encryptedFields: ["password"] });

const User = mongoose.model(`User`, userSchema);

const express = require("express");

const bodyParser = require("body-parser");

const ejs = require(`ejs`);

const _ = require(`lodash`);

const app = express();

app.set(`view engine`, `ejs`);

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(`public`));

const port = process.env.LOCALHOST_PORT;

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
    // Store hash in your password DB.
    if (!err) {
      const newUser = new User({
        email: req.body.username,
        password: hash,
      });
      newUser.save((err) => {
        if (err) return console.log(err);
        res.send("User registado com sucesso");
      });
    } else {
      res.send("Erro no registo do user!");
    }
  });
});

app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  User.findOne({ email: username }, (err, foundUser) => {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        bcrypt.compare(password, foundUser.password, (err, result) => {
          if (result === true) {
            res.render("secrets");
          } else {
            res.send("Login failed");
          }
        });
      }
    }
  });
});

app.listen(port, function () {
  console.log("Server is running on port " + port);
});
