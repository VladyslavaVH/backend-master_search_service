import { response } from "express";
import pool from "../../config/dbConfig.js";

export async function getConversationDB(senderId, receiverId) {
    const receiver = senderId;
    const sender = receiverId;
    const [result] = await pool.query(`
    select messages.*, senderFK, users.avatar
    from user_messages
    join messages on user_messages.messageFK = messages.id
    join users on user_messages.senderFK = users.id
    where (senderFK = ? and receiverFK = ?) or (receiverFK = ? and senderFK = ?)
    order by timestamp(messages.create_time) asc;
    `, [senderId, receiverId, receiver, sender]);

    return result;
}

export async function createMessage(message) {
    const [result] = await pool.query(`
    INSERT INTO messages (message) 
    VALUES (?);
    `, [message]);

    return result;
}

export async function createConversationDB(senderId, receiverId, message) {
    const result = 
    await createMessage(message)
    .then(async ({ insertId }) => {
        const newMes = await pool.query(`
        INSERT INTO user_messages (senderFK, receiverFK, messageFK) 
        VALUES (?, ?, ?);
        `, [senderId, receiverId, insertId])
        .then(async () => {
            const [[resMes]] = await pool.query(`
            select messages.*, senderFK, users.avatar
            from user_messages
            join messages on user_messages.messageFK = messages.id
            join users on user_messages.senderFK = users.id
            where messages.id = ?;
            `, [insertId]);

            return resMes;
        });

        return newMes;
    });
    
    return result;
}