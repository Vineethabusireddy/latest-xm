import express from 'express';
import { 
  generateToken, 
  getToken, 
  
  startAutoTokenGeneration,
  stopAutoTokenGeneration
} from '../controllers/woohooTokenController.js';

const router = express.Router();

// Manual token operations
router.post('/generate', generateToken);
router.get('/', getToken);
;

// Automatic token generation control
router.post('/auto/start', startAutoTokenGeneration);
router.post('/auto/stop', stopAutoTokenGeneration);

export default router; 