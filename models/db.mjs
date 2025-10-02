import pgPromise from "pg-promise";
import dotenv from 'dotenv';
//import dotenv
dotenv.config();
// import db credentials from env
const db_user = process.env.PSQL_USER;
const db_pass = process.env.PSQL_PASS;
const db_name = process.env.PSQL_DB;
const connectionQuery = `postgres://${db_user}:${db_pass}@localhost:5600/${db_name}`;
// init pg-promise and estabilish connection
const pgp = pgPromise();
const db = pgp(connectionQuery);

(async () => {
    try {
        const obj = await db.connect();
        console.log(`db connected: ${obj.client.database}`);
        obj.done();
    } catch (err) {
        console.log(err);
    }
})();

export default db;