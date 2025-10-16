drop table if exists books;
create table books (
	internal_id serial primary key,
	book_id varchar(36) not null,
	title varchar(255) not null,
	author varchar(255) not null,
	publisher varchar(255) null,
	genre varchar(255) null,
	isbn varchar(20) unique,
	page_count int null,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	last_modified timestamptz NULL
);