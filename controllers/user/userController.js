import fs from 'fs';
import bcrypt from "bcrypt";
import path, { dirname } from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { 
  getNotificationsDB,
  getMessagesDB,
  updateAvatar,
  getAvatar,
} from './userDbFunctions.js';

const getNotifications = async (req, res) => {
  res.status(200).send(await getNotificationsDB(req.user.id) || {});
}

const getMessages = async (req, res) => {
  res.status(200).send(await getMessagesDB(req.user.id) || {});
}

const changeAvatar = async (req, res) => {
  try {
    let avatarName = await getAvatar(req.user.id);
    
    //upload photo
    if(!req.files) {
      console.log('no new avatar');
      return res.sendStatus(400);
    } else {

      if (avatarName !== 'user-avatar-placeholder.png') {
        const deletePath = path.join(__dirname, process.env.PROFILE_PHOTOS_PATH, avatarName);
        fs.unlinkSync(deletePath, (err) => {
          if (err) {
            console.log(err);
            return res.status(500).json({ status: "error", msg: err });
          }
          console.log("old avatar deleted successfully");
        });
      }

      Object.keys(req.files).forEach(async key => {
        const oldFileName = req.files[key].name;
        const extension = oldFileName.substr(oldFileName.lastIndexOf('.'), oldFileName.length);
        let newFileName = (await bcrypt.hash(oldFileName, 10)).replaceAll('/', '-').replaceAll('\\', '-').replaceAll('.', '').replaceAll('$', '');
        if(newFileName.length > 250) {
          newFileName = newFileName.slice(0, 250);
        }
        const filepath = path.join(__dirname, process.env.PROFILE_PHOTOS_PATH, newFileName + extension);
        
        req.files[key].mv(filepath, err => {
          if (err) {
            console.log(err);
            return res.status(500).json({ status: 'error', msg: err });
          }          
        });
        
        avatarName = newFileName + extension;
        //update avatar in database
        await updateAvatar(req.body.userId, avatarName);
        res.status(200).send({ path: avatarName });
      });
    }
    
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
