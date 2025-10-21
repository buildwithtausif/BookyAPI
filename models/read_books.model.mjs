import db from "./db.mjs";

/**
 * Finds all unique books, calculates their borrowed and available quantities.
 * @param {object} criteria - An object containing filter criteria.
 * @returns {Promise<Array>} - An array of unique book objects with inventory counts.
 */
const find_books = async (criteria = {}) => {
  // This query uses a subquery to count loans before joining, ensuring one row per book.
  let query = `
    SELECT 
      b.uuid, 
      b.title, 
      b.author, 
      b.publisher, 
      b.genre, 
      b.isbn, 
      b.quantity,
      -- Use COALESCE to show 0 instead of NULL if a book has no loans
      COALESCE(loan_counts.borrowed_count, 0)::int AS borrowed_count,
      -- Calculate the available quantity on the fly
      (b.quantity - COALESCE(loan_counts.borrowed_count, 0))::int AS available_quantity,
      b.created_at,
      b.last_modified
    FROM 
      public.books b
    LEFT JOIN (
      -- This subquery first calculates the number of active loans for each unique book
      SELECT 
        book_id, 
        COUNT(*) AS borrowed_count 
      FROM 
        public.borrow_logs 
      WHERE 
        return_date IS NULL 
      GROUP BY 
        book_id
    ) AS loan_counts ON b.uuid = loan_counts.book_id
  `;

  const conditions = [];
  const values = [];
  let paramIndex = 1;

  // Safely iterate over criteria properties.
  Object.keys(criteria).forEach((key) => {
    if (key === "status") return; // Status is handled separately.
    const value = criteria[key];
    if (["title", "author", "genre", "publisher"].includes(key)) {
      conditions.push(`b.${key} ILIKE $${paramIndex++}`);
      values.push(`%${value}%`);
    } else if (["uuid", "isbn"].includes(key)) {
      conditions.push(`b.${key} = $${paramIndex++}`);
      values.push(value);
    }
  });

  // Handle the 'status' filter using the calculated counts.
  if (criteria.status) {
    if (criteria.status.toLowerCase() === "available") {
      // A book is available if its total quantity is greater than the number borrowed.
      conditions.push(`(b.quantity > COALESCE(loan_counts.borrowed_count, 0))`);
    } else if (criteria.status.toLowerCase() === "borrowed") {
      // A book is considered "borrowed" if at least one copy is on loan.
      conditions.push(`COALESCE(loan_counts.borrowed_count, 0) > 0`);
    }
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }

  query += " ORDER BY b.title ASC;";

  try {
    const data = await db.any(query, values);
    return data;
  } catch (err) {
    console.error("Error executing find_book_inventory query:", err);
    throw err;
  }
};

export default find_books;
