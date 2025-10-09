import express from 'express';
import {getusers , reg_newuser, update_user, delete_user} from '../controllers/users.ctrl.mjs';
// pre-fix all routes with /api/{given_endpoint} 
const router = express.Router()
// CRUD routes for /users 
router.get('/users', getusers);
router.post('/users/register', reg_newuser);
router.put('/users/:id', update_user);
router.delete('/users/:id', delete_user);

// CRUD routes for /books
// /books/todb/www/isbn?=key=val
export default router;