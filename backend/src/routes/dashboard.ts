import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  res.json({
    projects: [],
    tasks: [],
    documents: [],
    activities: []
  });
});

export default router; 