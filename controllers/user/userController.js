import path, { dirname } from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { 
  getNotificationsDB,
  getMessagesDB,
  updateAvatar
} from './userDbFunctions.js';

const getNotifications = async (req, res) => {
  res.status(200).send(await getNotificationsDB(req.user.id) || {});
}

const getMessages = async (req, res) => {
  res.status(200).send(await getMessagesDB(req.user.id) || {});
}

const changeAvatar = async (req, res) => {
  try {
    let avatarName = '';
    
    //upload photo
    if(!req.files) {
      console.log('no new avatar');
      return res.sendStatus(400);
    } else {
      Object.keys(req.files).forEach(key => {
        const filepath = path.join(__dirname, process.env.PROFILE_PHOTOS_PATH, req.files[key].name);
        
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
}

export default {
  getNotifications,
  getMessages,
  changeAvatar,
};
