import bcrypt from 'bcrypt';
import pool from './config/dbConfig.js';

export async function createCategory(name, description, isPopular) {
    const result = await pool.query(`
    INSERT INTO categories (name, description, isPopular)
    VALUES (?, ?, ?)
    `, [name, description, isPopular]);

    return result;
}; 

export async function createUser(firstName, lastName, phone, password, roleFK = process.env.CLIENT_ROLE_FK) {
    const [result] = await pool.query(`
    INSERT INTO users (firstName, lastName, phone, password, roleFK)
    VALUES (?, ?, ?, ?, ?)
    `, [firstName, lastName, phone, password, roleFK]);

    return result;
};
//console.log(await createUser('Jude', 'Duarte', '+380965323364', 'theHighQueenOfElfhame'));

export async function updateRefreshToken(id, refreshToken) {
    const [result] = await pool.query(`
    UPDATE users 
    SET refreshToken = ?
    WHERE id = ?`, [refreshToken, id]);

    return result;
}

export async function getUserByRefreshToken(refreshToken) {
    const [[ user ]] = await pool.query(`
    SELECT * 
    FROM users 
    WHERE refreshToken = ?`, [refreshToken]);

    return user;
}

export async function deleteRefreshToken(refreshToken) {
    const [result] = await pool.query(`
    UPDATE users 
    SET refreshToken = NULL 
    WHERE refreshToken = ?`, [refreshToken]);

    return result;
}

export async function checkRefreshToken(token) {
    const [[result]] = await pool.query(`
    SELECT refreshToken 
    FROM users 
    WHERE refreshToken = ?`, [token]);

    return result.refreshToken;
}

export async function createDefaultMaster(firstName, lastName, phone, password, roleFK = process.env.MASTER_ROLE_FK) {
    await createUser(firstName, lastName, phone, password, roleFK)
    .then(async ({ insertId }) => {
        const [result] = await pool.query(`
        INSERT INTO masters (user_id)
        VALUES (?)
        `, [insertId]);

        return result;
    })
    .then(async ({ insertId }) => {
        await pool.query(`
        INSERT INTO masters_documents (user_id)
        VALUES (?)
        `, [insertId]);
    }).then(() => console.log('Success'));
};
//createDefaultMaster('Cardan', 'Greenbriar', '+380965323365', 'theHighKingOfElfhame');
//createDefaultMaster('Jude', 'Duarte', '+380965323363', 'theHighQueenOfElfhame');

export async function insertJobPhoto(path, jobFK) {
    const [result] = await pool.query(`
    INSERT INTO job_photos (photo, jobFK)
    VALUES (?, ?)
    `, [path, jobFK]);

    return result;
}

export async function deleteJobPhoto(path, jobFK) {
    await pool.query(`
    DELETE FROM job_photos 
    WHERE photo = ? AND jobFK = ?
    `, [path, jobFK]);
}

