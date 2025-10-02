import {list_users, create_user} from "../models/users.model.mjs";


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
        throw err;
    }
}

// Read
const getusers = async (req, res) => {
    try {
        const usr = await list_users();
        res.status(200).json(usr);
    } catch (err) {
        throw err;
    }
}
export {getusers, reg_newuser}