import dotenv from "dotenv";
import express from "express";
import fileUpload from "express-fileupload";
import morgan from "morgan";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
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
import jobs from './routes/jobs.js';
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

app.use('/api/', auth);

//*public routes
app.use('/api/', publicRoutes);
app.use('/api/job', jobInfo);
app.use('/api/master', masterInfo);

app.use(verifyJWT);

//for searchJobs controller
app.use('/api/jobs', jobs);

//todo: create, delete
app.use('/api/job', job);

//?office
app.use('/api/user', user);
app.use('/api/client', client);
app.use('/api/master', master);
app.use('/api/admin', admin);

app.use('/api/conversations', conversations);

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
  const newUser = { userId, socketId };
  if (!users.some(user => user.userId === userId)) {
    users.push(newUser);
  } else {
    let tmp = users?.filter(user => user.userId !== userId);
    tmp.push(newUser);

    users = tmp;
  }
    
};

const checkUserStatus = userId => {
  if (users.find(user => user.userId === userId)) {
    return userId;
  } else {
    return null;
  }
};

const removeUser = (socketId) => {
  users = users.filter(user => user.socketId !== socketId);
}

const  getUser = (userId) => {
  return users.find(user => user.userId === userId);
}

const  getUserBySocketId = (socketId) => {
  return users.find(user => user.socketId === socketId);
}

io.on('connection', socket => {
  //connect
  console.log('a user connected');
  io.emit('welcome', 'this server is listening');
  
  socket.on('sendUser', userId => {
    sendUser(userId, socket.id);
    io.emit('getUsers', users);
    console.log(users);
  })

  socket.on('checkUserStatus', userId => {
    io.emit('isOnline', checkUserStatus(userId));
  });

  socket.on('typing', ({ receiverId, typing }) => {
    const user = getUser(receiverId);
    if (user) {
      if (user.socketId) {
        io.to(user.socketId).emit("displayTyping", typing);
      }
    } else console.log('typing: user is undefined');
  });

  //send and get message 
  socket.on('sendMessage', ({ senderFK, senderFullName, receiverFK, message, avatar }) => {
    const user = getUser(receiverFK);
    if (user) {
      if (user.socketId) {
        io.to(user.socketId).emit("getMessage", {
          senderFK,
          senderFullName,
          receiverFK,
          message,
          avatar,
        });
      }
    } else console.log('user is undefined');
  });

  //disconnect
  socket.on('logOut', () => {
    console.log('a user disconnected');
    removeUser(socket.id);
    io.emit('getUsers', users);
  });
})
