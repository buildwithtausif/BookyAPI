import express from 'express';
import {getusers , reg_newuser} from '../controllers/users.ctrl.mjs';
// pre-fix all routes with /api/{given_endpoint} 
const router = express.Router()
// handle get request for this route and call listbooks function from controller
router.get('/list-users', getusers);
router.post('/register', reg_newuser);

export default router;