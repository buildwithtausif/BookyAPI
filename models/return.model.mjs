import db, { pgp } from './db.mjs';

export default async function closeBorrowLogs(transactionIds) {
    const query = `
        UPDATE borrow_logs
        SET return_date = NOW()
        WHERE
            transaction_id IN ($1:list) -- pg-promise feature for handling arrays list means array, says $1 is an array
            AND return_date IS NULL
        RETURNING *;
    `;
    
    try {
        const updatedLogs = await db.any(query, [transactionIds]);
        return updatedLogs;
    } catch (err) {
        console.error(`Error processing return:`, err);
        throw err;
    }
}