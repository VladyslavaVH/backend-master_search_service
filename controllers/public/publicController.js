import fs from 'fs';
import { 
    updateEmailConfirmStatusDB,
    getHomePageStatisticsDB,
    getPopularCategoriesDB,
    getOptionCategoriesDB,
    getOptionCurrenciesDB,
    checkPhoneDB,
    getRecentJobsDB,
    getHighestRatedMastersDB,
    getAllMastersDB,
} from './publicDbFunctions.js';

const updateEmailConfirmStatus = async (req, res) => {
    const { email, id, token } = req.body;
    try {
      await updateEmailConfirmStatusDB(email, id, token);
      res.status(200).json({ success: true, message: "Confirmation updated successfully!" });
    } catch (error) {
      res.status(500).json({ success: false, message: error });
    }
  };

const getHomePageStatistics = async (req, res) => {
    res.status(200).send(await getHomePageStatisticsDB() || { jobsCount: 0, usersCount: 0 });
};

const getPopularCategories = async (req, res) => {
    res.status(200).send(await getPopularCategoriesDB() || []);
};

const getOptionCategories = async (req, res) => {
    res.status(200).send(await getOptionCategoriesDB() || []);
};

const getOptionCurrencies = async (req, res) => {
    res.status(200).send(await getOptionCurrenciesDB() || []);
};

const checkPhone = async (req, res) => {
    res.status(200).send(await checkPhoneDB(req.body.phone));
};

const getRecentJobs = async (req, res) => {
    res.status(200).send(await getRecentJobsDB() || []);
};

const getJobsMastersHighestRated = async (req, res) => {
    res.status(200).send(await getHighestRatedMastersDB() || []);
};

const getAllMasters = async (req, res) => {
    res.status(200).send(await getAllMastersDB() || []);
};

const getFaqs = async (req, res) => {
    res.status(200).send(JSON.parse(fs.readFileSync('faqs.json')) || []);
};

export default {
    updateEmailConfirmStatus,
    getHomePageStatistics,
    getPopularCategories,
    getOptionCategories,
    getOptionCurrencies,
    checkPhone,
    getRecentJobs,
    getJobsMastersHighestRated,
    getAllMasters,
    getFaqs
};