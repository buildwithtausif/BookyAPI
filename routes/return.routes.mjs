import express from "express";
import {
    returnBooks
} from "../controllers/return.ctrl.mjs";
const return_router = express.Router();

return_router.route("/").patch(returnBooks);

export default return_router;