// Layer types
export type LayerType = 'text' | 'image' | 'shape';
export type ShapeType = 'rectangle' | 'circle';

// Layer interface
export interface ILayer {
  id: string;
  type: LayerType;
  name: string;
  zIndex: number;
  visible: boolean;
  locked: boolean;
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
export interface IDesign {
  name: string;
  width: number;
  height: number;
  layers: ILayer[];
  thumbnail?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Comment interface
export interface IComment {
  designId: string;
  content: string;
  mentions: string[];
  author: string;
  createdAt?: Date;
}