export async function createJob(clientFK, title, categoryFK, lat, lng, minPayment, maxPayment, jobDateTime, description, files, qrCode = null ) {
    await pool.query(`
    INSERT INTO jobs (clientFK, title, lat, lng, categoryFK, minPayment, maxPayment, jobDateTime, description, qrCode)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [clientFK, title, lat, lng, categoryFK, minPayment, maxPayment, jobDateTime, description, qrCode])
    .then(([{ insertId }]) => {
        for (const path of files) {
            insertJobPhoto(path, insertId);
        }
    }).then(() => console.log('job created successfully'));
};

export async function deleteJob(id) {
    await pool.query(`
    DELETE FROM jobs WHERE id = ?
    `, [id])
    .then(() => console.log('job deleted successfully'));
};

export async function deleteJobCandidate(jobId, masterId) {
    await pool.query(`
    DELETE 
    FROM jobs_candidates 
    WHERE jobFK = ? 
    AND masterFK = ?;`, [jobId, masterId])
    .then(() => console.log('candidate deleted successfully'));
};

export async function confirmCandidate(jobId, masterId) {
    //update
    await pool.query(`
    UPDATE jobs_candidates 
    SET status = true 
    WHERE jobFK = ? and masterFK = ?;`, [jobId, masterId])
    .then(() => console.log('candidate confirmed successfully'));
}

export async function updateJob(title, categoryFK, lat, lng, payment, jobDateTime, description, qrCode, id) {
    await pool.query(`
    UPDATE jobs 
    SET title = ?, categoryFK = ?, lat = ?, lng = ?, minPayment = ?, maxPayment = ?, jobDateTime = ?, description = ?, qrCode = ?
    WHERE id = ?`, [title, categoryFK, lat, lng, payment.min, payment.max, jobDateTime, description, qrCode, id]);
}

export async function refreshJob(jobDateTime, id) {
    await pool.query(`
    SELECT * FROM jobs
    WHERE id = ?`, [id])
    .then( async ([[job]]) => {
        await pool.query(`
        DELETE FROM jobs WHERE id = ?`, [id]);

        return job;
        
    }).then(async (job) =>  {
        await pool.query(`
        INSERT INTO jobs (clientFK, title, lat, lng, categoryFK, minPayment, maxPayment, jobDateTime, description, qrCode)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [job.clientFK, job.title, job.lat, job.lng, job.categoryFK, job.minPayment, job.maxPayment, jobDateTime, job.description, job.qrCode]);
    });
}
//refreshJob(new Date(2022, 11, 31, 9, 0, 0, 0), 15);

export async function updateJobStatus(id, status) {
    await pool.query(`
    UPDATE jobs 
    SET status = ? 
    WHERE id = ?
    `, [status, id]);
}

export async function getJobsMastersCount() {
    const [[[result]]] = await pool.query(`call getJobsMastersCount()`, []);

    return result || { jobsCount: 0, mastersCount: 0 };
}

export async function getPopularCategories() {
    const [[result]] = await pool.query(`call getPopularCategories()`, []);

    return result || [];
}

export async function getOptionCategories() {
    const [categories] = await pool.query(`
    select id, name as 'category'
    from categories;`, []);

    return categories || [];
}

export async function getJobsByCategoryName(name) {
    const [result] = await pool.query(`
    SELECT jobs.id, title, users.firstName AS 'clientName', users.isPhoneVerified AS 'isVerified', categories.name AS 'category', lat, lng, minPayment, maxPayment, jobDateTime, jobs.createTime, jobs.description, isDone, status, qrCode
    FROM jobs
    JOIN users ON jobs.clientFK = users.id
    JOIN categories ON jobs.categoryFK = categories.id
    WHERE categories.name = ?
    `, [name]).then(res => console.log(res));//AND jobs.isDone = false AND jobs.status = 'Pending Approval'

    return result || [];
}

/*!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*/
export async function getJobsByTitle(title) {
    let titleWordsArr = title;//split title on words separated by spaces and word.length > 2
    const resArr = [];//if more than 1 results by query with title
    let query = `
    SELECT jobs.id, title, users.firstName AS 'clientName', users.isPhoneVerified AS 'isVerified', categories.name AS 'category', lat, lng, minPayment, maxPayment, jobDateTime, jobs.createTime, jobs.description, isDone, status, qrCode
    FROM jobs
    JOIN users ON jobs.clientFK = users.id
    JOIN categories ON jobs.categoryFK = categories.id
    where title regexp ?;
    `;

    //change query in titleWordsArr cycle and + result to resArr
    const [result] = await pool.query(query, [title]);//AND jobs.isDone = false AND jobs.status = 'Pending Approval'

    return result || [];
}

export async function getAllJobs() {
    const [result] = await pool.query(`
    SELECT jobs.id, title, users.firstName AS 'clientName', users.isPhoneVerified AS 'isVerified', categories.name AS 'category', lat, lng, minPayment, maxPayment, jobDateTime, jobs.createTime, jobs.description, isDone, status, qrCode
    FROM jobs
    JOIN users ON jobs.clientFK = users.id
    JOIN categories ON jobs.categoryFK = categories.id
    `, []);//AND jobs.isDone = false AND jobs.status = 'Pending Approval'

    return result || [];
}

