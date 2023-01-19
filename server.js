import path, { dirname } from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import dotenv from "dotenv";
import fs from "fs";
import express from "express";
import fileUpload from "express-fileupload";
import morgan from "morgan";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import {
  createDefaultMaster,
  createUser,
  createJob,
  getJobsMastersCount,
  getPopularCategories,
  getRecentJobs,
  getHighestRatedMasters,
  findUser,
  findUserByPhone,
  updateRefreshToken,
  getUserByRefreshToken,
  deleteRefreshToken,
  checkRefreshToken,
  getAllJobs,
  getJobsByCategoryName,
  getJobsByTitle,
  getOptionCategories,
  getJobListingByClient,
  getJobById,
  getJobPhotos,
  getAllCandidatesByClient,
  getAllMasters,
  getMasterById,
  getCommentsByMasterId,
  getCategoriesByMasterId,
  getRehiredJobCount,
  getAllMastersRating,
  deleteJob,
  deleteJobCandidate,
  confirmCandidate,
  updateAvatar
} from "./database.js";
import { logger } from "./middleware/logEvents.js";
import errorHandler from "./middleware/errorHandler.js";
import ROLE from "./config/roles.js";
import { verifyJWT, verifyRole } from './middleware/verify.js';
import filesPayloadExists from './middleware/filesPayloadExists.js';
import fileExtLimiter from './middleware/fileExtLimiter.js';
import fileSizeLimiter from './middleware/fileSizeLimiter.js';

dotenv.config();
const PORT = process.env.PORT || 5000;
const app = express();

// custom middleware logger
//app.use(logger);

app.use(fileUpload({
  createParentPath: true,
}));

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL);

  res.header(
    "Access-Control-Allow-Methods",
    "GET POST PUT DELETE OPTIONS PATCH HEAD"
  );

  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );

  next();
});

app.use(cors({
    credentials: true,
    origin: process.env.FRONTEND_URL,
    optionsSuccessStatus: 200
}));

app.use(morgan('dev'));

app.use(express.urlencoded({ extended: true }));

app.use(express.json());

app.use(cookieParser());

app.post("/register", async (req, res) => {
  const { accountType, firstName, lastName, phone, password } = req.body;

  if (!accountType || !firstName || !lastName || !phone || !password) return res.status(400)
  .json({"message": "accountType, firstName, lastName, phone, password are required"});

  //check for duplicate user by phone
  //const duplicate = await select ...
  //if (duplicate) return res.status(409); //Conflict

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    if (accountType == "master") {
      createDefaultMaster( firstName, lastName, phone, hashedPassword );
    } else {
      createUser( firstName, lastName, phone, hashedPassword );
    }

    res.status(201).json({ "success": `New user ${firstName} ${lastName} created!` });
  } catch ({ message }) {
    res.status(500).json({ "message": message });
  }
});

