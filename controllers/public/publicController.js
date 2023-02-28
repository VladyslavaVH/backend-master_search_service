import fs from 'fs';
import { 
    getHomePageStatisticsDB,
    getPopularCategoriesDB,
    getOptionCategoriesDB,
    getOptionCurrenciesDB,
    getRecentJobsDB,
    getHighestRatedMastersDB,
    getAllMastersDB,
} from './publicDbFunctions.js';

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
    getHomePageStatistics,
    getPopularCategories,
    getOptionCategories,
    getOptionCurrencies,
    getRecentJobs,
    getJobsMastersHighestRated,
    getAllMasters,
    getFaqs
};