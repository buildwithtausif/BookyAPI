# Library Management System API

This is a robust RESTful API for a Library Management System, built with Node.js, Express, and PostgreSQL. It features a clean, separated architecture (MVC + Services), transactional integrity for borrowing, and a CQRS (Command Query Responsibility Segregation) pattern for efficient book management.

## Key Features

* **User Management:** Full CRUD (Create, Read, Update, Delete) operations for library users.
* **Book Management:** Full CRUD operations for books. Supports adding single books or batches of books in one request.
* **Borrowing & Returns:** Transaction-safe system for users to borrow and return books.
* **Advanced Book Search:** A dedicated read model allows for complex queries, including:
    * Dynamic filtering by title, author, genre, publisher, UUID, or ISBN.
    * Filtering by status (`available` or `borrowed`).
    * Aggregation of all active loan details (borrower, due date) nested within each book object.
* **Business Rule Enforcement:**
    * **Overdue Prevention:** Users with overdue books are blocked from borrowing new items.
    * **Borrowing Limit:** Users are limited to a maximum of 3 concurrent borrows.
    * **Due Dates:** Books are automatically assigned a 14-day due date upon borrowing.
    * **Availability Check:** Real-time checking of book quantity vs. borrowed count prevents over-borrowing. This check is also performed inside the database transaction to prevent race conditions.
* **Secure & Unique IDs:**
    * **Users:** Uses a custom, human-readable, and time-based public ID (e.g., `25301-A4FGHJ`).
    * **Books & Transactions:** Uses standard, cryptographically secure UUIDs (v4).

## Architecture

This project follows a modern Node.js application structure, separating concerns for maintainability and scalability.

1.  **MVC (Model-View-Controller) Pattern:**
    * **Routes (`.routes.mjs`):** Define the API endpoints and map them to the appropriate controller functions.
    * **Controllers (`.ctrl.mjs`):** Handle incoming HTTP requests, validate input, and orchestrate the business logic by calling services and models. They are responsible for sending the final HTTP response.
    * **Models (`.model.mjs`):** Represent the data layer. All database interaction (SQL queries) is encapsulated within the model files, using `pg-promise` to communicate with the PostgreSQL database.

2.  **Service Layer (`.service.mjs`):**
    * Used to abstract complex business logic and helper functions away from the controllers.
    * **Book Service:** Enforces business rules, such as preventing updates to protected columns (e.g., `created_at`) and validating that `uuid` and `isbn` match the same book before an update or delete operation.
    * **ID Service:** A dedicated service for generating custom user IDs and standard UUIDs.

3.  **CQRS (Command Query Responsibility Segregation):**
    * This pattern is explicitly used for the `books` resource.
    * **Commands (Write):** Create, Update, and Delete operations are handled by `cud_books.model.mjs`. These are simple, direct operations.
    * **Queries (Read):** All read operations are handled by `read_books.model.mjs`. This file contains a more complex, optimized SQL query designed to join, aggregate, and calculate data (like `available_quantity` and nested `loans`) efficiently for display.

4.  **Database (`db.mjs`):**
    * Uses `pg-promise` to manage the PostgreSQL database connection.
    * Employs database transactions (`db.tx`) in critical operations like borrowing books to ensure data integrity. If any part of the borrow process fails, the entire transaction is rolled back.

## API Endpoints

### User API

**Route prefix:** `/api/users`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Retrieves a list of all users. Can also be used to find a single user by query parameters (`?public_id=` or `?email=`). |
| `POST` | `/` | Registers a new user. Requires `name` and `email` in the body. |
| `PATCH` | `/:public_id` | Updates an existing user's details. Can provide `newName` and/or `newEmail` in the body. |
| `DELETE` | `/:public_id` | Deletes a user by their `public_id`. |

### Book API

**Route prefix:** `/api/books`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Retrieves a list of all books. Supports extensive query filters: `?title=`, `?author=`, `?genre=`, `?publisher=`, `?uuid=`, `?isbn=`, and `?status=available` or `?status=borrowed`. |
| `POST` | `/` | Adds a new book or a batch of books. The body can be a single book object or an array of book objects. |
| `PATCH` | `/` | Updates a book. Requires either `uuid` or `isbn` in the body, along with an `edit_book_stack` array of changes. |
| `DELETE`| `/` | Deletes a book. Requires either `uuid` or `isbn` in the request. |

### Transaction API

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/borrow` | Borrows one or more books. The body must contain the user's `public_id` and an array of `books` (each with a `uuid`) to be borrowed. |
| `PATCH` | `/api/return` | Returns one or more books. The body must be an array of `transaction_id` objects to be returned. |

## Inferred Database Schema

Based on the models, the following database tables are expected:

#### `public.users`

| Column | Type | Description |
| :--- | :--- | :--- |
| `public_id` | `VARCHAR` | **Primary Key**. The custom-generated ID (e.g., `25301-A4FGHJ`). |
| `name` | `VARCHAR` | User's full name. |
| `email` | `VARCHAR` | User's email (unique). |
| `created_at` | `TIMESTAMP` | Timestamp of user creation. |
| `last_modified` | `TIMESTAMP` | Timestamp of last user update. |

#### `public.books`

| Column | Type | Description |
| :--- | :--- | :--- |
| `uuid` | `UUID` | **Primary Key**. The unique identifier for the book. |
| `title` | `VARCHAR` | The title of the book. |
| `author` | `VARCHAR` | The author of the book. |
| `publisher` | `VARCHAR` | The book's publisher. |
| `genre` | `VARCHAR` | The genre of the book. |
| `isbn` | `VARCHAR` | The 13-digit ISBN (unique). |
| `quantity` | `INTEGER` | The total number of copies of this book in the library. |
| `created_at` | `TIMESTAMP` | Timestamp of book creation. |
| `last_modified` | `TIMESTAMP` | Timestamp of last book update. |

#### `public.borrow_logs`

| Column | Type | Description |
| :--- | :--- | :--- |
| `transaction_id`| `UUID` | **Primary Key**. The unique ID for this borrow event. |
| `user_id` | `VARCHAR` | **Foreign Key**. References `users.public_id`. |
| `book_id` | `UUID` | **Foreign Key**. References `books.uuid`. |
| `borrow_date` | `TIMESTAMP` | The exact date and time the book was borrowed. |
| `due_date` | `TIMESTAMP` | The date the book is due (borrow_date + 14 days). |
| `return_date` | `TIMESTAMP` | `NULL` if the book is still borrowed. Set to `NOW()` when returned. |

## Getting Started

1.  **Clone the repository:**
    ```sh
    git clone <repository-url>
    cd <repository-name>
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add your PostgreSQL connection details:
    ```env
    PSQL_USER=your_postgres_user
    PSQL_PASS=your_postgres_password
    PSQL_DB=your_library_database_name
    ```
    *(Note: The code also references `localhost:5600` as the database host/port.)*

4.  **Run the application:**
    ```sh
    npm start
    ```