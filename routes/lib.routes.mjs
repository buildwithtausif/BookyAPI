import express from 'express';
import {getusers , reg_newuser, update_user, delete_user} from '../controllers/users.ctrl.mjs';
// pre-fix all routes with /api/{given_endpoint} 
const router = express.Router()
// handle get request for this route and call listbooks function from controller
router.get('/users', getusers);
router.post('/users/register', reg_newuser);
router.put('/users/:id', update_user);
router.delete('/users/:id', delete_user);
export default router;