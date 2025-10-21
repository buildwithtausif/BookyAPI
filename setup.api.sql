-- =================================================================
-- setup.api.sql
--
-- Description: Initializes the PostgreSQL database schema
--              for the library management system API.
-- Version: 4 (Corrects users.public_id to VARCHAR)
-- =================================================================

-- Set timezone to UTC for consistency in timestamps
SET TIME ZONE 'UTC';

-- Enable the "uuid-ossp" extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =================================================================
-- Drop existing tables (in reverse order of dependency)
-- =================================================================

DROP TABLE IF EXISTS public.borrow_logs;
DROP TABLE IF EXISTS public.books;
DROP TABLE IF EXISTS public.users;

-- =================================================================
-- Create 'users' table
-- Inferred from: users.ctrl.mjs, id_service.mjs
-- Note: 'public_id' is a VARCHAR(12) string (YYDDD-XXXXXX)
-- =================================================================

CREATE TABLE public.users (
    -- 'public_id' is provided by the app as a 12-char string
    public_id VARCHAR(12) PRIMARY KEY,

    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_modified TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.users IS 'Stores user account information.';
COMMENT ON COLUMN public.users.public_id IS 'Human-readable public ID (Format: YYDDD-XXXXXX) (provided by the application).';

-- Index for fast email lookups
CREATE INDEX idx_users_email ON public.users (email);

-- =================================================================
-- Create 'books' table
-- Inferred from: book.ctrl.mjs, id_service.mjs
-- Note: 'uuid' is a standard UUID.
-- =================================================================

CREATE TABLE public.books (
    -- 'uuid' is provided by the app as a standard UUID
    uuid UUID PRIMARY KEY,

    title TEXT NOT NULL,
    author TEXT NOT NULL,
    publisher TEXT,
    genre VARCHAR(100),
    isbn VARCHAR(13) NOT NULL UNIQUE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_modified TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.books IS 'Stores the library''s book inventory and metadata.';
COMMENT ON COLUMN public.books.uuid IS 'Unique identifier for the book entity (provided by the application).';

-- Create indexes for faster searching
CREATE INDEX idx_books_title_search ON public.books (title);
CREATE INDEX idx_books_author_search ON public.books (author);
CREATE INDEX idx_books_genre_search ON public.books (genre);

-- =================================================================
-- Create 'borrow_logs' table
-- Inferred from: borrow.ctrl.mjs, id_service.mjs
-- Note: 'user_id' is VARCHAR(12) to match users.public_id
-- =================================================================

CREATE TABLE public.borrow_logs (
    -- 'transaction_id' is provided by the app as a standard UUID
    transaction_id UUID PRIMARY KEY,

    -- 'user_id' must match the type of 'users.public_id'
    user_id VARCHAR(12) NOT NULL,

    -- 'book_id' links to books.uuid
    book_id UUID NOT NULL,

    borrow_date TIMESTAMPTZ NOT NULL,
    due_date TIMESTAMPTZ NOT NULL,
    return_date TIMESTAMPTZ DEFAULT NULL,

    -- Define Foreign Key constraints
    CONSTRAINT fk_user
        FOREIGN KEY(user_id)
        REFERENCES public.users(public_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_book
        FOREIGN KEY(book_id)
        REFERENCES public.books(uuid)
        ON DELETE CASCADE
);

COMMENT ON TABLE public.borrow_logs IS 'Tracks all book borrowing transactions, active and historical.';
COMMENT ON COLUMN public.borrow_logs.transaction_id IS 'Unique ID for this borrow event (provided by the application).';
COMMENT ON COLUMN public.borrow_logs.user_id IS 'Foreign key linking to the public.users table (YYDDD-XXXXXX).';
COMMENT ON COLUMN public.borrow_logs.book_id IS 'Foreign key linking to the public.books table (UUID).';

-- Create indexes for faster lookups
CREATE INDEX idx_borrow_logs_user_id ON public.borrow_logs (user_id);
CREATE INDEX idx_borrow_logs_book_id ON public.borrow_logs (book_id);

-- Partial index for very fast lookups of *active* loans
CREATE INDEX idx_borrow_logs_active_loans
ON public.borrow_logs (book_id, user_id)
WHERE (return_date IS NULL);

-- =================================================================
-- Script execution complete
-- =================================================================