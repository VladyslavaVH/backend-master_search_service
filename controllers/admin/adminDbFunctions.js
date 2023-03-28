import pool from "../../config/dbConfig.js";

export async function getAdminPanelStatistics() {
    const [[[result]]] = await pool.query(`call getAdminStatistics();`, []);

    return result || { newJobs: 0, newMasters: 0 };
}

export async function getFullMasterInfoDB(masterId) {
    const [[result]] = await pool.query(`
    select users.id, firstName, lastName, tagLine, passportFirstSide, passportSecondSide, individual_tax_number, isAdminChecked, phone, email, avatar 
    from masters_documents
    join masters on masters_documents.user_id = masters.user_id
    join users on masters.user_id = users.id
    where users.id = ?;
    `, [masterId]);

    return result || {};
}

export async function getUnverifiedMastersDB() {
    const [result] = await pool.query(`
    select id, firstName, lastName, isAdminChecked, passportFirstSide, passportSecondSide, individual_tax_number, phone, email, avatar 
    from masters_documents
    join masters on masters_documents.user_id = masters.user_id
    join users on masters.user_id = users.id;`, []);

    return result || [];
}

export async function verifyMasterDB(masterId) {
    await pool.query(`
    UPDATE masters_documents 
    SET isAdminChecked = true 
    WHERE user_id = ?;`, [masterId])
    .then(() => console.log('master verified'));
}

export async function createNewCategoryDB(name, description) {
    await pool.query(`
    INSERT INTO categories (name, description) 
    VALUES (?, ?);
    `, [name, description])
    .then(() => console.log('new category successfully created'));
}

export async function deleteCategoryDB(id) {
    await pool.query(`
    DELETE FROM categories 
    WHERE id = ?;`, [id])
    .then(() => console.log('category successfully deleted'));
}