export async function getRecentJobs() {
    const [[result]] = await pool.query(`call getRecentJobs()`, []);

    return result || [];
}

export async function getJobById(id) {
    const [[result]] = await pool.query(`
    select jobs.id, title, users.firstName, users.lastName, isPhoneVerified as 'isVerified', minPayment, maxPayment, jobs.description, lat, lng, categories.name as 'category', jobs.createTime
    from jobs
    join categories on jobs.categoryFK = categories.id
    join users on jobs.clientFK = users.id
    where jobs.id = ?;`, [id]);

    return result || {};
}

export async function getJobPhotos(id) {
    const [photos] = await pool.query(`
    select job_photos.id, job_photos.photo
    from job_photos
    join jobs on job_photos.jobFK = jobs.id
    where jobs.id = ?;`, [id]);

    return photos || [];
}

export async function getAllMasters() {
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
}

export async function getMasterById(id) {
    const [[master]] = await pool.query(`
    select masters.user_id as 'id', users.avatar, users.firstName, users.lastName, 
    masters.tagLine, masters.description,
    avg(rating) as 'rating', count(jobs_candidates.jobFK) as 'jobsDoneCount',
    masters.lat, masters.lng
    from jobs_candidates
    join jobs on jobs_candidates.jobFK = jobs.id
    join job_comments on job_comments.job_id = jobs.id
    join masters on jobs_candidates.masterFK = masters.user_id
    join users on masters.user_id = users.id
    where jobs.isDone = true 
    and jobs_candidates.status = true
    and masters.user_id = ?;`, [id]);

    return master || {};
}

export async function getCommentsByMasterId(id) {
    const [comments] = await pool.query(`
    select job_id as 'id', jobs.title, job_comments.tagLine, rating, comment, job_comments.createTime
    from jobs_candidates
    join jobs on jobs_candidates.jobFK = jobs.id
    join job_comments on job_comments.job_id = jobs.id
    join masters on jobs_candidates.masterFK = masters.user_id
    where jobs.isDone = true
    and jobs_candidates.status = true
    and masters.user_id = ?;`, [id]);

    return comments || [];
}

export async function getCategoriesByMasterId(id) {
    const [categories] = await pool.query(`
    select categoryFK, categories.name as 'category'
    from categories_masters
    join categories on categories_masters.categoryFK = categories.id
    join masters on categories_masters.masterFK = masters.user_id
    where masters.user_id = ?;`, [id]);

    return categories || [];
}

export async function getRehiredJobCount(id) {
    const [rehiredJobCount] = await pool.query(`
    select count(jobs.clientFK) as 'rehiredCount'
    from jobs_candidates
    join jobs on jobs_candidates.jobFK = jobs.id
    join masters on jobs_candidates.masterFK = masters.user_id
    where jobs.isDone = true 
    and jobs_candidates.status = true
    and masters.user_id = ?
    group by jobs.clientFK;`, [id]);

    let rehired = 0;
    for (const c of rehiredJobCount) {
        rehired += c.rehiredCount;
    }

    return { rehired } || { rehired: 0 };
}

export async function getJobListingByClient(id) {
    const [jobs] = await pool.query(`
    SELECT *
    FROM jobs
    WHERE jobs.clientFK = ? 
    AND jobs.isDone = false
    ORDER BY (jobDateTime) desc;`, [id]);

    const [candidates] = await pool.query(`
    select masters.user_id as 'id', jobFK, jobs_candidates.status as 'isConfirmed', firstName, lastName, phone, email, avatar, isAdminChecked as 'isVerified'
    from jobs_candidates
    join masters on jobs_candidates.masterFK = masters.user_id
    join users on masters.user_id = users.id
    join masters_documents on masters_documents.user_id = masters.user_id
    join jobs on jobs_candidates.jobFK = jobs.id
    where clientFK = ?
    and jobs.isDone = false;`, [id]);

    return { jobs, candidates } || { jobs: [], candidates: [] };
}

