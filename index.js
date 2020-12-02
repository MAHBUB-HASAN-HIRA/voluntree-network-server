const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
require('dotenv').config();
const admin = require("firebase-admin");

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const dbInfo = {
    DB_USER: process.env.DB_USER,
    DB_PASS: process.env.DB_PASS,
    DB_NAME: process.env.DB_NAME,
};

    const serviceAccount = require("./volunteer-network-101-firebase-adminsdk-hm813-c369abccc4.json");
    admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://volunteer-network-101.firebaseio.com"
    });


const uri = `mongodb+srv://${dbInfo.DB_USER}:${dbInfo.DB_PASS}@volunteer-network.lgd2r.mongodb.net/${dbInfo.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


client.connect(err => {
  const all_tasks = client.db(`${dbInfo.DB_NAME}`).collection('all-tasks');
  const register_user = client.db(`${dbInfo.DB_NAME}`).collection('register-user');

const handleTokenEmail = token => {
    if(token && token.startsWith('Bearer ')){
        const idToken = token.split(' ')[1];
        return admin.auth().verifyIdToken(idToken)
        .then(decodedToken => decodedToken.email);
    };
};


//get all_tasks from database
    app.get('/alltasks', (req, res) => {
        all_tasks.find()
        .toArray((err, documents) => {
            if(documents){
                res.send(documents);
            }
        });
    });

//post task by admin
    app.post('/singleTask', (req, res) =>{
        const queryEmail = req.query.email;
        const tokenEmail = handleTokenEmail(req.headers.authorization);
        tokenEmail.then(decodeEmail => {
            if(queryEmail === decodeEmail){
                all_tasks.insertOne(req.body)
                .then(result => {
                    if(result){
                        res.send(result.insertedCount > 0);
                    }   
                });
            };
        });
    });

//post single registered volunteer data to database
    app.post('/register-user', (req, res) =>{
        const queryEmail = req.query.email;
        const tokenEmail = handleTokenEmail(req.headers.authorization);
        tokenEmail.then(decodeEmail => {
            if(queryEmail === decodeEmail){
                register_user.insertOne(req.body)
                .then(result => {
                    if(result){
                        res.send(result.insertedCount > 0);
                    }
                });
            };
        });
    });

//get registered Volunteer from database with pacific email
    app.get('/register-user', (req, res) => {
        const queryEmail = req.query.email;
        const tokenEmail = handleTokenEmail(req.headers.authorization);
        tokenEmail.then(decodeEmail => {
            if(queryEmail === decodeEmail){
                register_user.find({"registerData.email": queryEmail})
                .toArray((err, documents) => {
                    if(documents){
                        res.status(200).send(documents);
                    }
                });
            }
            else{
                res.status(401).send('un authorized access');
            }
        });   
    });

//delete registered volunteer from database
    app.delete('/delete/:id', (req, res) => {
        const queryEmail = req.body.email;
        const tokenEmail = handleTokenEmail(req.headers.authorization);
        tokenEmail.then(decodeEmail => {
            if(queryEmail === decodeEmail){
                register_user.deleteOne({_id: ObjectID(req.params.id)})
                .then((documents) =>{
                    res.send(documents.deletedCount > 0);
                });
            };
        }); 
    });


//get registered Volunteer from database
    app.get('/register-user/admin', (req, res) => {
        const queryEmail = req.query.email;
        const tokenEmail = handleTokenEmail(req.headers.authorization);
        tokenEmail.then(decodeEmail => {
            if(queryEmail === decodeEmail){
                register_user.find({})
                .toArray((err, documents) => {
                    if(documents){
                        res.send(documents);
                    }
                });
            };
        }); 
    });



});

app.get('/', (req, res) => {
    res.send('Hello World. Love From Mahbub')
});

  
  app.listen(process.env.PORT || 4200);