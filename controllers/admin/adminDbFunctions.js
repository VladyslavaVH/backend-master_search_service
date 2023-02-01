import pool from "../../config/dbConfig.js";

export async function getAdminPanelStatistics() {
    const [[[result]]] = await pool.query(`call getAdminStatistics();`, []);

    return result || { newJobs: 0, newMasters: 0 };
}

export async function getFullMasterInfoDB(masterId) {
    const [[result]] = await pool.query(`
    select users.id, firstName, lastName, tagLine, country, flag, passportFirstSide, passportSecondSide, individual_tax_number, phone, email, avatar 
    from masters_documents
    join masters on masters_documents.user_id = masters.user_id
    join users on masters.user_id = users.id
    left join countries on masters.nationalityFK = countries.id
    where isAdminChecked = false and users.id = ?;
    `, [masterId]);

    return result || {};
}

export async function getUnverifiedMastersDB() {
    const [result] = await pool.query(`
    select id, firstName, lastName, passportFirstSide, passportSecondSide, individual_tax_number, phone, email, avatar 
    from masters_documents
    join masters on masters_documents.user_id = masters.user_id
    join users on masters.user_id = users.id
    where isAdminChecked = false;`, []);

    return result || [];
}

export async function verifyMasterDB(masterId) {
    await pool.query(`
    UPDATE masters_documents 
    SET isAdminChecked = true 
    WHERE user_id = ?;`, [masterId])
    .then(() => console.log('master verified'));
}

export async function createNewCategoryDB(name, description, isPopular) {
    await pool.query(`
    INSERT INTO categories (name, description, isPopular) 
    VALUES (?, ?, ?);
    `, [name, description, isPopular])
    .then(() => console.log('new category successfully created'));
}