export async function getAllMastersRating() {
    const [result] = await pool.query(`
    select masterFK, avg(rating) as 'rating'
    from jobs_candidates
    join jobs on jobs_candidates.jobFK = jobs.id
    join job_comments on job_comments.job_id = jobs.id
    where jobs.isDone = true and jobs_candidates.status = true
    group by masterFK;`, []);

    return result || [];
}

export async function getAllCandidatesByClient(id) {
    const [candidates] = await pool.query(`
    select masters.user_id as 'id', jobFK, jobs_candidates.status as 'isConfirmed', firstName, lastName, phone, email, avatar, isAdminChecked as 'isVerified'
    from jobs_candidates
    join masters on jobs_candidates.masterFK = masters.user_id
    join users on masters.user_id = users.id
    join masters_documents on masters_documents.user_id = masters.user_id
    join jobs on jobs_candidates.jobFK = jobs.id
    where clientFK = ?
    and jobs.isDone = false;`, [id]);

    const [allMastersRating] = await pool.query(`
    select masterFK, avg(rating) as 'rating'
    from jobs_candidates
    join jobs on jobs_candidates.jobFK = jobs.id
    join job_comments on job_comments.job_id = jobs.id
    where jobs.isDone = true and jobs_candidates.status = true
    group by masterFK;`, []);

    return { candidates, allMastersRating } || {};
}

export async function getHighestRatedMasters() {
    const [[result]] = await pool.query(`call getHighestRatedMasters()`, []);

    return result || [];
}

export async function comparePasswords( id, newPassword) {
    const [[{ password }]] = await pool.query(`
    SELECT password
    FROM users
    WHERE id = ?
    `, [id]);

    return bcrypt.compare(newPassword, password);
}

export async function updatePassword(id, oldPassword, newPassword) {
    const [result] = await pool.query(`
    UPDATE users 
    SET password = ? 
    WHERE id = ? AND password = ?
    `, [newPassword, id, oldPassword]);

    return result;
};

// async function getRegDate(id) {
//     const [[{ createTime }]] = await pool.query(`
//     SELECT createTime
//     FROM users
//     WHERE id = ?
//     `, [id]);

//     return new Date(createTime);
// }

//console.log(await test(1));

export async function findUser(id) {
    const [[user]] = await pool.query(`
    SELECT users.id, firstName, lastName, roles.name as 'role', avatar, phone, isPhoneVerified, refreshToken, email, isEmailVerified, createTime, password, refreshToken  
    FROM users 
    JOIN roles ON users.roleFK = roles.id 
    WHERE users.id = ?
    `, [id]);

    return user;
}

export async function findUserByPhone(phone) {
    const [[user]] = await pool.query(`
    SELECT users.id, firstName, lastName, roles.name as 'role', avatar, phone, isPhoneVerified, refreshToken, email, isEmailVerified, createTime, password, refreshToken  
    FROM users 
    JOIN roles ON users.roleFK = roles.id
    WHERE phone = ?
    `, [phone]);

    return user;
}

export async function findMaster(id) {
    const [[master]] = await pool.query(`
    SELECT * FROM masters WHERE user_id = ?
    `, [id]);

    return master;
}

export async function updateMaster(id, tagLine, nationalityFK, description) {
    const [result] = await pool.query(`
    UPDATE masters 
    SET tagLine = ?, nationalityFK = ?, description = ? 
    WHERE user_id = ?
    `, [tagLine, nationalityFK, description, id]);

    return result;
}

export async function updateAvatar(id, newAvatar) {
    const [result] = await pool.query(`
    UPDATE users SET avatar = ? WHERE id = ?;
    `, [newAvatar, id]);

    return result || {};
}

export async function updateMasterLocation(id, lat, lng) {
    const [result] = await pool.query(`
    UPDATE masters 
    SET lat = ?, lng = ? 
    WHERE user_id = ?
    `, [lat, lng, id]);

    return result;
}