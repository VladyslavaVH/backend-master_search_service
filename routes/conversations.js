import { Router } from 'express';
import conversationsController from '../controllers/conversations/conversationsController.js';

const router = Router();

router.route('/')
.post(conversationsController.createConversation);

router.route('/conversation')
.get(conversationsController.getConversation)

export default router;
