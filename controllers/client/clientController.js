import {
    getJobListingByClient,
    getAllCandidatesByClient,
    getAllClientConversationsDB,
    deleteJobCandidate,
    confirmCandidate
} from './clientDbFunctions.js';

const getClientJobListing = async (req, res) => {
    res.status(200).send(await getJobListingByClient(req.user.id) || { jobs: [], candidates: [] });
};

const getClientJobCandidates = async (req, res) => {
    res.status(200).send(await getAllCandidatesByClient(req.user.id) || []);
};

const getAllClientConversations = async (req, res) => {
  console.log('get All Client Conversations');
    res.status(200).send(await getAllClientConversationsDB(req.user.id) || []);
};

const deleteClientJobCandidate = async (req, res) => {
    try {
      if (!req.query.jobId || !req.body.masterId) return res.sendStatus(400);
  
      res.status(200)
      .send(await deleteJobCandidate(req.query.jobId, req.body.masterId) || {});
    } catch (error) {
      res.sendStatus(400);
    }
}

const putClientJobCandidate = async (req, res) => {
    try {
      if (!req.query.jobId || !req.body.masterId) return res.sendStatus(400);
      console.log(req.query.jobId,req.body.masterId);
  
      res.status(200)
      .send(await confirmCandidate(req.query.jobId, req.body.masterId) || {});
  
      
    } catch (error) {
      res.sendStatus(400);
    }
}

export default {
    getClientJobListing,
    getClientJobCandidates,
    deleteClientJobCandidate,
    putClientJobCandidate,
    getAllClientConversations
};
