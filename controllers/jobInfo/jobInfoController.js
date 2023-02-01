import { 
  getJobById,
  getJobPhotosDB
} from './jobInfoDbFunctions.js';

const getJob = async (req, res) => {
  res.status(200).send(await getJobById(req.query.jobId) || {});
}

const getJobPhotos = async (req, res) => {
  res.status(200).send(await getJobPhotosDB(req.query.jobId) || []);
}

export default {
  getJob,
  getJobPhotos,
};
