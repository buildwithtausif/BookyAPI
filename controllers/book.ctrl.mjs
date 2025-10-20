/*
    /books endpoint follows CQRS architecture along with MVC
    separating dynamic query building funtionality from rest of three CRUD operations i.e CUD
*/

import find_books from "../models/read_books.model.mjs";
import recordExist from "../utils/dbUtils.model.mjs";
import { generateUuid } from "../service/id_service.mjs";
import { insertBooks } from "../models/cud_books.model.mjs";
import {
  updateBookService,
  deleteBookService,
} from "../service/book.service.mjs";

// Create
/*
    original idea was to have "isbn_autolookup" but for some reasons 
    I've not been able to implement it for the time being... 
    later on i'll implement that as well 

    the one below is manual entry that follows either single object entry or an array of objects

    like:-
    {
    "title": "Great Expectations",
    "author": "Charles Dickens",
    "publisher": "Rajkamal Prakashan",
    "genre": "Classic",
    "quantity": 10,
    "isbn": "9780000000014"
    }

    or

    [
        {
            "title": "Great Expectations",
            "author": "Charles Dickens",
            "publisher": "Rajkamal Prakashan",
            "genre": "Classic",
            "quantity": 10,
            "isbn": "9780000000014"
        },
                {
            "title": "Great Expectations",
            "author": "Charles Dickens",
            "publisher": "Rajkamal Prakashan",
            "genre": "Classic",
            "quantity": 10,
            "isbn": "9780000000014"
        }
    ]
*/
const addbooks = async (req, res) => {
  // get isbns from the req.body
  try {
    const entries = Array.isArray(req.body) ? req.body : [req.body];
    // check for empty request body
    if (
      entries.length === 0 ||
      (entries.length === 1 && Object.keys(entries[0]).length === 0)
    ) {
      return res.status(400).json({ message: "Request body cannot be empty" });
    }
    const books_array = [];
    const book_set = new Set();

    // validation & recordExist
    for (const entry of entries) {
      if (!entry.title || !entry.author) {
        return res
          .status(400)
          .json({ message: "Each book must have a title and an author." });
      }

      // conflict check for already existing isbns
      const isbn = entry.isbn;
      if (isbn) {
        // check if book_set already have that isbn
        if (book_set.has(isbn)) {
          return res.status(409).json({
            message: `Conflict: The ISBN ${isbn} is duplicated within your request.`,
          });
        }
        // if it's new isbn add it to the set
        book_set.add(isbn);
        console.log("Checking conflict for ISBN:", isbn);
        // checking if isbn is already existing in the database
        const isbnExists = await recordExist({
          tableName: "books",
          colName: "isbn",
          value: isbn,
        });
        if (isbnExists) {
          return res.status(409).json({
            message: `Conflict: A book with ISBN ${isbn} already exists.`,
          });
        }
        console.log("Conflict check result:", isbnExists);
      }

      // if all checks are done generate UUID for books
      const uuid = generateUuid();
      // creating this prevents unwanted 500 error arising due to pgp.helpers.insert
      const db_scheme = {
        uuid: uuid,
        title: entry.title,
        author: entry.author,
        publisher: entry.publisher || null, // Use null if not provided
        genre: entry.genre || null, // Use null if not provided
        isbn: entry.isbn || null, // Use null if not provided
        quantity: entry.quantity || 1, // Use a default of 1 if not provided
      };
      books_array.push(db_scheme);
    }

    console.log("Controller received entries:", entries);
    console.log("Books array prepared for DB:", books_array);
    // call model to add books to database
    const newBooks = await insertBooks(books_array);
    console.log("insertBooks returned:", newBooks);

    // if only one book is there return [0] element else the whole array
    return res.status(201).json(newBooks.length === 1 ? newBooks[0] : newBooks);
  } catch (err) {
    return res.status(500).json({
      message: "Something went wrong on our side. Please try again later",
    });
  }
};
// Read
/*
    idea is to build dynamic query for GET requests,
    for better filter support

    so, we have 
    1 file for read_books.model.mjs
    and,
    1 CUD_books.model.mjs (CREATE/UPDATE/DEL)
    2. book.ctrl.mjs
*/
const getbooks = async (req, res) => {
  const search_cond = req.query; // req.query is an Object?
  try {
    const data = await find_books(search_cond);
    // if a search is attempted but no data is recieved return 404
    if (
      (Object.keys(search_cond).length > 0 && data.length === 0) ||
      data.length === 0
    ) {
      return res.status(404).json({
        message:
          "Not Found: The requested resource doesn’t exist or has been removed.",
      });
    }
    // otherwise
    return res.status(200).json(data);
  } catch (err) {
    console.error("Error in getBooks controller:", err);
    return res.status(500).json({
      message: "Something went wrong on our side. Please try again later",
    });
  }
};

// Update book details using (uuid or isbn)

const update_books = async (req, res) => {
  try {
    // get identifiers
    const { uuid, isbn } = req.body;
    // get data to update
    let { edit_book_stack } = req.body;
    // validation
    if (
      (!uuid && !isbn) ||
      !Array.isArray(edit_book_stack) ||
      edit_book_stack.length === 0
    ) {
      return res
        .status(400)
        .json({ error: "UUID or ISBN and edited_book_stack are required" });
    }
    // pass these to update service
    const result = await updateBookService(uuid, isbn, edit_book_stack);
    // check if the service has successfully updated the database
    // if not (through optional-chaining)
    if (result?.error) {
      const status = result.error.includes("Conflict") ? 409 : 400;
      return res.status(status).json({ error: result.error });
    }
    // if nothing is recieved
    if (!result) {
      return res
        .status(404)
        .json({ error: "Book not found or no changes made" });
    }
    // service has updated data in the database
    return res
      .status(200)
      .json({ message: "Book updated successfully", data: result });
  } catch (err) {
    return res.status(500).json({
      error: "Something went wrong on our side. Please try again later",
    });
  }
};

// Delete by isbn or uuid
const delete_book = async (req, res) => {
  try {
    // get identifiers from request
    const { uuid, isbn } = req.param;
    if (!uuid && !isbn) {
      return res.status(400).json({ error: "UUID or ISBN is required" });
    }
    // pass these to deleteBookService
    const deletedBook = await deleteBookService(uuid, isbn);
    // check if the service has successfully deleted the book from the database
    // if not (through optional-chaining)
    if (deletedBook?.error) {
      const status = deletedBook.error.includes("Conflict") ? 409 : 400;
      return res.status(status).json({ error: deletedBook.error });
    }
    // if the book has not been deleted or is not found
    if (!deletedBook) {
      return res.status(404).json({
        error: "Book not found or already deleted",
      });
    }
    // service has deleted the data from the database
    return res
      .status(200)
      .json({ message: "Book deleted successfully", data: deletedBook });
  } catch (err) {
    return res.status(500).json({
      error: "Something went wrong on our side. Please try again later",
    });
  }
};
export { getbooks, addbooks, update_books, delete_book };
