import bcrypt from 'bcrypt';
import fs from 'fs';
import path, { dirname } from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { 
    createJobDB,
    deleteJobDB,
    getJobPhotos
} from './jobDbFunctions.js';

const createJob = async (req, res) => {
  console.log('inside create job');
  try {
    let photosNameArr = [];

    //upload photos
    if (!req.files) {
      //return res.status(200).json({ msg: 'no files' });
      console.log("no files");
    } else {
      const photos = req.files;

      Object.keys(photos).forEach(async (key) => {
        const newPhotoName = (await bcrypt.hash(photos[key].name, 10)).replaceAll('/', '-').replaceAll('\\', '-').replaceAll('.', '').replaceAll('$', '');
        const extension = photos[key].name.substr(photos[key].name.lastIndexOf('.'), photos[key].name.length);
        console.log(`${photos[key].name}: ${newPhotoName + extension}`);
        const filepath = path.join(
          __dirname,
          process.env.JOB_PHOTOS_PATH,
          newPhotoName + extension
        );

        photos[key].mv(filepath, (err) => {
          if (err) {
            console.log(err);
            return res.status(500).json({ status: "error", msg: err });
          }
        });

        photosNameArr.push(newPhotoName + extension);
        console.log(photosNameArr);
        console.log('create job in database');
        //create job in database
        const jobData = req.body;
        createJobDB(
          jobData.clientFK,
          jobData.categoryFK,
          jobData.lat,
          jobData.lng,
          jobData.minPayment,
          jobData.maxPayment,
          jobData.currencyFK,
          jobData.jobDateTime,
          jobData.description,
          photosNameArr
        );
      });
    }
  } catch (error) {
    console.log(error); 
  }

  res.status(200).json({ success: "success" });
};

const deleteJob = async (req, res) => {
  const photos = await getJobPhotos(req.query.jobId);
  let filepath = "";
  if (photos && photos.length > 0) {
    for (const p of photos) {
      filepath = path.join(__dirname, process.env.JOB_PHOTOS_PATH, p.photo);
      fs.unlinkSync(filepath, (err) => {
        if (err) {
          console.log(err);
          return res.status(500).json({ status: "error", msg: err });
        }
        console.log("photo deleted successfully");
      });
      console.log(filepath);
    }
  }

  res.status(200).send((await deleteJobDB(req.query.jobId)) || {});
};

export default {
    createJob,
    deleteJob
};
