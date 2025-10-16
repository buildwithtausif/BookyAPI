import express from "express";
import {
  getbooks,
  addbooks,
  update_books,
  delete_book,
} from "../controllers/book.ctrl.mjs";
const book_router = express.Router();

book_router.route("/").get(getbooks).post(addbooks);

book_router.route("/").patch(update_books).delete(delete_book);

export default book_router;
