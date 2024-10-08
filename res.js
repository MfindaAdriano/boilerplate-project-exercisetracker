//import libraries
const mongoose = require('mongoose');
// MongoDB configurations
//create UserSchema e UserModel
const UserSchema = new mongoose.Schema({username: String});
const UserModel = mongoose.model("users", UserSchema);

const ExerciseSchema = new mongoose.Schema({username: String, description: String, duration: Number, date: Date, user_id: String});
const ExerciseModel = mongoose.model("exercises", ExerciseSchema);

//functions are defined here

//function to create a new user
const createUser = async (req, res) => {
    console.log(req.body.username);
    const userName = req.body.username;

    
    if(userName !== ""){ //if name text is not empty

        const newUser = new UserModel({username:userName});
        await newUser.save();
        //now get the document we just saved to the DB
        newUserData = await UserModel.find({"username": userName});
        
        // print data related to the new user in the DB
        //console.log(newUserData);
        res.json(newUserData[0]);
    }
    

}
// end of function to create a new user

//function to get all the users in the database
const getAllUsers = async (req, res) => {
    allUsers = await UserModel.find();
    res.json(allUsers);
    //console.log(allUsers);

}
// end of function to get all users

// function to post exercise
const postExercise = async (req, res) => {
    const userId = req.params._id;
    const description = req.body.description;
    const duration = parseInt(req.body.duration);

    const reg = /^\d{4}-\d{2}-\d{2}$/;
    const date = (req.body.date === "")?(new Date()):reg.test(req.body.date)?(new Date(req.body.date)):new Date();
    
    
    const user = await UserModel.find({_id: userId});

    if(user[0]){
        const userName = user[0].username;

        const exercise = new ExerciseModel({username: userName, description: description, duration: duration, date: date, user_id: userId})

        // save the new exercise to the Database
        await exercise.save();

        // get the exercise we just saved
        const userExercises = await ExerciseModel.find({user_id: userId});
        const newExercise = userExercises[userExercises.length - 1];

        // object to render
        const objectToRender = {username: newExercise.username, description: newExercise.description, duration: newExercise.duration, date: newExercise.date.toDateString(), _id: newExercise.user_id}

        //render the result
        res.json(objectToRender)
        //console.log(objectToRender)

        //console.log(newExercise);

        //console.log({username: userName, description: description, duration:duration, date: date, _id: userId});
    }//else{console.log("The user does not exist!");}
    //console.log("You Name: ", req.params._id);
}
// end of function to post exercise

// function to retrieve the full exercise log of any user
const getUserLog = async (req, res) => {

    const userId = req.params._id;
    let userExercises;
    
    if(req.query.from === undefined)
        userExercises = await ExerciseModel.find({user_id: userId}).sort({date: 1});
    else{
        userExercises = await ExerciseModel.find({
            $and:[
                {user_id: userId},
                {date:{$lte: new Date(req.query.from)}},
                {date: {$gte: new Date(req.query.to)}}
            ]
        }).limit(parseInt(req.query.limit)).sort({date: 1});;
    }

    if(userExercises[0]){
        //const userName = user[0].username;

        // get the array of exercises objects
        //const userExercises = await ExerciseModel.find({user_id: userId});
        const newExercise = userExercises[userExercises.length - 1];

        const log = userExercises.map((obj, i, ar) => ({description: obj.description, duration: obj.duration, date: obj.date.toDateString()}) );
        // object to render
        const objectToRender = {username: newExercise.username, count: userExercises.length, _id: newExercise.user_id, log: log};

        //render the result
        console.log(objectToRender)
        res.send(objectToRender)
       
    }//else{console.log("The user does not exist!");}
}



/***************** */
const getUserLog1 = async (req, res) => {
    try{
    console.log(req.params);
    console.log(req.query);
    let user = await UserModel.findById(req.params._id).exec();
    let exercise = await ExerciseModel.find({user_id : req.params._id})
    .select('-_id -__v -user_id')
    .exec();

    if(typeof user.username !== 'undefined' && exercise.length > 0){
      
        if((req.query.from) && (req.query.to)){
          exercise = exercise.filter((d)=> (Date.parse(d.date) >= Date.parse(req.query.from)) && (Date.parse(d.date) <= Date.parse(req.query.to)));
              }
              //check if index is smaller then LIMIT
              if(req.query.limit){
                let limit = parseInt(req.query.limit)
                exercise = exercise.filter((d,i)=> i < limit);
              }
        var data = {
          username: user.username,
          count: parseInt(exercise.length),
          _id: user._id
        }
        for(i = 0; i < exercise.length; i++ ){
          var date_obj = new Date(exercise[i]['date']);
          let description = exercise[i]['description'];
          let duration = exercise[i]['duration'];
          
          exercise[i] = {};
          exercise[i]['description'] = description;
          exercise[i]['duration'] = parseInt(duration);
          exercise[i]['date'] = date_obj.toDateString();
        }
          data['log'] = exercise;
        if(exercise.length > 0){
          res.json(data);
        }else{
           res.json({error:'User exercise found'});
        }
      }else{
        res.json({error:'User Id not found'});
      }


    }catch(err){
        console.log(err)
    }
}
/**************** */

//import 
module.exports = {mongoose, createUser, getAllUsers, postExercise, getUserLog, getUserLog1};