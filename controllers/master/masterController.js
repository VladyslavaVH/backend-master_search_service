import bcrypt from "bcrypt";
import fs from 'fs';
import path, { dirname } from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { 
  getMasterStatisticsDB,
  getPermissionCheckDB,
  getAllMasterConversationsDB,
  applyJobDB,
  changeProfileSettingsDB,
  uploadDocumentsDB,
  checkJobDB
} from './masterDbFunctions.js';

const getMasterStatistics = async (req, res) => {
  res.status(200).send(await getMasterStatisticsDB(req.user.id) || {});
}

const getPermissionCheck = async (req, res) => {
  res.status(200).send(await getPermissionCheckDB(req.user.id));
}

const getAllMasterConversations = async (req, res) => {
  res.status(200).send(await getAllMasterConversationsDB(req.user.id) || {});
}

const applyJob = async (req, res) => {
  try {
    res.status(200).send(await applyJobDB(req.query.jobId, req.body.masterId, req.body.proposedPayment, req.body.suggestedLeadTime) || {});
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }  
}

const changeProfileSettings = async (req, res) => {
  try {
    console.log(req.body);
    const { masterCategories, newTagLine, newDescription } = req.body;
    res.status(200).send(await changeProfileSettingsDB(req.user.id, masterCategories, newTagLine, newDescription) || {});
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }  
}

const uploadDocuments = async (req, res) => {
  console.log('inside upload documents');
  try {
    //upload photos
    if (!req.files) {
      console.log("no files");
      return res.sendStatus(400);
    } else {
      const photos = req.files;

      let passport1 = (await bcrypt.hash(photos['passport1'].name, 10)).replaceAll('/', '-').replaceAll('\\', '-').replaceAll('.', '').replaceAll('$', '');
      let extension = photos['passport1'].name.substr(photos['passport1'].name.lastIndexOf('.'), photos['passport1'].name.length);
      passport1 = passport1 + extension;
      let photoPath = path.join(
        __dirname,
        process.env.MASTERS_DOCUMENTS_PATH,
        passport1
      );

      photos['passport1'].mv(photoPath, (err) => {
        if (err) {
          console.log(err);
          return res.status(500).json({ status: "error", msg: err });
        }
      });

      let passport2 = (await bcrypt.hash(photos['passport2'].name, 10)).replaceAll('/', '-').replaceAll('\\', '-').replaceAll('.', '').replaceAll('$', '');
      extension = photos['passport2'].name.substr(photos['passport2'].name.lastIndexOf('.'), photos['passport2'].name.length);
      passport2 = passport2 + extension;
      photoPath = path.join(
        __dirname,
        process.env.MASTERS_DOCUMENTS_PATH,
        passport2
      );

      photos['passport2'].mv(photoPath, (err) => {
        if (err) {
          console.log(err);
          return res.status(500).json({ status: "error", msg: err });
        }
      });

      let itn = (await bcrypt.hash(photos['itn'].name, 10)).replaceAll('/', '-').replaceAll('\\', '-').replaceAll('.', '').replaceAll('$', '');
      extension = photos['itn'].name.substr(photos['itn'].name.lastIndexOf('.'), photos['itn'].name.length);
      itn = itn + extension;
      photoPath = path.join(
        __dirname,
        process.env.MASTERS_DOCUMENTS_PATH,
        itn
      );

      photos['itn'].mv(photoPath, (err) => {
        if (err) {
          console.log(err);
          return res.status(500).json({ status: "error", msg: err });
        }
      });

      //upload documents in database
      res.status(200).json(await uploadDocumentsDB(req.user.id, passport1, passport2, itn));
    }    
  } catch (error) {
    console.log(error); 
    res.status(500).json({ success: false, error});
  }
};

const checkJob = async (req, res) => {
  try {
    res.status(200).send(await checkJobDB(req.query.jobId, req.user.id) || {});
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }  
}

export default {
  getMasterStatistics,
  getPermissionCheck,
  getAllMasterConversations,
  applyJob,
  changeProfileSettings,
  uploadDocuments,
  checkJob
};
