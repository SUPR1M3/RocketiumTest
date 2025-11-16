// Layer types
export type LayerType = 'text' | 'image' | 'shape';
export type ShapeType = 'rectangle' | 'circle';

// Layer interface
export interface Layer {
  id: string;
  type: LayerType;
  name: string;
  zIndex: number;
  visible: boolean; // Controls visibility on canvas
  locked: boolean; // Prevents editing when true
  position: {
    x: number;
    y: number;
  };
  dimensions: {
    width: number;
    height: number;
  };
  rotation: number;
  // Type-specific properties
  text?: {
    content: string;
    fontFamily: string;
    fontSize: number;
    color: string;
  };
  image?: {
    url: string;
    opacity?: number;
  };
  shape?: {
    shapeType: ShapeType;
    fill: string;
    stroke?: string;
    strokeWidth?: number;
  };
}

// Design interface
export interface Design {
  _id: string;
  name: string;
  width: number;
  height: number;
  layers: Layer[];
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
}

// Comment interface
export interface Comment {
  _id: string;
  designId: string;
  content: string;
  mentions: string[];
  author: string;
  createdAt: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

// History state for undo/redo
export interface HistoryState {
  layers: Layer[];
  selectedLayerId: string | null;
}




