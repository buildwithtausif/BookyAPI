import {
  list_users,
  find_user_by_email,
  find_user_by_id,
  create_user,
  edit_user,
  del_user_by_id,
} from "../models/users.model.mjs";
import conflict_check from "../models/conflictHandler.model.mjs";
import generatePublicId from "../service/id_service.mjs";

// Create
const reg_newuser = async (req, res) => {
  const { name, email } = req.body;
  // validate for empty requests
  if (!name || !email) {
    return res.status(400).json({ error: "Name and Email are required" });
  }
  // validate for valid strings
  if (typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({ error: "Name must be a non-empty string." });
  }
  // check for valid email using regEx , this one is official of microsoft (found on stackoverflow)
  const validEmail = /\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/;
  if (!validEmail.test(email)) {
    return res
      .status(400)
      .json({ error: "Please provide a valid email address." });
  }
  // final validation & create user
  try {
    // create publicID and check for conflicts if id_exists continue the trial to get a unique id
    let public_id;
    let Idexists = false;
    do {
      public_id = generatePublicId();
      const IdExists = await conflict_check({
        tableName: "users",
        colName: "public_id",
        value: public_id,
      });
      if (IdExists) {
        IdExists = true;
      }
    } while (Idexists);
    // check for any conflicting values of emails in database to ensure unque users
    const emailExists = await conflict_check({
      tableName: "users",
      colName: "email",
      value: email,
    });
    if (emailExists) {
      return res
        .status(409)
        .json({
          error: `Operation aborted — database conflict detected. Use unique or updated values and retry.`,
        });
    }
    const newUser = await create_user(name, email, public_id);
    res.status(201).json(newUser); // 201 means "Created"
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({
        error: "Something went wrong on our side. Please try again later",
      });
  }
};

// Read
const getusers = async (req, res) => {
  try {
    // Check for query parameters in the URL (e.g., /users?public_id=7)
    const { public_id, email } = req.query;
    // if an id is provided inside query
    if (public_id) {
      const user = await find_user_by_id(public_id);
      // if user is found return it, otherwise return 404
      return user
        ? res.status(200).json(user)
        : res
            .status(404)
            .json({ message: "User not found with associated ID!" });
    }
    // if an email is provided inside query
    if (email) {
      // check for valid email using regEx , this one is official of microsoft (found on stackoverflow)
      const validEmail = /\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/;
      if (!validEmail.test(email)) {
        return res
          .status(400)
          .json({ error: "Please provide a valid email address." });
      }
      const user = await find_user_by_email(email);
      // if user is found return it, otherwise return 404
      return user
        ? res.status(200).json(user)
        : res
            .status(404)
            .json({ message: "User not found with associated public_id!" });
    }
    // list all users if no query is provided
    const allUsers = await list_users();
    return res.status(200).json(allUsers);
  } catch (err) {
    console.error("Error in getusers controller:", err);
    return res
      .status(500)
      .json({
        error: "Something went wrong on our side. Please try again later",
      });
  }
};

// update user details if required
const update_user = async (req, res) => {
  try {
    // get id from the request parameter :id
    const { public_id } = req.params;
    // get newName, newEmail from request body
    const { newName, newEmail } = req.body;
    // check if the data is sent inside body
    if (!newName && !newEmail) {
      return res
        .status(400)
        .json({
          error:
            "No new data provided. Please provide a name or email to update.",
        });
    }
    // run this only if newEmail is sent
    if (newEmail) {
      const validEmail = /\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/;
      if (!validEmail.test(newEmail)) {
        return res
          .status(400)
          .json({
            error:
              "Bad Request: Invalid or missing parameters. Please check your input and try again.",
          });
      }
      // check conflicting matches to newEmail in existing database
      const isTaken = await conflict_check({
        tableName: "users",
        colName: "email",
        value: newEmail,
        excludeID: public_id,
      });
      if (isTaken) {
        return res
          .status(409)
          .json({
            error: `Operation aborted — database conflict detected. Use unique or updated values and retry.`,
          });
      }
    }
    // pass recieved data to users.model.mjs after validation for updates in database
    const updatedUsr = await edit_user(public_id, newName, newEmail);
    // send 200 response only when user is found with public_id
    if (updatedUsr) {
      res
        .status(200)
        .json({ message: "User Updated successfully", data: updatedUsr });
    } else {
      // return 404 for user-not found
      return res
        .status(404)
        .json({ error: "User not found with associated ID!" });
    }
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({
        error: "Something went wrong on our side. Please try again later",
      });
  }
};

// handle DELETE note: i'm thinking to add multiple deletion feautres but not rn
const delete_user = async (req, res) => {
  try {
    const { public_id } = req.params;
    const deleted_user = await del_user_by_id(public_id);
    // if user is found and deleted show 200 ok else 404 no user found with associated id
    if (deleted_user) {
      res
        .status(200)
        .json({ message: "Successfully Deleted!", user: deleted_user });
    } else {
      return res
        .status(404)
        .json({
          error:
            "Not Found: The requested resource doesn’t exist or has been removed.",
        });
    }
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({
        error: "Something went wrong on our side. Please try again later",
      });
  }
};
export { getusers, reg_newuser, update_user, delete_user };
