import db, { pgp } from "./db.mjs";
/*
    CUD_books model handles
    CREATE, UPDATE and DELETE requests from the controller
    for READ requests check ./read_books.model.mjs
*/

// Create
export async function insertBooks(book_stack) {
  console.log("insertBooks called!");
  console.log("Book stack:", book_stack);

  // mapping between js object keys and db cols
  const col_set = new pgp.helpers.ColumnSet(
    ["uuid", "title", "author", "publisher", "genre", "isbn", "quantity"],
    { table: "books" }
  );

  // create query
  const post_query = pgp.helpers.insert(book_stack, col_set) + " RETURNING *";
  console.log({ query: `${post_query}` });
  try {
    const new_entries = await db.any(post_query);
    return new_entries;
  } catch (err) {
    console.error("InsertBooks error:", err);
    throw err;
  }
}

/*
example usage:-

    await editBooks(
        '18a84cae-a6c1-45ef-b9e5-2ac3a4740b6f', // uuid
        null, // isbn optional
        [
            { colName: 'title', value: 'Gunahon Ka Devta (Revised Edition)' },
            { colName: 'price', value: 399 },
        ]
    );

*/

// Update
export async function editBooks(uuid, isbn, edited_book_stack) {
  // since edited_book_stack is an array therefore i need to create the query a little dynamically
  if (!edited_book_stack || edited_book_stack.length === 0) {
    throw new Error("No updates provided");
  }

  // to build SET query
  const setParts = edited_book_stack.map((item, i) => {
    return `"${item.colName}" = COALESCE($${i + 3}, "${item.colName}")`;
  });

  // last modify logic
  const lastModify_flag = edited_book_stack.map((item, i) => {
    return `($${i + 3} IS NOT NULL AND books.${
      item.colName
    } IS DISTINCT FROM $${i + 3})`;
  });

  const put_query = `
        UPDATE public.books
        SET
            ${setParts.join(", ")},
            last_modified = 
            CASE 
                WHEN 
                    ${lastModify_flag.join(" OR ")}
                THEN now()
                ELSE last_modified
            END
        WHERE
            uuid = $1 OR isbn = $2
        RETURNING uuid, isbn, title, author, publisher, genre, quantity, created_at,last_modified;
    `;

  // param.
  const params = [uuid, isbn, ...edited_book_stack.map((item) => item.value)];
  try {
    const updated_data = await db.oneOrNone(put_query, params);
    return updated_data;
  } catch (err) {
    console.log(err);
  }
}

// Delete using isbn or uuid
export async function deleteBook(uuid,isbn) {
    let delete_query = `
        DELETE FROM public.books
        WHERE
            uuid = $1 OR isbn = $2
            RETURNING uuid, isbn, title, author, publisher, genre, quantity, created_at, last_modified
    `;

    try {
        const deleted_book = await db.oneOrNone(delete_query, [uuid,isbn]);
        return deleted_book;
    } catch (err) {
        console.log(err);
    }
}