// require express and other modules
var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    hbs = require('hbs'),
    mongoose = require('mongoose'),
    auth = require('./resources/auth');
    path = require('path');

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
var Task = require('./models/goal');


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

app.delete('/api/goals/:id', function (req, res) {
  var id = req.params.id;
  console.log(id);
  Goal.findOneAndRemove({_id: id}, function(err, deletedGoal) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(deletedGoal);
    }
  });
});

app.post('/api/goals', auth.ensureAuthenticated, function (req, res) {
  User.findById(req.user, function (err, user) {
    var newGoal = new Goal(req.body);
    newGoal.save(function (err, savedGoal) {
      console.log('newGoal', newGoal);
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

app.get('/api/goals/:id', function (req, res){
  var id = req.params.id;
  Goal.findById({_id: id}, function (err, goal) {
    if (err) console.log(err);
    // res.json(goal);
    res.send(goal.populate('tasks'));
  });
});

app.post('/api/goals/:id/tasks', auth.ensureAuthenticated, function (req, res, next) {
  var id = req.params.id;
  var description = req.body.description;

  Goal.findById({_id: id}, function (err, goal) {
      if (err) console.log(err);
      goal.tasks.push({description: description});
      goal.save(function (err, savedTask) {
        if (err) console.log(err);
        res.json(savedTask);
      });
  });

});

app.delete('/api/goals/:id/tasks/:tid', function (req, res) {
  var goalId = req.params.id;
  console.log('goalId', goalId);
  var taskId = req.params.tid;
  console.log('tid', taskId);
  Goal.findByIdAndUpdate({_id: goalId}, {
    $pull: {
      tasks: {_id: taskId}
    }
  }, function (err, deletedTask) {
    if (err) console.log(err);
    res.json(deletedTask);
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
app.listen(3000, function() {
  console.log('connected to port 3000');
});