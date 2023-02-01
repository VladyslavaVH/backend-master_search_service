import { Router } from 'express';
import { verifyRole } from '../middleware/verify.js';
import ROLE from '../config/roles.js';
import clientController from '../controllers/client/clientController.js';

const router = Router();

router.route('/job/listing', verifyRole(ROLE.CLIENT))
.get(clientController.getClientJobListing);

router.route('/job/candidates', verifyRole(ROLE.CLIENT))
.get(clientController.getClientJobCandidates);

router.route('/conversations', verifyRole(ROLE.CLIENT))
.get(clientController.getAllClientConversations);

router.route('/job/candidate', verifyRole(ROLE.CLIENT))
.delete(clientController.deleteClientJobCandidate);

router.route('/job/candidate', verifyRole(ROLE.CLIENT))
.put(clientController.putClientJobCandidate);

export default router;