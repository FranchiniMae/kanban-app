var mongoose = require('mongoose'),
		Schema = mongoose.Schema;

var taskSchema = new Schema({
	description: { type: String },
	completed: { type: Boolean }
});

var Task = mongoose.model('Task', goalSchema);
module.exports = Task;