var mongoose = require('mongoose'),
		Schema = mongoose.Schema;

var taskSchema = new Schema({
	description: { type: String },
	completed: { type: Boolean }
});

var goalSchema = new Schema({
	title: { type: String },
	startDate: { type: Date },
	endDate: { type: Date },
	goalDate: { type: Date },
	tasks: [taskSchema]
});

var Goal = mongoose.model('Goal', goalSchema);
var Task = mongoose.model('Task', taskSchema);
module.exports = Goal;