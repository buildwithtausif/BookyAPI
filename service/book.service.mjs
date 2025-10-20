import { editBooks, deleteBook } from "../models/cud_books.model.mjs";
import db from "../models/db.mjs";
/***
 * Service function to handle the business logic for updating a book's details.
 * It validates identifiers, filters out protected columns, and then calls the
 * data access layer to perform the update.
 * @param {string | null} uuid - The UUID of the book to be updated.
 * @param {string | null} isbn - The ISBN of the book to be updated.
 * @param {Array<Object>} edit_book_stack - An array of objects representing columns to update.
 * @returns {Promise<Object>} A promise that resolves to the updated book data or an error object.
 ***/

// special case function
async function dualParamConflict(uuid, isbn) {
  /*** * --- Check UUID & ISBN conflict ---
   * This block ensures data integrity when both a UUID and an ISBN are provided.
   * It queries the database to confirm that both identifiers point to the exact same
   * book record before proceeding. If they don't match, or if the record doesn't exist,
   * it returns an error to prevent inconsistent updates.
   ***/
  if (uuid && isbn) {
    const uuid_query = `SELECT uuid,isbn FROM public.books WHERE uuid = $1`;
    const row = await db.oneOrNone(uuid_query, [uuid]);
    if (!row) {
      return { error: `Book with provided uuid and isbn is not found` };
    }
    // returned isbn and provided isbn if not matches
    if (row.isbn !== isbn) {
      return {
        error: "Conflict: UUID and ISBN do not belong to the same book",
      };
    }
  }

  return null; // no conflict
}
// book data update service
export async function updateBookService(uuid, isbn, edit_book_stack) {
  // --- Check UUID & ISBN conflict first ---
  const conflictCheck = await dualParamConflict(uuid, isbn);
  if (conflictCheck?.error) return conflictCheck;
  /*** * --- Protected Columns Filter ---
   * For security purposes, certain columns like internal IDs and creation timestamps
   * should not be user-modifiable. This block defines a list of such 'protectedCols'
   * and filters the incoming 'edit_book_stack' to remove any attempts to update them,
   * ensuring only permissible data fields are changed.
   ***/
  const protectedCols = ["internal_id", "created_at"];
  edit_book_stack = edit_book_stack.filter((item) => {
    return !protectedCols.includes(item.colName);
  });
  /***
   * --- Empty Update Stack Check ---
   * After filtering out protected columns, it's possible that no valid columns remain
   * for the update. This check verifies if the 'edit_book_stack' is empty. If so,
   * it returns an error to inform the user that their request contained no editable fields.
   ***/
  if (edit_book_stack.length === 0) {
    return {
      error:
        "No editable columns provided. internal_id and created_at cannot be updated.",
    };
  }
  /***
   * --- Database Update Delegation ---
   * After all validations and filtering are complete, this line delegates the actual
   * database write operation to the 'editBooks' function from the model layer.
   * It passes the validated identifiers and the sanitized stack of columns to be updated.
   ***/
  const updatedData = await editBooks(uuid, isbn, edit_book_stack);
  /***
   * --- Return Result ---
   * Returns the result obtained from the 'editBooks' model function. This will typically
   * be the data of the book after the update was successfully applied, or any error
   * that occurred during the database operation.
   ***/
  return updatedData;
}

export async function deleteBookService(uuid, isbn) {
  // --- Check UUID & ISBN conflict first ---
  const conflictCheck = await dualParamConflict(uuid, isbn);
  if (conflictCheck?.error) return conflictCheck;

  // Call deleteBook from model
  const deletedBook = await deleteBook(uuid,isbn);
  return deletedBook;
}
