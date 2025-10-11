import db, {pgp} from './db.mjs';
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
 * @param {string} options.colName --> name of the coloumn in database
 * @param {any} options.value - The value to search for value
 * @param {number|string} [options.excludeId] - (Optional) An ID to exclude from the search.
 * @returns {boolean} True : if any conflict found, False: is no conflict found
 */

export default async function conflict_check({tableName, colName, value, excludeID = null}) {
    if (value === undefined || value === null) return false;
    let query_template = `
        SELECT 1 FROM $[tableName:name] WHERE $[colName:name] = $[value]
    `;
    // core parameters of conflict_check
    const params = {
        tableName: tableName,
        colName: colName,
        value: value
    }
    // if an exlusion is provided add it the the query template and make one more parameter named excludeID
    if (excludeID !== null) {
        query_template += ` AND id != $[excludeID]`;
        params.excludeID = excludeID;
    }

    try {
        // generate final query
        let formatted_query = pgp.as.format(query_template, params);
        const response = await db.oneOrNone(formatted_query);
        return response !== null
    } catch (err) {
        console.log(`Error in checking conflicts from the server for ${tableName}: `, err);
        return false;
    }
}