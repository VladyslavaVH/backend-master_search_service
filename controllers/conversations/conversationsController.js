import { 
  createConversationDB,
  getConversationDB,
} from './conversationsDbFunctions.js';

const createConversation = async (req, res) => {
  const { senderId, receiverId, message } = req.body;
  console.log(req.body);
  try {
    const newMesRes = await createConversationDB(senderId, receiverId, message);
    res.status(200).json(newMesRes);    
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
}

const getConversation = async (req, res) => {
  const { receiverId } = req.query;
  const senderId = req.user.id;
  try {
    res.status(200).send(await getConversationDB(senderId, receiverId));    
  } catch (error) {
    res.status(500).json(error);
  }
}

export default {
  createConversation,
  getConversation
};
