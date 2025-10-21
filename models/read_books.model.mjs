import db from "./db.mjs";

/**
 * Finds books, calculates borrowed/available counts, and aggregates active loan details into a nested JSON array.
 * @param {object} criteria - An object containing filter criteria.
 * @returns {Promise<Array>} - An array of unique book objects with their loan counts and a nested array of loans.
 */
export default async function find_books(criteria = {}) {
  let query = `
    SELECT 
      b.uuid, 
      b.title, 
      b.author, 
      b.publisher, 
      b.genre, 
      b.isbn, 
      b.quantity,
      b.created_at,
      b.last_modified,
      COALESCE(loan_details.borrowed_count, 0)::int AS borrowed_count,
      (b.quantity - COALESCE(loan_details.borrowed_count, 0))::int AS available_quantity,
      -- If there are no loans, return an empty JSON array '[]' instead of NULL
      COALESCE(loan_details.loans, '[]'::json) AS loans
    FROM 
      public.books b
    LEFT JOIN (
      -- This subquery now aggregates all loan info for each book into a single JSON array
      SELECT 
        bl.book_id, 
        COUNT(*) AS borrowed_count,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'transaction_id', bl.transaction_id,
            'borrowed_by', bl.user_id,
            'user_name', u.name,
            'borrow_date', bl.borrow_date,
            'due_date', bl.due_date
          )
        ) AS loans
      FROM 
        public.borrow_logs bl
      JOIN 
        public.users u ON bl.user_id = u.public_id
      WHERE 
        bl.return_date IS NULL 
      GROUP BY 
        bl.book_id
    ) AS loan_details ON b.uuid = loan_details.book_id
  `;

  const conditions = [];
  const values = [];
  let paramIndex = 1;

  // Safely iterate over criteria properties.
  Object.keys(criteria).forEach(key => {
    if (key === 'status') return; // Status is handled separately below.

    const value = criteria[key];
    if (['title', 'author', 'genre', 'publisher'].includes(key)) {
      conditions.push(`b.${key} ILIKE $${paramIndex++}`);
      values.push(`%${value}%`);
    } else if (['uuid', 'isbn'].includes(key)) {
      conditions.push(`b.${key} = $${paramIndex++}`);
      values.push(value);
    }
  });

  // Handle the 'status' filter using the calculated counts.
  if (criteria.status) {
    if (criteria.status.toLowerCase() === 'available') {
      // A book is available if its total quantity is greater than the number borrowed.
      conditions.push(`(b.quantity > COALESCE(loan_details.borrowed_count, 0))`);
    } else if (criteria.status.toLowerCase() === 'borrowed') {
      // A book is considered "borrowed" if at least one copy is on loan.
      conditions.push(`COALESCE(loan_details.borrowed_count, 0) > 0`);
    }
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }
  
  query += " ORDER BY b.title ASC;";

  try {
    const books = await db.any(query, values);
    return books;
  } catch (err) {
    console.error("Error executing find_books query:", err);
    throw err;
  }
}