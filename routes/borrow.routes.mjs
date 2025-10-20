import express from "express";
import {
    borrowBooks
} from "../controllers/borrow.ctrl.mjs";
const borrow_router = express.Router();

borrow_router.route("/").post(borrowBooks);

export default borrow_router;