app.post("/login", async (req, res) => {
  const cookies = req.cookies;
  const { phone, password } = req.body;
  if (!phone || !password) return res.status(400)
  .json({"message": "phone, password are required"});

  let user1 = await findUserByPhone(phone);
  if (!user1) return res.sendStatus(401); //Unauthorized  

  try {    
      if (await bcrypt.compare(password, user1.password)) {
        const role = user1.role;

        //const accessToken = jwt.sign(user1, process.env.ACCESS_TOKEN_SECRET);
        const accessToken = jwt.sign(
          {
              "userInfo": { 
                "user": {
                  "id": user1.id,
                  "firstName": user1.firstName, 
                  "lastName": user1.lastName, 
                  "avatar": user1.avatar,
                  "phone": user1.phone,
                  "email": user1.email,
                  "isEmailVerified": user1.isEmailVerified,
                },
                "role": role
            }
          }, 
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "15m" }//in production 15 min = 900s
        );

        const newRefreshToken = jwt.sign(
          {
            "userInfo": { 
              "user": {
                "id": user1.id,
                "firstName": user1.firstName, 
                "lastName": user1.lastName, 
                "avatar": user1.avatar,
                "phone": user1.phone,
                "email": user1.email,
                "isEmailVerified": user1.isEmailVerified,
              },
              "role": role
          }
          }, 
          process.env.REFRESH_TOKEN_SECRET,
          { expiresIn: "1d" }
        );

        if (cookies['jwt'] != 0 || cookies['jwt'] != undefined) {
          console.log('refresh token', cookies['jwt']);
          const refreshToken = cookies['jwt'];

          if (refreshToken) {            
            const foundToken = await checkRefreshToken(refreshToken);//problem with sault?, when compared
            
            //Detected refresh token reuse!
            if (!foundToken) {
              console.log('attempted refresh token reuse at login');//?
            }
          }
            
          res.clearCookie("jwt", { 
            httpOnly: true, 
            sameSite: false, //in production mode maybe true ?
            //sameSite: 'none', //in production -> strict
          //secure: true, //in production only service on https
          });
        }

        updateRefreshToken(user1.id, newRefreshToken);

        //Create Secure Cookie with refresh token
        res.cookie('jwt', newRefreshToken, { 
          httpOnly: true, 
          sameSite: false, //in production mode maybe true ?
          //sameSite: 'none', //in production -> strict
          //secure: true, //in production only service on https
          maxAge: 24 * 60 * 60 * 1000
        });

        res.json({ accessToken });
        
      } else {
        res.sendStatus(401); //Unauthorized
      }
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

app.get("/refresh", async (req, res) => {
  const refreshToken = req.cookies["jwt"];
  if (!refreshToken) return res.sendStatus(401);

  res.clearCookie("jwt", { 
    httpOnly: true, 
    sameSite: false, //in production mode maybe true ?
    //sameSite: 'none',//in production -> strict
  //secure: true, //in production only service on https
  });  

  //const foundUser = await getUserByRefreshToken(refreshToken);//problem with sault
  const foundUser = await jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
    if (err) return res.sendStatus(403); // Forbidden
    
    // deleteRefreshToken(refreshToken);//same problem
    return decoded.userInfo.user.id;
  }).then(async (id) => await findUser(id));

  //Detected refresh token reuse!
  if (!foundUser) {
    // deleteRefreshToken(refreshToken);//same problem
    return res.sendStatus(403); //Forbidden
  }

  //evaluate jwt
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      deleteRefreshToken(refreshToken);
    }

    if (err 
      || (foundUser.id !== decoded.userInfo.user.id) 
      || (foundUser.firstName !== decoded.userInfo.user.firstName) 
      || (foundUser.lastName !== decoded.userInfo.user.lastName)) 
      return res.sendStatus(403);
    
    //Refresh token was still valid
    const role = foundUser.role;
    const accessToken = jwt.sign(
      {
        "userInfo": { 
          "user": {
            "id": decoded.userInfo.user.id,
            "firstName": decoded.userInfo.user.firstName, 
            "lastName": decoded.userInfo.user.lastName, 
            "avatar": decoded.userInfo.user.avatar,
            "phone": decoded.userInfo.user.phone,
            "email": decoded.userInfo.user.email,
            "isEmailVerified": decoded.userInfo.user.isEmailVerified,
          },
          "role": role
        }
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }//in production 15 min = 900s
    );

    const newRefreshToken = jwt.sign(
      {
        "userInfo": { 
          "user": {
            "id": foundUser.id,
            "firstName": foundUser.firstName, 
            "lastName": foundUser.lastName, 
            "avatar": foundUser.avatar,
            "phone": foundUser.phone,
            "email": foundUser.email,
            "isEmailVerified": foundUser.isEmailVerified,
          },
          "role": role
        }
      }, 
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    //Saving refresh token with current user
    updateRefreshToken(foundUser.id, newRefreshToken);

      //Create Secure Cookie with refresh token
      res.cookie('jwt', newRefreshToken, { 
      httpOnly: true, 
      sameSite: false, //in production mode maybe true ?
      //sameSite: 'none', //in production -> strict
      //secure: true, //in production only service on https
      maxAge: 24 * 60 * 60 * 1000
    });
    
    res.json({ accessToken });
  });
});

app.delete("/logout", async (req, res) => {
  const refreshToken = req.cookies["jwt"];
  if (!refreshToken) return res.sendStatus(204); //No content

  //Is refresh token in db?
  const foundUser = await getUserByRefreshToken(refreshToken);
  if (!foundUser) {
    res.clearCookie("jwt", { 
      httpOnly: true, 
      sameSite: false, //in production mode maybe true ?
      //sameSite: 'none',//in production -> strict
    //secure: true, //in production only service on https
  });
    return res.sendStatus(204);
  }

  //On client, also delete the token
  deleteRefreshToken(refreshToken); 
  res.clearCookie("jwt", { 
    httpOnly: true, 
    sameSite: false, //in production mode maybe true ?
    //sameSite: 'none', //in production -> strict
  //secure: true, //in production only service on https
  });
  res.sendStatus(204);
});

//public
app.get("/master", async (req, res) => {
  res.status(200).send(await getMasterById(req.query.userId) || {});
});

app.get("/master/comments", async (req, res) => {
  res.status(200).send(await getCommentsByMasterId(req.query.masterId) || []);
});

app.get("/master/categories", async (req, res) => {
  res.status(200).send(await getCategoriesByMasterId(req.query.masterId) || []);
});

app.get("/master/rehired/job/count", async (req, res) => {
  res.status(200).send(await getRehiredJobCount(req.query.masterId) || { rehired: 0 });
});

app.get("/masters/ratings", async (req, res) => {
  res.status(200).send(await getAllMastersRating() || []);
});

app.get("/jobs/masters/count", async (req, res) => {
  res.status(200).send(await getJobsMastersCount() || { jobsCount: 0, mastersCount: 0 });
});

