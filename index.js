const express = require('express')
const app = express()
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
    .then(() => res.status(201).json({ message: 'User created successfully' }))
    .catch(err => res.status(500).json({ error: 'Failed to create user' }));

  res.json({
    username: user.username,
    _id: user._id
  });
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
