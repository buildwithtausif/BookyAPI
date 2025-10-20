import express from "express";
import user_router from "./routes/user.routes.mjs";
import book_router from "./routes/book.routes.mjs";
import borrow_router from "./routes/borrow.routes.mjs";
import return_router from "./routes/return.routes.mjs";
// create an express-server
const server = express();
// the middleware issue :'( earlier I've not included it coz, was not getting it but now ik
server.use(express.json()); // to handle json request body as express does not parse json out-of-the box we need to explicitly define it to handle such requests
const port = 8000;

// use a static page to on /
server.use(express.static("public"));
// routes definition is listed here
server.use("/api/users", user_router);
server.use("/api/books", book_router);
server.use("/api/borrow", borrow_router);
server.use("/api/return", return_router);
// start the server
server.listen(port, () => {
  console.log(`express-server is running at host:${port}`);
});
