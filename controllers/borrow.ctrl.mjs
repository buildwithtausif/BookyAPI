import recordExist from "../utils/dbUtils.model.mjs";
import { generateUuid } from "../service/id_service.mjs";
import {
  checkDueOrOverdue,
  getBorrowedCountForBook,
  borrowTransaction,
} from "../models/borrow.model.mjs";

const borrowBooks = async (req, res) => {
  try {
    // get identifier and book-set (which is to be borrowed)
    // from request body
    const { public_id, books } = req.body;
    if (!public_id || !books || (Array.isArray(books) && books.length === 0)) {
      return res.status(400).json({
        error:
          "Bad Request: public_id and a non-empty books array are required.",
      });
    }
    // check if the user exist in db
    const userExist = await recordExist({
      tableName: "users",
      colName: "public_id",
      value: public_id,
      returnRow: true,
    });
    if (!userExist) {
      return res
        .status(404)
        .json({ error: "no user found with the provided id" });
    }
    // RULE A: Check for overdue books first.
    const dues = await checkDueOrOverdue(public_id);
    if (dues.overdue && dues.overdue.length > 0) {
      return res.status(409).json({
        error:
          "Cannot borrow new books. You have overdue items that must be returned first.",
        overdueBooks: dues.overdue,
      });
    }
    // check if books is an array and if not convert it to an array
    const entries = Array.isArray(req.body.books)
      ? req.body.books
      : [req.body.books];
    // check if any book is issued already if it is then how many if 1 then only possible borrows is 2 and if max=3 no borrows
    const currentBorrowsCount = dues.alldues ? dues.alldues.length : 0;
    if (entries.length + currentBorrowsCount > 3) {
      return res.status(409).json({
        error: `You are trying to borrow ${
          entries.length
        } book(s), but you only have ${
          3 - currentBorrowsCount
        } borrowing slot(s) available.`,
      });
    }
    // books to issue
    const newBorrowings = [];
    // check if all the provided 'UUIDs' of books exist in the db and insert it into newBorrowings
    const borrowDate = new Date();
    const dueDate = new Date();
    // set due date to 14 days after the day of issue that is 15 day
    dueDate.setDate(borrowDate.getDate() + 14);
    for (const entry of entries) {
      const bookDetails = await recordExist({
        tableName: "books",
        colName: "uuid",
        value: entry.uuid,
        returnRow: true,
      });
      if (!bookDetails) {
        return res
          .status(400)
          .json({ error: "Invalid book UUID provided", provided: `${entry.uuid}` });
      }
      // check for book availability
      const borrowedCount = await getBorrowedCountForBook(entry.uuid);
      if (borrowedCount >= bookDetails.quantity) {
        return res.status(409).json({
          error: `Conflict: All copies of '${bookDetails.title}' are currently borrowed.`,
        });
      }
      // generate transaction scheme
      newBorrowings.push({
        transaction_id: generateUuid(),
        user_id: public_id,
        book_id: entry.uuid,
        borrow_date: borrowDate,
        due_date: dueDate,
      });
    }
    // trigger a transaction
    const newTransaction = await borrowTransaction(newBorrowings);
    // return a response if transaction was successfull
    if (newTransaction) {
      // SUCCESS
      return res.status(201).json({
        message: `Books successfully issued to ${userExist.name} (ID: ${userExist.public_id})`,
        data: newTransaction,
      });
    } else {
      // FAILURE
      console.error(
        "Database transaction failed for user:",
        userExist.public_id
      ); // Good for logging
      return res.status(500).json({
        error: "Failed to complete the borrow transaction in the database.",
      });
    }
  } catch (err) {
    console.error("Error in borrowBooks controller:", err);
    return res.status(500).json({
      error: "Something went wrong on our side. Please try again later ",
      type: err,
    });
  }
};

export { borrowBooks };
