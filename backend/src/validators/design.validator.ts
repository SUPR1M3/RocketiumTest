import { z } from 'zod';

// Layer validation schemas
const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

const DimensionsSchema = z.object({
  width: z.number().positive('Width must be positive'),
  height: z.number().positive('Height must be positive'),
});

const TextPropertiesSchema = z.object({
  content: z.string().min(1, 'Text content cannot be empty'),
  fontFamily: z.string().min(1, 'Font family is required'),
  fontSize: z.number().positive('Font size must be positive'),
  color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, 'Invalid color format (use hex color)'),
});

const ImagePropertiesSchema = z.object({
  url: z.string().url('Invalid image URL'),
  opacity: z.number().min(0).max(1).optional(),
});

const ShapePropertiesSchema = z.object({
  shapeType: z.enum(['rectangle', 'circle'], {
    message: 'Shape type must be rectangle or circle',
  }),
  fill: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, 'Invalid fill color (use hex color)'),
  stroke: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, 'Invalid stroke color (use hex color)').optional(),
  strokeWidth: z.number().nonnegative().optional(),
});

const LayerSchema = z.object({
  id: z.string().uuid('Layer ID must be a valid UUID'),
  type: z.enum(['text', 'image', 'shape'], {
    message: 'Layer type must be text, image, or shape',
  }),
  name: z.string().min(1, 'Layer name cannot be empty').max(100, 'Layer name too long'),
  zIndex: z.number().int('Z-index must be an integer'),
  visible: z.boolean().default(true as const),
  locked: z.boolean().default(false as const),
  position: PositionSchema,
  dimensions: DimensionsSchema,
  rotation: z.number(),
  text: TextPropertiesSchema.optional(),
  image: ImagePropertiesSchema.optional(),
  shape: ShapePropertiesSchema.optional(),
}).refine(
  (data) => {
    // Ensure type-specific properties match the layer type
    if (data.type === 'text' && !data.text) {
      return false;
    }
    if (data.type === 'image' && !data.image) {
      return false;
    }
    if (data.type === 'shape' && !data.shape) {
      return false;
    }
    return true;
  },
  {
    message: 'Layer must have properties matching its type',
  }
);

// Design validation schemas
export const CreateDesignSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Design name is required').max(100, 'Design name too long').trim(),
    width: z.number().int().min(1).max(10000).default(1080),
    height: z.number().int().min(1).max(10000).default(1080),
    layers: z.array(LayerSchema).default([]),
    thumbnail: z.string().url().optional(),
  }),
});

export const UpdateDesignSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid design ID format'),
  }),
  body: z.object({
    name: z.string().min(1).max(100).trim().optional(),
    width: z.number().int().min(1).max(10000).optional(),
    height: z.number().int().min(1).max(10000).optional(),
    layers: z.array(LayerSchema).optional(),
    thumbnail: z.string().url().optional(),
  }),
});

export const GetDesignSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid design ID format'),
  }),
});

export const DeleteDesignSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid design ID format'),
  }),
});

export const ListDesignsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default(() => 1),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default(() => 10),
    sortBy: z.enum(['createdAt', 'updatedAt', 'name']).optional().default(() => 'updatedAt' as const),
    order: z.enum(['asc', 'desc']).optional().default(() => 'desc' as const),
  }),
});

