import { Request, Response, NextFunction } from 'express';
import { Comment } from '../models/Comment';
import { Design } from '../models/Design';
import { AppError } from '../middleware/errorHandler';
import { extractMentions } from '../validators/comment.validator';

// Create a new comment
export const createComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: designId } = req.params;
    const { content, author } = req.body;

    // Verify design exists
    const design = await Design.findById(designId);
    if (!design) {
      throw new AppError('DESIGN_NOT_FOUND', 'Design not found', 404);
    }

    // Extract mentions from content
    const mentions = extractMentions(content);

    const comment = new Comment({
      designId,
      content,
      author,
      mentions,
    });

    await comment.save();

    res.status(201).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    next(error);
  }
};

// Get all comments for a design
export const getComments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: designId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // Verify design exists
    const design = await Design.findById(designId);
    if (!design) {
      throw new AppError('DESIGN_NOT_FOUND', 'Design not found', 404);
    }

    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      Comment.find({ designId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Comment.countDocuments({ designId }),
    ]);

    res.json({
      success: true,
      data: comments,
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

