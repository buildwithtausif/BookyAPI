import {list_users, create_user, edit_user, del_user_by_id} from "../models/users.model.mjs";


// Create
const reg_newuser = async (req, res) => {
    const {name, email} = req.body;
        // if (name && email != null) {
        //     if (typeof name === String && email === regEX_email_validation) {
        //         const sendData = await create_user(name,email);
        //         res.status(201).json(sendData); // 201 means "Created"
        //     }
        // }
    // validate for empty requests
    if (!name || !email) {
        return res.status(400).json({message: "Name and Email are required"});
    }
    // validate for valid strings
    if (typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({message: "Name must be a non-empty string."});
    }
    // check for valid email using regEx , this one is official of microsoft (found on stackoverflow)
    const validEmail = /\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/;
    if (!validEmail.test(email)) {
        return res.status(400).json({ message: "Please provide a valid email address." });
    }

    try {
        const newUser = await create_user(name, email);
        res.status(201).json(newUser); // 201 means "Created"
    } catch (err) {
        res.status(500).json({ message: "Error creating user." });
        console.log(err);
    }
}

// Read
const getusers = async (req, res) => {
    try {
        const usr = await list_users();
        res.status(200).json(usr);
    } catch (err) {
        console.log(err);
    }
}

// update user details if required
const update_user = async (req, res) => {
    try {
        // get id from the request parameter :id
        const { id } = req.params;
        // get newName, newEmail from request body
        const { newName, newEmail } = req.body;
        // check if the data is sent inside body 
        if (!newName && !newEmail) {
            return res.status(400).json({ message: "No new data provided. Please provide a name or email to update." });
        }
        // run this only if email is sent to body
        if (newEmail) {
            const validEmail = /\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/;
            if (!validEmail.test(newEmail)) {
                return res.status(400).json({ message: "Please provide a valid email address." });
            }           
        }

        // pass recieved data to users.model.mjs after validation for updates in database
        const updatedUsr = await edit_user(id, newName, newEmail);
        res.status(200).json(updatedUsr);
        // return if no associated id is found to update data in.
        if (!updatedUsr) {
            res.status(404).json({message: "User not found with associated ID!"});
        }

    } catch (err) {
        res.status(500).json({message: 'An internal server error occurred while updating the user.'});
        console.log(err);
    }
}

// handle DELETE note: i'm thinking to add multiple deletion feautres but not rn
const delete_user = async (req, res) => {
    try {
        const { delete_id } = req.params;
        const deleted_user = await del_user_by_id(delete_id);
        // if user is found and deleted show 200 ok else 404 no user found with associated id
        if (deleted_user) {
            res.status(200).json(log);
        } else {
            res.status(404).json({message: "User not found with associated ID!"});
        }
    } catch (err) {
       res.status(500).json({message: 'An internal server error occurred while updating the user.'});
       console.log(err);
    }
}
export {getusers, reg_newuser, update_user, delete_user}