app.get("/popular/categories", async (req, res) => {
  res.status(200).send(await getPopularCategories() || []);
});

app.get("/option/categories", async (req, res) => {
  res.status(200).send(await getOptionCategories() || []);
});

app.get("/recent/jobs", async (req, res) => {
  res.status(200).send(await getRecentJobs() || []);
});

app.get("/jobs/masters/highestRated", async (req, res) => {
  res.status(200).send(await getHighestRatedMasters() || []);
});

app.get("/all/masters", async (req, res) => {
  res.status(200).send(await getAllMasters() || []);
});

// app.get("/jobs/:category", async (req, res) => {
//   res.status(200).send(await getJobsByCategoryName(req.params.category) || []);
// });

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

app.get("/job", async (req, res) => {
  res.status(200).send(await getJobById(req.query.jobId) || {});
});

app.get("/job/photos", async (req, res) => {
  res.status(200).send(await getJobPhotos(req.query.jobId) || []);
});

app.get("/faqs", async (req, res) => {
  res.status(200).send(JSON.parse(fs.readFileSync('faqs.json')) || []);
});

app.use(verifyJWT);

app.post("/create/job",
  filesPayloadExists,
  fileExtLimiter(['.png', '.jpg', '.jpeg']),
  fileSizeLimiter,
  async (req, res) => {
  try {
    let photosNameArr = [];

    //upload photos
    if(!req.files) {
      //return res.status(200).json({ msg: 'no files' });
      console.log('no files');
    } else {
      const photos = req.files;

      Object.keys(photos).forEach(key => {
        const filepath = path.join(__dirname, '../client/public/jobPhotos', photos[key].name);
        
        photos[key].mv(filepath, err => {
          if (err) {
            console.log(err);
            return res.status(500).json({ status: 'error', msg: err });
          }          
        });

        photosNameArr.push(photos[key].name);
      });   
    }

    //create job in database
    const jobData = req.body;
    createJob(
      jobData.clientFK, 
      jobData.title, 
      jobData.categoryFK, 
      jobData.lat, 
      jobData.lng, 
      jobData.minPayment, 
      jobData.maxPayment, 
      jobData.jobDateTime, 
      jobData.description, 
      photosNameArr);

  } catch (error) {
    console.log(error);
  }

  res.status(200).json({success: 'success'});
});

app.delete('/job', async (req, res) => {
  const photos = await getJobPhotos(req.query.jobId);
  let filepath = ''; 
  if (photos && photos.length > 0) {
    for (const p of photos) {
      filepath = path.join(__dirname, '../client/public/jobPhotos', p.photo);
      fs.unlinkSync(filepath, err => {
        if(err) {
          console.log(err);
          return res.status(500).json({ status: 'error', msg: err });
        };
        console.log('photo deleted successfully');
      });
      console.log(filepath);
    }
  }

  res.status(200).send(await deleteJob(req.query.jobId) || {});
});

app.get("/client/job/listing", verifyRole(ROLE.CLIENT), async (req, res) => {
  res.status(200).send(await getJobListingByClient(req.user.id) || { jobs: [], candidates: [] });
});

app.get("/client/job/candidates", verifyRole(ROLE.CLIENT), async (req, res) => {
  res.status(200).send(await getAllCandidatesByClient(req.user.id) || []);
});

app.delete('/client/job/candidate', async (req, res) => {
  try {
    if (!req.query.jobId || !req.body.masterId) return res.sendStatus(400);

    res.status(200)
    .send(await deleteJobCandidate(req.query.jobId, req.body.masterId) || {});
  } catch (error) {
    res.sendStatus(400);
  }
});

app.put('/client/job/candidate', async (req, res) => {
  try {
    if (!req.query.jobId || !req.body.masterId) return res.sendStatus(400);
    console.log(req.query.jobId,req.body.masterId);

    res.status(200)
    .send(await confirmCandidate(req.query.jobId, req.body.masterId) || {});

    
  } catch (error) {
    res.sendStatus(400);
  }
});

app.post('/user/change/avatar',
filesPayloadExists,
fileExtLimiter(['.png', '.jpg', '.jpeg']),
fileSizeLimiter,
async (req, res) => {
  try {
    let avatarName = '';
    
    //upload photo
    if(!req.files) {
      console.log('no new avatar');
      return res.sendStatus(400);
    } else {
      Object.keys(req.files).forEach(key => {
        const filepath = path.join(__dirname, '../client/public/profilePhotos', req.files[key].name);
        
        req.files[key].mv(filepath, err => {
          if (err) {
            console.log(err);
            return res.status(500).json({ status: 'error', msg: err });
          }          
        });
        
        avatarName = req.files[key].name;
      });
    }

    //update avatar in database
    res.status(200)
    .send(await updateAvatar(req.body.userId, avatarName));
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
  }
});

app.get('/admin/panel', verifyRole(ROLE.ADMIN), (req, res) => {
  res.send('Admin Panel');
});

app.use(errorHandler);

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
