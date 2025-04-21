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

// In your app.js
const uploadRouter = require('./uploads');
app.use('/upload', uploadRouter);

/* GET home page. */
app.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

const dbUtils = require('./utils/db');
IMAGE_STORAGE_PATH = '/usr/src/app/images';
app.post('/users', async (req, res) => {
  try {
      const { userID } = req.body;
      await dbUtils.createUserTable(userID);
      console.log('Awaiting user table creation');
      //TODO: Generate filepath to use for new user
      filepath = IMAGE_STORAGE_PATH + '/' + userID;
      const result = await dbUtils.addUser(userID, filepath);
      res.json({ message: 'User created', user: result.rows[0] }); // Combine the responses into one
      console.log('User created');
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});

// Add image to user's table
app.post('/images/:username', async (req, res) => {
  try {
      const { username } = req.params;
      const { fileName, dateTaken, location } = req.body;
      //TODO: Generate filepath to use for new image, and handle conflicts. Return changed filename after conflict handling
      const result = await dbUtils.addImage(username, fileName, dateTaken, location);
      res.json(result.rows[0]);
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});

// Get user's images
app.get('/images/:username', async (req, res) => {
  try {
      const { username } = req.params;
      const result = await dbUtils.getUserImages(username);
      res.json(result.rows);
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});

//TODO: Add GET for single image

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
