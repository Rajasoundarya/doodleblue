const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const Bcrypt = require("bcryptjs");

const cors= require('cors');
const { MongoClient, ObjectID } = require('mongodb');
const PORT = 4000;
const url = 'mongodb://localhost:27017';
const dbName = 'MyFirstApp';
app.use(cors());
app.use(bodyParser.json());


app.post('/auth/login', (req,res)=>{

    const { email, password } = req.body;

    (async function getUser(){
      let client;
      try {
        client = await MongoClient.connect(url);
        console.log('Connected Successfully to the SERVER!!!');

        const db = client.db(dbName);

        const col  = await db.collection('users');

        const userResult = await col.findOne({ email: email });
        console.log(userResult);
        if(!userResult) {
            return res.status(400).send({ message: "The username does not exist" });
        }
        if(!Bcrypt.compareSync(password, userResult.password)) {
            return res.status(400).send({ message: "The password is invalid" });
        }
        jwt.sign({user: userResult}, 'mySecretKey', (err, token)=>{
          res.json({
            token,
            userResult,
            "message":"The username and password combination is correct!"
          });
        });

      }catch(err){
        console.log(err.stack);
        res.status(500).send(error);
      }
      client.close();
    }())
})

app.post('/auth/signup', (req,res)=>{
  req.body.password = Bcrypt.hashSync(req.body.password, 10);
  const { email, password, name, mobile, roleId} = req.body;
  console.log(req.body);
  (async function addUser(){
    let client;
    try {
      client = await MongoClient.connect(url);
      console.log('Connected Successfully to the SERVER!!!');

      const db = client.db(dbName);

      const col  = await db.collection('users');
      const user = {email, password, name, mobile, roleId};
      const results = await col.insertOne(user);
      console.log(results);
      if(results.ops[0]){
        res.send({"success": "The user is created successfully"});
      }
    }catch(err){
      console.log(err.stack);
      res.send({"message": "Creating user failed! Please contact your admin"});
    }
    client.close();
  }())
})

function verifyToken(req, res, next){
  const bearerHeader = req.headers['authorization'];
  if(typeof bearerHeader !== 'undefined'){
    //split at space
    const bearer = bearerHeader.split(' ');
    const bearerToken = bearer[1];
    req.token = bearerToken;
    next();
  }else{
    //forbidden
    res.sendStatus(403);
    //res.json({"message":"forbidden"});
  }
}

app.listen(PORT, ()=>{
  console.log('SERVER IS RUNNING !!');
})
