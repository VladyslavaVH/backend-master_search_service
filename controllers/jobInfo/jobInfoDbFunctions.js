import pool from "../../config/dbConfig.js";

export async function getJobById(id) {
    const [[result]] = await pool.query(`
    select jobs.id, jobs_candidates.status as 'isMasterConfirmed', title, users.firstName, users.lastName, isPhoneVerified as 'isVerified', minPayment, maxPayment, jobs.description, lat, lng, categories.name as 'category', jobs.createTime
    from jobs
    join categories on jobs.categoryFK = categories.id
    join users on jobs.clientFK = users.id
    left join jobs_candidates on jobs_candidates.jobFK = jobs.id
    where jobs.id = ?;`, [id]);

    return result || {};
}

export async function getJobPhotosDB(id) {
    const [photos] = await pool.query(`
    select job_photos.id, job_photos.photo
    from job_photos
    join jobs on job_photos.jobFK = jobs.id
    where jobs.id = ?;`, [id]);

    return photos || [];
}
