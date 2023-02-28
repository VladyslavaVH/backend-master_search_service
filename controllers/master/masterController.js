import { 
  getMasterStatisticsDB,
  getAllMasterConversationsDB,
  applyJobDB,
  changeProfileSettingsDB,
  checkJobDB
} from './masterDbFunctions.js';

const getMasterStatistics = async (req, res) => {
  res.status(200).send(await getMasterStatisticsDB(req.user.id) || {});
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
  getAllMasterConversations,
  applyJob,
  changeProfileSettings,
  checkJob
};
