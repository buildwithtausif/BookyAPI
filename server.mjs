import express from 'express';
import router from './routes/lib.routes.mjs';
// create an express-server
const server = express();
// the middleware issue :'( earlier I've not included it coz, was not getting it but now ik
server.use(express.json()); // to handle json request body as express does not parse json out-of-the box we need to explicitly define it to handle such requests
const port = 8000;

// use a static page to on /
server.use(express.static('public'));
// routes definition is listed here
server.use('/api', router);

// start the server
server.listen(port, () => {
    console.log(`express-server is running at host:${port}`);
});