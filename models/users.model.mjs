import db from './db.mjs'; // api_database
/*
    a model is the sole which interacts with the database and forwards the result to controller isn't?
*/
// list all existing users from database
export async function list_users() {
    let get_query = `SELECT * FROM public.users;`;

    // it's user model what i've to do is to import users table from database
    try {
        const table = await db.query(get_query);
        return table; 
    } catch (err) {
        throw err;
    }
}

// create a new user in database
export async function create_user(name, email) {
   let post_query = `
        INSERT INTO public.USERS (name, email)
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

// update user-details in database
export async function edit_user(id, newName, newEmail) {
    let put_query = `
        UPDATE public.users
        SET 
            name = COALESCE($2, name),
            email = COALESCE($3, email)
        WHERE
            id = $1
        RETURNING *;
    `;
    try {
        const updated_data = await db.one(put_query, [id, newName, newEmail]);
        return updated_data;
    } catch (err) {
        throw err;
    }
}

// Delete a specific user from database
export async function del_user_by_id(id) {
    let delete_query = `
        DELETE FROM public.users
        WHERE
            id = $1
        RETURNING *;
    `;
    try {
        const deleted_usr = await db.oneOrNone(delete_query, [id]);
        return deleted_usr;
    } catch (err) {
        throw err;
    }
}