const express = require('express')
const app = express()
app.use(express.urlencoded({ extended: true }))
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()
const {Schema, model} = require('mongoose')




app.use(cors())
app.use(express.static('public'))


const dbURI = process.env.MONGO_URI;
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB:', err));


const UserSchema = new mongoose.Schema({
  username: { type: String, required: true}
});


const ExerciseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

const User = model('User', UserSchema);
const Exercise = model('Exercise', ExerciseSchema);





app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', (req, res) => {
  let username = req.body.username;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }
  const user = new User({ username });
 user.save()
  .then((savedUser) => {
    res.status(201).json({
      username: savedUser.username,
      _id: savedUser._id
    });
  })
  .catch(err => res.status(500).json({ error: 'Failed to create user' }));


  
});

app.get('/api/users', async (req, res) => {
    const users =  await User.find({}, { username: 1, _id: 1 })
    res.json(users)
});

app.post('/api/users/:_id/exercises', async (req, res) => {
  const userId = req.params._id;
  const { duration, description, date } = req.body;

  if (!description || !duration) {
    return res.status(400).json({ error: 'Description and duration are required.' });
  }

  const logDate = date ? new Date(date) : new Date();

  try {
    // Find user to get username
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const exercise = new Exercise({
      userId,
      description,
      duration,
      date: logDate
    });

    const savedExercise = await exercise.save();

    res.status(201).json({
      _id: user._id,
      username: user.username,
      description: savedExercise.description,
      duration: savedExercise.duration,
      date: savedExercise.date.toDateString()
    });
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong while saving exercise log.' });
  }
});

app.get('/api/users/:_id/logs', async (req, res) => {
  const { from, to, limit } = req.query;
  const userId = req.params._id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let filter = { userId };

    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    const query = Exercise.find(filter).select('description duration date');
    if (limit) {
      query.limit(parseInt(limit));
    }

    const exercises = await query.exec();

    const log = exercises.map(ex => ({
      description: ex.description,
      duration: ex.duration,
      date: ex.date.toDateString()
    }));

    res.json({
      _id: user._id,
      username: user.username,
      count: log.length,
      log
    });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching logs' });
  }
});





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
