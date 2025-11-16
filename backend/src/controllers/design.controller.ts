import { Request, Response, NextFunction } from 'express';
import { Design } from '../models/Design';
import { AppError } from '../middleware/errorHandler';

// Create a new design
export const createDesign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, width, height, layers, thumbnail } = req.body;

    const design = new Design({
      name,
      width: width || 1080,
      height: height || 1080,
      layers: layers || [],
      thumbnail,
    });

    await design.save();

    res.status(201).json({
      success: true,
      data: design,
    });
  } catch (error) {
    next(error);
  }
};

// Get all designs with pagination and sorting
export const listDesigns = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortBy = (req.query.sortBy as string) || 'updatedAt';
    const order = (req.query.order as string) || 'desc';

    const skip = (page - 1) * limit;
    const sortOrder = order === 'asc' ? 1 : -1;

    const [designs, total] = await Promise.all([
      Design.find()
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Design.countDocuments(),
    ]);

    res.json({
      success: true,
      data: designs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get a single design by ID
export const getDesign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const design = await Design.findById(id);

    if (!design) {
      throw new AppError('DESIGN_NOT_FOUND', 'Design not found', 404);
    }

    res.json({
      success: true,
      data: design,
    });
  } catch (error) {
    next(error);
  }
};

// Update a design
export const updateDesign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const design = await Design.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!design) {
      throw new AppError('DESIGN_NOT_FOUND', 'Design not found', 404);
    }

    res.json({
      success: true,
      data: design,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a design
export const deleteDesign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const design = await Design.findByIdAndDelete(id);

    if (!design) {
      throw new AppError('DESIGN_NOT_FOUND', 'Design not found', 404);
    }

    res.json({
      success: true,
      message: 'Design deleted successfully',
      data: { id },
    });
  } catch (error) {
    next(error);
  }
};

