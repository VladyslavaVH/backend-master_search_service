import pool from "../../config/dbConfig.js";
import ROLE from "../../config/roles.js";

export async function createUser(firstName, lastName, phone, password, roleFK = process.env.CLIENT_ROLE_FK) {
    const [{ insertId }] = await pool.query(`
    INSERT INTO users (firstName, lastName, phone, isPhoneVerified, password, roleFK)
    VALUES (?, ?, ?, ?, ?, ?)
    `, [firstName, lastName, phone, true, password, roleFK]);

    return insertId;
};

export async function createDefaultMaster(firstName, lastName, phone, password, roleFK = process.env.MASTER_ROLE_FK) {
    const id = await createUser(firstName, lastName, phone, password, roleFK)
    .then(async insertId => {
        const [result] = await pool.query(`
        INSERT INTO masters (user_id)
        VALUES (?)
        `, [insertId]);

        if (result) {
            return insertId;
        }
    })
    .then(async insertId => {
        const [res] = await pool.query(`
        INSERT INTO masters_documents (user_id)
        VALUES (?)
        `, [insertId]);

        if (res) {            
            return insertId;
        }
    });
    
    return id;
};

export async function findUser(id) {
    const res = await pool.query(`
    SELECT users.id, firstName, lastName, roles.name as 'role', avatar, phone, isPhoneVerified, refreshToken, email, isEmailVerified, createTime, password, refreshToken  
    FROM users 
    JOIN roles ON users.roleFK = roles.id 
    WHERE users.id = ?
    `, [id])
    .then(async ([[ user ]]) => {
        if (!user) return undefined;

        if (user.role === ROLE.MASTER) {
            const masterData = await getMasterData(user.id);
            const categories = await getMasterCategories(user.id);
            return {
                ...user,
                masterData: masterData,
                categories: categories
            };
        } else {
            return user;
        }
    });

    return res;
}

export async function getMasterData(id) {
    const [[masterData]] = await pool.query(`
    select * 
    from masters
    where user_id = ?;`, [id]);

    return masterData;
}

export async function getMasterCategories(id) {
    const [categories] = await pool.query(`
    select id, categories.name as 'category'
    from categories_masters
    join categories on categories_masters.categoryFK = categories.id
    join masters on categories_masters.masterFK = masters.user_id
    where user_id = ?;`, [id]);

    return categories;
}

export async function findUserByPhone(phone) {
    const res = await pool.query(`
    SELECT users.id, firstName, lastName, roles.name as 'role', avatar, phone, isPhoneVerified, refreshToken, email, isEmailVerified, createTime, password, refreshToken  
    FROM users 
    JOIN roles ON users.roleFK = roles.id
    WHERE phone = ?
    `, [phone])
    .then(async ([[ user ]]) => {
        if (!user) return undefined;
        
        if (user.role === ROLE.MASTER) {
            const masterData = await getMasterData(user.id);
            const categories = await getMasterCategories(user.id);
            return {
                ...user,
                masterData: masterData,
                categories: categories
            };
        } else {
            return user;
        }
    });

    return res;
}

export async function updateRefreshToken(id, refreshToken) {
    const [result] = await pool.query(`
    UPDATE users 
    SET refreshToken = ?
    WHERE id = ?`, [refreshToken, id]);

    return result;
}

export async function updatePassword(hashedPassword, phone) {
    const [result] = await pool.query(`
    UPDATE users 
    SET password = ? 
    WHERE phone = ?;`, [hashedPassword, phone]);

    return result;
}

export async function deleteRefreshToken(refreshToken) {
    const [result] = await pool.query(`
    UPDATE users 
    SET refreshToken = NULL 
    WHERE refreshToken = ?`, [refreshToken]);

    return result;
}

export async function getUserByRefreshToken(refreshToken) {
    const res = await pool.query(`
    SELECT * 
    FROM users 
    WHERE refreshToken = ?`, [refreshToken])
    .then(async ([[ user ]]) => {
        if(!user) return undefined;

        if (user.role === ROLE.MASTER) {
            const masterData = await getMasterData(user.id);
            const categories = await getMasterCategories(user.id);
            return {
                ...user,
                masterData: masterData,
                categories: categories
            };
        } else {
            return user;
        }
    });

    return res;
}