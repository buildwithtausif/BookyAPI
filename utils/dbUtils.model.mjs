import db, {pgp} from '../models/db.mjs';
// define confilicting data
/* A confilicting data is any data that meatches already existing 
entity in the server on recieving the same from client. */

/*
    idea is to pass table_name and col_name into this function 
    as parameters and the function will check for the recieved_data into server_col
    if found match it will throw a 409 response code of "CONFLICT"
*/

/**
 * 
 * @param {string} options.tableName --> name of the table in database
 * @param {string} options.colName --> name of the column in database
 * @param {any} options.value - The value to search for value
 * @param {number|string} [options.excludeId] - (Optional) A public_id/uuid to exclude from the search.
 * @param {boolean} [options.returnRow=false] - If true, returns the full row object instead of a boolean.
 * @returns {Promise<boolean|object|null>} Returns boolean by default, or the record object/null if returnRow is true.
 */

export default async function recordExist({tableName, colName, value, excludeID = null, returnRow = false}) {
    if (value === undefined || value === null) return false;
    // generate select clause dynamically if return row is true
    const selectClause = returnRow ? 'SELECT *' : 'SELECT 1';
    let query_template = `
        ${selectClause} FROM $[tableName:name] WHERE $[colName:name] = $[value]
    `;
    // core parameters of conflict_check
    const params = {
        tableName: tableName,
        colName: colName,
        value: value
    }
    // if an exlusion is provided add it the the query template and make one more parameter named excludeID
    if (excludeID !== null) {
        query_template += ` AND public_id != $[excludeID]`;
        params.excludeID = excludeID;
    }

    try {
        // generate final query
        let formatted_query = pgp.as.format(query_template, params);
        const response = await db.oneOrNone(formatted_query);
        if (returnRow) {
            return response; // return response row
        } else {
            // preserve boolean behaviour
            return response !== null
        }
    } catch (err) {
        console.log(`Error in checking conflicts from the server for ${tableName}: `, err);
        return false;
    }
}