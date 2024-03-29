import pool from "../../config/dbConfig.js";

export async function updateEmailConfirmStatusDB(email, id, token) {
    await pool.query(`
    UPDATE users 
    SET isEmailVerified = 1, email = ?
    WHERE refreshToken = ? OR id = ?;
    `, [email, token, id]);
}

export async function getHomePageStatisticsDB() {
    const [[[result]]] = await pool.query(`call getHomePageStatistics()`, []);

    return result || { jobsCount: 0, usersCount: 0 };
};

export async function getPopularCategoriesDB() {
    const [result] = await pool.query(`
    select categories.*, count(categoryFK) as 'count'
    from jobs
    join categories on categoryFK = categories.id
    group by categoryFK
    order by count desc
    limit 8;`, []);

    return result || [];
};

export async function getOptionCategoriesDB() {
    const [categories] = await pool.query(`
    select id, name as 'category'
    from categories;`, []);

    return categories || [];
};

export async function getOptionCurrenciesDB() {
    const [categories] = await pool.query(`
    select id, name as 'currency'
    from currencies;`, []);

    return categories || [];
};

export async function checkPhoneDB(phone) {
    const [checkedPhone] = await pool.query(`
    select phone
    from users
    where phone = ?;`, [phone]);

    return checkedPhone.length > 0;
};

export async function getRecentJobsDB() {
    const [result] = await pool.query(`
    select distinct jobs.id, categories.name as 'category', jobs.lat, jobs.lng, jobs.minPayment, jobs.maxPayment, currencies.name as 'currency', jobs.description, users.firstName as 'clientName', DATEDIFF(date(now()), date(jobs.createTime)) as 'days', jobs.createTime as 'createTime'
    from jobs
    join categories on jobs.categoryFK = categories.id
    join users on jobs.clientFK = users.id
    join currencies on jobs.currencyFK = currencies.id
    left join jobs_candidates on jobs_candidates.jobFK = jobs.id
    union
    select distinct jobs.id, categories.name as 'category', jobs.lat, jobs.lng, jobs.minPayment, jobs.maxPayment, currencies.name as 'currency', jobs.description, users.firstName as 'clientName', DATEDIFF(date(now()), date(jobs.createTime)) as 'days', jobs.createTime as 'createTime'
    from jobs
    join categories on jobs.categoryFK = categories.id
    join users on jobs.clientFK = users.id
    join currencies on jobs.currencyFK = currencies.id
    join jobs_candidates on jobs_candidates.jobFK = jobs.id
    where jobs_candidates.status = 0
    order by createTime desc
    limit 5;`, []);

    return result || [];
};

export async function getHighestRatedMastersDB() {
    const [[result]] = await pool.query(`call getHighestRatedMasters()`, []);

    return result || [];
};

export async function getAllMastersDB() {
    const [result] = await pool.query(`
    select masters.user_id as 'id', users.avatar, users.firstName, users.lastName, 
    masters.tagLine, 
    avg(rating) as 'rating',
    masters.lat, masters.lng
    from jobs_candidates
    join jobs on jobs_candidates.jobFK = jobs.id
    join job_comments on job_comments.job_id = jobs.id
    join masters on jobs_candidates.masterFK = masters.user_id
    join users on masters.user_id = users.id
    where jobs.isDone = true and jobs_candidates.status = true
    group by jobs_candidates.masterFK;`, []);

    return result || [];
};
