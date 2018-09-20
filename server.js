"use strict";

var express = require("express");
var mongo = require("mongodb");
var mongoose = require("mongoose");
let bodyParser = require("body-parser");
let Schema = mongoose.Schema;

// Alternative of using .env shell file to add on MONGOLAB_URI
// This require stmt will populate process.env.MONGOLAB_URI
// Glitch version will use .env file as expected
require("./secrets.js");

var cors = require("cors");

var app = express();

// Basic Configuration
var port = process.env.PORT || 3000;

// Middleware

/** this project needs a db !! **/
mongoose.connect(process.env.MONGOLAB_URI);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", function(req, res, next) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// MongoDB models and schemas

let urlSchema = new Schema({
  original_url: { type: String, required: true },
  short_url: Number
});

let URL = mongoose.model("url", urlSchema);

// API endpoints

// GET /api/shorturl
app.get("/api/shorturl", (req, res, next) => {
  // Find all instancess
  URL.find(data => data)
    .then(dbData => {
      if (dbData.length > 0) {
        return dbData.map((entry, idx) => {
          return {
            original_url: entry.original_url,
            short_url: idx
          };
        });
      } else {
        return { submitted: [] };
      }
    })
    .then(data => res.json(data))
    .catch(next);
});

// POST /api/shorturl/new
app.post("/api/shorturl/new", (req, res, next) => {
  // 1) Find collection with URL key so you can get next index
  URL.find(data => data)
    .then(dbData => {
      console.log("dbData: ", dbData);
      // 2) Regex to remove protocols e.g., https://
      let sanitizedUrl = req.body.url.replace(/(^\w+:|^)\/\//, "");
      // 3) Create instance to save to DB
      let url = new URL({
        original_url: sanitizedUrl,
        short_url: dbData.length //next index
      });
      // 3) Save instance to DB
      url.save((err, data) => {
        if (err) next(err);
        console.log("spot 2", data);
        let { original_url, short_url } = data;
        // 4) return saved results back to front end
        res.json({ original_url, short_url });
      });
    })
    .catch(next);
});

// GET /api/shorturl/:id
app.get("/api/shorturl/:id", (req, res, next) => {
  // URL.findById(req.params.id, data =>
  //   res.json({ original_url: data.original_url, short_url: data.short_url })
  // );
});

// Start server

app.listen(port, function() {
  console.log("Node.js listening ...", port);
});
