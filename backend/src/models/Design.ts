import mongoose, { Schema, Document } from 'mongoose';
import { IDesign, ILayer } from '../types';

// Layer subdocument schema
const LayerSchema = new Schema<ILayer>(
  {
    id: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'shape'],
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    zIndex: {
      type: Number,
      required: true,
      default: 0,
    },
    position: {
      x: { type: Number, required: true, default: 0 },
      y: { type: Number, required: true, default: 0 },
    },
    dimensions: {
      width: { type: Number, required: true },
      height: { type: Number, required: true },
    },
    rotation: {
      type: Number,
      required: true,
      default: 0,
    },
    visible: {
      type: Boolean,
      required: true,
      default: true,
    },
    locked: {
      type: Boolean,
      required: true,
      default: false,
    },
    // Text-specific properties
    text: {
      content: { type: String },
      fontFamily: { type: String },
      fontSize: { type: Number },
      color: { type: String },
    },
    // Image-specific properties
    image: {
      url: { type: String },
      opacity: { type: Number, min: 0, max: 1 },
    },
    // Shape-specific properties
    shape: {
      shapeType: { type: String, enum: ['rectangle', 'circle'] },
      fill: { type: String },
      stroke: { type: String },
      strokeWidth: { type: Number },
    },
  },
  { _id: false }
);

// Design schema
const DesignSchema = new Schema<IDesign & Document>(
  {
    name: {
      type: String,
      required: [true, 'Design name is required'],
      trim: true,
      minlength: [1, 'Design name cannot be empty'],
      maxlength: [100, 'Design name cannot exceed 100 characters'],
    },
    width: {
      type: Number,
      required: true,
      default: 1080,
      min: [1, 'Width must be at least 1'],
      max: [10000, 'Width cannot exceed 10000'],
    },
    height: {
      type: Number,
      required: true,
      default: 1080,
      min: [1, 'Height must be at least 1'],
      max: [10000, 'Height cannot exceed 10000'],
    },
    layers: {
      type: [LayerSchema],
      default: [],
    },
    thumbnail: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
DesignSchema.index({ updatedAt: -1 });
DesignSchema.index({ createdAt: -1 });

export const Design = mongoose.model<IDesign & Document>('Design', DesignSchema);

