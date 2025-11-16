import { Router } from 'express';
import { createComment, getComments } from '../controllers/comment.controller';
import { validate } from '../middleware/validate';
import { CreateCommentSchema, GetCommentsSchema } from '../validators/comment.validator';

const router = Router();

// POST /api/designs/:id/comments - Create a comment for a design
router.post('/:id/comments', validate(CreateCommentSchema), createComment);

// GET /api/designs/:id/comments - Get all comments for a design
router.get('/:id/comments', validate(GetCommentsSchema), getComments);

export default router;

