import express from "express";
import {
  getusers,
  reg_newuser,
  update_user,
  delete_user,
} from "../controllers/users.ctrl.mjs";
// pre-fix all routes with /api/{given_endpoint}
const user_router = express.Router();

user_router.route("/").get(getusers).post(reg_newuser);

user_router.route("/:public_id").put(update_user).delete(delete_user);

export default user_router;
