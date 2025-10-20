CREATE TABLE borrow_logs (
    log_id UUID PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    book_id UUID NOT NULL,
    borrow_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMPTZ NOT NULL,
    return_date TIMESTAMPTZ,
    CONSTRAINT fk_user
        FOREIGN KEY(user_id) 
        REFERENCES users(public_id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_book
        FOREIGN KEY(book_id) 
        REFERENCES books(uuid)
        ON DELETE RESTRICT
);

CREATE INDEX idx_borrow_logs_user_id ON borrow_logs(user_id);
CREATE INDEX idx_borrow_logs_book_id ON borrow_logs(book_id);
CREATE INDEX idx_borrow_logs_return_date ON borrow_logs(return_date);
