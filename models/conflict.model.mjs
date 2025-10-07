import pgPromise from 'pg-promise';
import db from './db.mjs';

let pgp = pgPromise(); // initialize pgPromise
// define confilicting data
/* A confilicting data is any data that meatches already existing 
entity in the server on recieving the same from client. */

/*
    idea is to pass table_name and col_name into this function 
    as parameters and the function will check for the recieved_data into server_col
    if found match it will throw a 409 response code of "CONFLICT"
*/
export default async function conflict_check({tableName, colName, value}) {
    let query_template = `
        SELECT 1 FROM $[tableName:name] WHERE $[colName:name] = $[value]
    `;
    // vscode was prompting errors while using the specified query in the idea_tracker.md
    try {

        let formatted_query = pgp.as.format(query_template, {
            tableName: tableName,
            colName: colName,
            value: value
        });

        const response = await db.oneOrNone(formatted_query);
        return response !== null
    } catch (err) {
        console.log(`Error in checking conflicts from the server for ${tableName}: `, err);
        throw err;
    }
}