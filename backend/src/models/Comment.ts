import mongoose, { Schema, Document } from 'mongoose';
import { IComment } from '../types';

const CommentSchema = new Schema<IComment & Document>(
  {
    designId: {
      type: String,
      required: [true, 'Design ID is required'],
      ref: 'Design',
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      minlength: [1, 'Comment cannot be empty'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    mentions: {
      type: [String],
      default: [],
    },
    author: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true,
      minlength: [1, 'Author name cannot be empty'],
      maxlength: [50, 'Author name cannot exceed 50 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
CommentSchema.index({ designId: 1, createdAt: -1 });

export const Comment = mongoose.model<IComment & Document>('Comment', CommentSchema);

