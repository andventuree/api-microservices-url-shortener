"use strict";

var express = require("express");
var mongo = require("mongodb");
var mongoose = require("mongoose");
let bodyParser = require("body-parser");
let Schema = mongoose.Schema;
let dns = require("dns");

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
      if (dbData.length === 0) return [];
      let urls = dbData.map((entry, idx) => {
        return {
          original_url: entry.original_url,
          short_url: idx
        };
      });
      return urls;
    })
    .then(urls => res.json({ urls }))
    .catch(next);
});

// POST /api/shorturl/new
app.post("/api/shorturl/new", (req, res, next) => {
  // 1) Regex to remove protocols e.g., https://
  let sanitizedUrl = req.body.url.replace(/(^\w+:|^)\/\//, "");
  // 2) Determine if URL is valid
  dns.lookup(sanitizedUrl, (err, address, family) => {
    if (err) {
      // 2a) invalid URL, send error
      res.json({ error: "invalid URL" });
    } else {
      // 2b) Find collection with URL key so you can get next index
      URL.find(data => data)
        .then(dbData => {
          // 3) Create instance to save to DB
          let url = new URL({
            original_url: sanitizedUrl,
            short_url: dbData.length //next index
          });
          // 4) Save instance to DB
          url.save((err, data) => {
            if (err) next(err);
            let { original_url, short_url } = data;
            // 5) Return saved results back to front end
            res.json({ original_url, short_url });
          });
        })
        .catch(next);
    }
  });
});

// GET /api/shorturl/:id
app.get("/api/shorturl/:id", (req, res, next) => {
  URL.findOne({ short_url: req.params.id }, (err, data) => {
    if (err) next(err);
    data === null
      ? res.json({
          error: "No short url found for given input"
        })
      : res.redirect(`https://${data.original_url}`);
  }).catch(next);
});

// Start server

app.listen(port, function() {
  console.log("Node.js listening ...", port);
});
