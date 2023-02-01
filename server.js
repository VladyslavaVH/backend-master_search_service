import dotenv from "dotenv";
import express from "express";
import fileUpload from "express-fileupload";
import morgan from "morgan";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import {
  getAllJobs,
  getJobsByCategoryName,
  getJobsByTitle,
} from "./database.js";
import errorHandler from "./middleware/errorHandler.js";
import { verifyJWT } from './middleware/verify.js';
import auth from './routes/auth.js';
import publicRoutes from './routes/publicRoutes.js';
import user from './routes/user.js';
import client from './routes/client.js';
import master from './routes/master.js';
import admin from './routes/admin.js';
import conversations from './routes/conversations.js';
import job from './routes/job.js';
import masterInfo from './routes/masterInfo.js';
import jobInfo from './routes/jobInfo.js';
import { Server } from "socket.io";

dotenv.config();
const PORT = process.env.PORT || 5000;
const app = express();

app.use(fileUpload({ createParentPath: true }));

app.use(cors({
    credentials: true,
    origin: process.env.FRONTEND_URL,
    optionsSuccessStatus: 200,
    allowedHeaders: ['authorization', 'Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],    
}));

app.use(morgan('dev'));

app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.json());
app.use(cookieParser());

app.use('/', auth);

//*public routes
app.use('/', publicRoutes);
app.use('/job', jobInfo);
app.use('/master', masterInfo);

//for searchJobs controller
app.get("/jobs", async (req, res) => {
  let obj = {};
  console.log(req.query);
  console.log(req.body);

  if (req.query.category && req.query.title) {
    
  } else if (req.query.title) {
    console.log(req.query.title);
    return res.status(200).send(await getJobsByTitle(req.query.title) || []);
  } else if (req.query.category) {
    console.log(req.query.category);
    return res.status(200).send(await getJobsByCategoryName(req.query.category) || []);    
  } else {

  }
  // res.status(200).json(obj);

  res.status(200).send(await getAllJobs() || []);
});

app.use(verifyJWT);

//todo: create, delete
app.use('/job', job);

//?office
app.use('/user', user);
app.use('/client', client);
app.use('/master', master);
app.use('/admin', admin);

app.use('/conversations', conversations);

app.use(errorHandler);

const server = app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

// const io = new Server(PORT, {
//   cors: {
//     origin: process.env.FRONTEND_URL
//   }
// });

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL
  }
});

let users = [];

const sendUser = (userId, socketId) => {
  !users.some(user => user.userId === userId) &&
    users.push({userId, socketId});
};

const removeUser = (socketId) => {
  users = users.filter(user => user.socketId !== socketId);
}

const  getUser = (userId) => {
  return users.find(user => user.userId === userId);
}

io.on('connection', socket => {
  //connect
  console.log('a user connected');
  io.emit('welcome', 'this server is listening');
  
  socket.on('sendUser', userId => {
    sendUser(userId, socket.id);
    io.emit('getUsers', users);
  })

  //send and get message 
  socket.on('sendMessage', ({ senderFK, receiverFK, message, avatar }) => {
    console.log('inside sendMessage');
    console.log(senderFK, receiverFK, message, avatar);
    const user = getUser(receiverFK);
    io.to(user?.socketId).emit('getMessage', {
      senderFK,
      receiverFK,
      message,
      avatar
    })
  });

  //disconnect
  socket.on('disconnect', () => {
    console.log('a user disconnected');
    removeUser(socket.id);
    io.emit('getUsers', users);
  });
  console.log(users);
  //console.log(socket.id);//Conversations 
})
