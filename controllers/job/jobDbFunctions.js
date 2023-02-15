import pool from "../../config/dbConfig.js";

export async function insertJobPhoto(path, jobFK) {
    const [result] = await pool.query(`
    INSERT INTO job_photos (photo, jobFK)
    VALUES (?, ?)
    `, [path, jobFK]);

    return result;
}

export async function createJobDB(clientFK, categoryFK, lat, lng, minPayment, maxPayment, currencyFK, jobDateTime, description, files, qrCode = null ) {
    await pool.query(`
    INSERT INTO jobs (clientFK, lat, lng, categoryFK, minPayment, maxPayment, currencyFK, jobDateTime, description, qrCode)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [clientFK, lat, lng, categoryFK, minPayment, maxPayment, currencyFK, jobDateTime, description, qrCode])
    .then(([{ insertId }]) => {
        for (const path of files) {
            insertJobPhoto(path, insertId);
        }
    }).then(() => console.log('job created successfully'));
};

export async function deleteJobDB(id) {
    await pool.query(`
    DELETE FROM jobs WHERE id = ?
    `, [id])
    .then(() => console.log('job deleted successfully'));
};

export async function getJobPhotos(id) {
    const [photos] = await pool.query(`
    select job_photos.id, job_photos.photo
    from job_photos
    join jobs on job_photos.jobFK = jobs.id
    where jobs.id = ?;`, [id]);

    return photos || [];
};