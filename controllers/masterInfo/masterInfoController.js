import { 
  getMasterById,
  getCommentsByMasterId,
  getCategoriesByMasterId,
  getRehiredJobCount,
  getAllMastersRating
} from './masterInfoDbFunctions.js';

const getMaster = async (req, res) => {
  res.status(200).send(await getMasterById(req.query.userId) || {});
}

const getMasterComments = async (req, res) => {
  res.status(200).send(await getCommentsByMasterId(req.query.masterId) || []);
}

const getMasterCategories = async (req, res) => {
  res.status(200).send(await getCategoriesByMasterId(req.query.masterId) || []);
}

const getMasterRehiredJobCount = async (req, res) => {
  res.status(200).send(await getRehiredJobCount(req.query.masterId) || { rehired: 0 });
}

const getMastersRatings = async (req, res) => {
  res.status(200).send(await getAllMastersRating() || []);
}

export default {
  getMaster,
  getMasterComments,
  getMasterCategories,
  getMasterRehiredJobCount,
  getMastersRatings
};
