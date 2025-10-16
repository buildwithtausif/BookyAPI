import db from "./db.mjs";

/**
 * Finds books based on a flexible set of criteria.
 * This is the "Query" part of CQRS.
 * @param {object} criteria - An object containing filter criteria (e.g., { author: '...', genre: '...' }).
 * @returns {Promise<Array>} - An array of book objects.
 */
export default async function find_books(criteria = {}) {
  // base_quey
  let query = `SELECT uuid,title,author,publisher,genre,isbn,quantity,created_at,last_modified FROM public.books`;
  let condition = [];
  let values = [];
  let param_index = 1;
  // building dynamic WHERE clause from query
  if (criteria.uuid) {
    condition.push(`uuid = $${param_index++}`);
    values.push(criteria.uuid);
  }
  if (criteria.author) {
    // ILIKE for case-insensitivity for partial matching on author names
    condition.push(`author ILIKE $${param_index++}`);
    values.push(`%${criteria.author}%`);
  }
  if (criteria.title) {
    condition.push(`title ILIKE $${param_index++}`);
    values.push(`%${criteria.title}%`);
  }
  if (criteria.genre) {
    condition.push(`genre ILIKE $${param_index++}`);
    values.push(`%${criteria.genre}%`);
  }
  if (criteria.isbn) {
    condition.push(`isbn = $${param_index++}`);
    values.push(criteria.isbn);
  }

  // if any of the criteria is added add it to the query
  if (condition.length > 0) {
    query += " WHERE " + condition.join(" AND ");
  }
  // ensuring a sequential order
  query += " ORDER BY internal_id";

  try {
    const books = await db.any(query, values);
    return books;
  } catch (err) {
    throw err;
  }
}
