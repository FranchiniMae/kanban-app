var mongoose = require('mongoose'),
		Schema = mongoose.Schema;

var goalSchema = new Schema({
	title: { type: String },
	startDate: { type: Date },
	endDate: { type: Date },
	goalDate: { type: Date },
	tasks: [{ type: Schema.Types.ObjectId, ref: 'Task'}]
});

var Goal = mongoose.model('Goal', goalSchema);
module.exports = Goal;