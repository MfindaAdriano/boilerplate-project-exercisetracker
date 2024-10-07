//dotenv configuration
require('dotenv').config();
const express = require('express')
const app = express()
const mongoose = require('mongoose')
const cors = require('cors')
//require('dotenv').config()

//app.use(cors())
app.use(cors({
  optionsSuccessStatus: 200 
}));
app.use(express.static('public'));
app.use(express.urlencoded({extended: false}));
app.use(express.json());

//Database config
//connect mongoose database
mongoose.connect(process.env.DB_HOST)
  .then(() => console.log("DB connected with success!"))
  .catch((error) => console.log(`Error to connect the DB: ${error}`));

//create UserSchema e UserModel
const UserSchema = new mongoose.Schema({username: String});
const UserModel = mongoose.model("users", UserSchema);

//create ExerciseSchema e ExerciseModel
const ExerciseSchema = new mongoose.Schema({username: String, description: String, duration: Number, date: Date, id_user: String});
const ExerciseModel = mongoose.model("exercises", ExerciseSchema);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//Adding new user if he does not exist yet
app.post('/api/users', async (req, res) => {
  const username = req.body.username;
  
  //check if user already exists in the DB
  let userData = await UserModel.findOne({username: username});

  //if user does not exist in the DB
  if(!userData){
    const newUser = new UserModel({username:username});
    //save the user to the DB
    userData = await newUser.save()
    .then(() => console.log("user saved successfully!"))
    .catch((error) => console.log(`Failed to save the user data: ${error}`));

    //Now get the user just saved data from the DB
    userData = await UserModel.findOne({username: username}); 
    res.json({username: userData.username, _id: userData._id});
  }else{
    //Now get the userdata from the DB
    userData = await UserModel.findOne({username: username}); 
    res.send({username: userData.username, _id: userData._id});
    //res.send("The User already exists");
  }
  
});

//getting users data array
app.get("/api/users", async (req, res) => {
  const users = await UserModel.find();

  const users1 = users.map((el,i,ar) => ({username:el.username, _id:el._id}));

  res.send(users1);
});

// Post an exercise using a user _id
app.post("/api/users/:_id/exercises", async (req, res) =>{
  console.log("Empty params");

  const ID = req.params._id;
  const userData = await UserModel.findById(ID);
  let newInputData;
  //const userData = await UserModel.findOne({_id: "66fb8eb1a003388d8ffbd5f0"});
  
  //res.send(req.body);

  //if a user with the provided _id does exist
  if(userData){

    const date = (req.body.date === "")?new Date(): new Date(req.body.date);
  
    newInputData = {username: userData.username, description: req.body.description, duration: (req.body.duration), date: date, id_user: ID};

    const newExercise = new ExerciseModel(newInputData);

    //res.send(userData);
    //res.send(req.body);

    // let save the new user exercise to exercise collection in DB
    await newExercise.save()
      .then(() => console.log("New exercise sent successfully into the Database!"))
      .catch((error) => console.error(`An Error occurred while trying to save the new exercise into DB:\n${error}`));

    
    newInputData = {username: userData.username, _id: ID, description: req.body.description, duration: req.body.duration, date: date.toDateString()};
    // render the data
    res.send(newInputData);

  }else{ // there is no user with the provided id
    //const exerciseData = ExerciseModel.find({id_user: ID});
    res.send(`The User with this _id does not exists`);
  }
  
}) // end of app.post("/api/users/:_id/exercises") route code

// get route for retrieving a full exercise log of any user based on his _id
app.get("/api/users/:_id/logs", async (req, res) => {
  const reqQuery = req.query;
  const ID = req.params._id;
  let userData;

  console.log(req.query);
  //console.log(ID);

  if(req.query.from){
    userData = await ExerciseModel.find({
      $and:[
        {id_user:{$eq:ID}},
        //{username:"Mfinda Adriano"},
        {date: {$gte: new Date(req.query.from)}},
        {date: {$lte: new Date(req.query.to)}},
        //{description: "First test for the user Mfinda"},  
      ]
        
      }
    ).limit(parseInt(req.query.limit));
  }else{
    userData = await ExerciseModel.find({id_user:ID});
  }
  



  let logArray;
  let userLog;

  if(userData[0]){
    logArray = userData.map((ob, i, ar) => ({
      description: ob.description,
      duration: ob.duration,
      date: ob.date.toDateString()
      })
    );
  
    
    userLog = {
      username: userData[0].username,
      count: userData.length,
      _id: userData[0].id_user,
      log: logArray,
    }
  
    //res.send("User ID: " + ID);
    //res.send(userData);
    //res.send(logArray);
    //res.send(reqQuery.limit);
    //res.send((new Date(req.query.from).getTime() * 2).toString()); //userData[0].date);
  
    //render full exercise log of this user
    res.send(userLog);
  }else{

    const userLog = {
      username: "",
      _id: ID,
      count: 0,
      log: [],
    }
    //res.send("No Data: ");
    res.json(userLog);
  }
  
})


const listener = app.listen(process.env.PORT, () => {
  console.log('Your app is listening on port ' + JSON.stringify(listener.address()))
})
