import db from './db.mjs'; // api_database
/*
    a model is the sole which interacts with the database and forwards the result to controller isn't?
*/
export async function list_users() {
    let get_query = `SELECT * FROM public.users;`;

    // it's user model what i've to do is to import users table from database
    try {
        const table = await db.query(get_query);
        console.log(table);
        return table; 
    } catch (err) {
        throw err;
    }
}

export async function create_user(name, email) {
   let post_query = `
        INSERT INTO USERS (name, email)
        VALUES ($1, $2)
        RETURNING *;
   `;

   try {
        const newUser = await db.one(post_query, [name, email]);
        return newUser;
   } catch (err) {
        throw err;
   }
}