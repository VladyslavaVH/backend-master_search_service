import fs from 'fs';
import {
  getAdminPanelStatistics,
  getUnverifiedMastersDB,
  getFullMasterInfoDB,
  verifyMasterDB,
  createNewCategoryDB,
  deleteCategoryDB
} from './adminDbFunctions.js';

const getAdminPanel = async (req, res) => {
  res.status(200).send(await getAdminPanelStatistics() || { newJobs: 0, newMasters: 0 });
};

const getFullMasterInfo = async (req, res) => {
  res.status(200).send(await getFullMasterInfoDB(req.query.masterId) || {});
};

const getUnverifiedMasters = async (req, res) => {
  res.status(200).send(await getUnverifiedMastersDB() || []);
};

const verifyMaster = async (req, res) => {
  try {
    verifyMasterDB(req.query.masterId);
    res.status(200).json({ message: 'success' });    
  } catch (error) {
    res.status(400).json({ error });
  }
};

const createFaq = async (req, res) => {
  try {
    console.log(req.body);
    const { newQuestion, newAnswer } = req.body;

    fs.readFile('faqs.json', 'utf8', (err, data) => {
      if (err) {
        console.error(err);
        return;
      }
      
      let faqs = JSON.parse(data).faqs;
      let newFaq = {
        id: faqs.length + 1,
        question: newQuestion,
        answer: newAnswer
      };
      faqs.push(newFaq);
      const faqsfile = {
        "faqs": faqs
      };
      fs.writeFileSync('faqs.json', JSON.stringify(faqsfile));
    });
    
    res.status(200).json({ message: 'success' });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message });
  }
};

const createNewCategory = async (req, res) => {
  try {
    console.log(req.body);
    await createNewCategoryDB(req.body.name, req.body.description);
    res.status(200).json({ message: 'success' });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    console.log(req.body);
    await deleteCategoryDB(req.body.id);
    res.status(200).json({ message: 'success' });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message });
  }
};

const changeFaqs = async (req, res) => {
  try {
    let data = JSON.stringify(req.body);
    fs.writeFileSync('faqs.json', data);

    res.status(200).json({ message: 'success changed' });    
  } catch (error) {
    res.status(400).json({ error });
  }
};

export default {
  getAdminPanel,
  getUnverifiedMasters,
  getFullMasterInfo,
  verifyMaster,
  changeFaqs,
  createFaq,
  createNewCategory,
  deleteCategory,
};
