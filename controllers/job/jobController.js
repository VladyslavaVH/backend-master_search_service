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

      Object.keys(photos).forEach((key) => {
        const filepath = path.join(
          __dirname,
          "../client/public/jobPhotos",
          photos[key].name
        );

        photos[key].mv(filepath, (err) => {
          if (err) {
            console.log(err);
            return res.status(500).json({ status: "error", msg: err });
          }
        });

        photosNameArr.push(photos[key].name);
      });
    }

    //create job in database
    const jobData = req.body;
    createJobDB(
      jobData.clientFK,
      jobData.title,
      jobData.categoryFK,
      jobData.lat,
      jobData.lng,
      jobData.minPayment,
      jobData.maxPayment,
      jobData.jobDateTime,
      jobData.description,
      photosNameArr
    );
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
      filepath = path.join(__dirname, "../../../client/public/jobPhotos", p.photo);
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
