import { Router } from 'express';
import {
  createDesign,
  listDesigns,
  getDesign,
  updateDesign,
  deleteDesign,
} from '../controllers/design.controller';
import { validate } from '../middleware/validate';
import {
  CreateDesignSchema,
  UpdateDesignSchema,
  GetDesignSchema,
  DeleteDesignSchema,
  ListDesignsSchema,
} from '../validators/design.validator';

const router = Router();

// POST /api/designs - Create a new design
router.post('/', validate(CreateDesignSchema), createDesign);

// GET /api/designs - List all designs (with pagination and sorting)
router.get('/', validate(ListDesignsSchema), listDesigns);

// GET /api/designs/:id - Get a single design
router.get('/:id', validate(GetDesignSchema), getDesign);

// PUT /api/designs/:id - Update a design
router.put('/:id', validate(UpdateDesignSchema), updateDesign);

// DELETE /api/designs/:id - Delete a design
router.delete('/:id', validate(DeleteDesignSchema), deleteDesign);

export default router;

