var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');

var app = express();

// var axios = require('axios');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const uploadRouter = require('./uploads');
app.use('/upload', uploadRouter);
const downloadRouter = require('./downloads');
app.use('/download', downloadRouter);

/* GET home page. */
app.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});



module.exports = app;
