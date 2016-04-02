// require express and other modules
var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    hbs = require('hbs'),
    mongoose = require('mongoose'),
    auth = require('./resources/auth');

// require and load dotenv
require('dotenv').load();

// configure bodyParser (for receiving form data)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// serve static files from public folder
app.use(express.static(__dirname + '/public'));

// set view engine to hbs (handlebars)
app.set('view engine', 'hbs');

// connect to mongodb
mongoose.connect('mongodb://localhost/kanban');

// require User and Post models
var User = require('./models/user');
var Goal = require('./models/goal');


/*
 * API Routes
 */

app.get('/api/me', auth.ensureAuthenticated, function (req, res) {
  User.findById(req.user, function (err, user) {
    res.send(user.populate('goals'));
  });
});

app.put('/api/me', auth.ensureAuthenticated, function (req, res) {
  User.findById(req.user, function (err, user) {
    if (!user) {
      return res.status(400).send({ message: 'User not found.' });
    }
    user.firstName = req.body.firstName || user.firstName;
    user.lastName = req.body.lastName || user.lastName;
    user.email = req.body.email || user.email;
    user.save(function(err) {
      res.send(user.populate('goals'));
    });
  });
});

app.get('/api/goals', function (req, res) {
  Goal.find(function (err, allGoals) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(allGoals);
    }
  });
});

app.post('/api/goals', auth.ensureAuthenticated, function (req, res) {
  User.findById(req.user, function (err, user) {
    var newGoal = new Goal(req.body);
    newGoal.save(function (err, savedGoal) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        user.goals.push(newGoal);
        user.save();
        res.json(savedGoal);
      }
    });
  });
});


/*
 * Auth Routes
 */

app.post('/auth/signup', function (req, res) {
  User.findOne({ email: req.body.email }, function (err, existingUser) {
    if (existingUser) {
      return res.status(409).send({ message: 'Email is already taken.' });
    }
    var user = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: req.body.password
    });
    user.save(function (err, result) {
      if (err) {
        res.status(500).send({ message: err.message });
      }
      res.send({ token: auth.createJWT(result) });
    });
  });
});

app.post('/auth/login', function (req, res) {
  User.findOne({ email: req.body.email }, '+password', function (err, user) {
    if (!user) {
      return res.status(401).send({ message: 'Invalid email or password.' });
    }
    user.comparePassword(req.body.password, function (err, isMatch) {
      if (!isMatch) {
        return res.status(401).send({ message: 'Invalid email or password.' });
      }
      res.send({ token: auth.createJWT(user) });
    });
  });
});


/*
 * Catch All Route
 */
app.get('*', function (req, res) {
  res.render('index');
});


/*
 * Listen on localhost:3000
 */
app.listen(9000, function() {
  console.log('server started');
});