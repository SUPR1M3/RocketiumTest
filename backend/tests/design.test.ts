import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { Design } from '../src/models/Design';

// Test database connection
beforeAll(async () => {
  const mongoUri = 'mongodb://localhost:27017/canvas-editor-test';
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

afterEach(async () => {
  await Design.deleteMany({});
});

describe('Design API', () => {
  describe('POST /api/designs', () => {
    it('should create a new design with default values', async () => {
      const response = await request(app)
        .post('/api/designs')
        .send({
          name: 'Test Design',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.name).toBe('Test Design');
      expect(response.body.data.width).toBe(1080);
      expect(response.body.data.height).toBe(1080);
      expect(response.body.data.layers).toEqual([]);
    });

    it('should create a design with custom dimensions', async () => {
      const response = await request(app)
        .post('/api/designs')
        .send({
          name: 'Custom Design',
          width: 1920,
          height: 1080,
        })
        .expect(201);

      expect(response.body.data.width).toBe(1920);
      expect(response.body.data.height).toBe(1080);
    });

    it('should create a design with layers', async () => {
      const layer = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        type: 'text',
        name: 'Text Layer',
        zIndex: 0,
        position: { x: 100, y: 100 },
        dimensions: { width: 200, height: 50 },
        rotation: 0,
        text: {
          content: 'Hello World',
          fontFamily: 'Arial',
          fontSize: 24,
          color: '#000000',
        },
      };

      const response = await request(app)
        .post('/api/designs')
        .send({
          name: 'Design with Layers',
          layers: [layer],
        })
        .expect(201);

      expect(response.body.data.layers).toHaveLength(1);
      expect(response.body.data.layers[0].text.content).toBe('Hello World');
    });

    it('should reject design without name', async () => {
      const response = await request(app)
        .post('/api/designs')
        .send({})
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(response.body.message).toBe('Validation failed');
    });

    it('should reject design with invalid layer (missing type-specific properties)', async () => {
      const invalidLayer = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        type: 'text',
        name: 'Invalid Text Layer',
        zIndex: 0,
        position: { x: 100, y: 100 },
        dimensions: { width: 200, height: 50 },
        rotation: 0,
        // Missing text properties
      };

      const response = await request(app)
        .post('/api/designs')
        .send({
          name: 'Invalid Design',
          layers: [invalidLayer],
        })
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/designs', () => {
    beforeEach(async () => {
      // Create test designs
      await Design.create([
        { name: 'Design 1', width: 1080, height: 1080, layers: [] },
        { name: 'Design 2', width: 1080, height: 1080, layers: [] },
        { name: 'Design 3', width: 1080, height: 1080, layers: [] },
      ]);
    });

    it('should list all designs with pagination', async () => {
      const response = await request(app)
        .get('/api/designs')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination.total).toBe(3);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/designs?page=1&limit=2')
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.pagination.totalPages).toBe(2);
    });

    it('should support sorting by name', async () => {
      const response = await request(app)
        .get('/api/designs?sortBy=name&order=asc')
        .expect(200);

      expect(response.body.data[0].name).toBe('Design 1');
      expect(response.body.data[2].name).toBe('Design 3');
    });
  });

  describe('GET /api/designs/:id', () => {
    it('should get a design by ID', async () => {
      const design = await Design.create({
        name: 'Test Design',
        width: 1080,
        height: 1080,
        layers: [],
      });

      const response = await request(app)
        .get(`/api/designs/${design._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Design');
    });

    it('should return 404 for non-existent design', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/designs/${fakeId}`)
        .expect(404);

      expect(response.body.code).toBe('DESIGN_NOT_FOUND');
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/designs/invalid-id')
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /api/designs/:id', () => {
    it('should update a design', async () => {
      const design = await Design.create({
        name: 'Original Name',
        width: 1080,
        height: 1080,
        layers: [],
      });

      const response = await request(app)
        .put(`/api/designs/${design._id}`)
        .send({
          name: 'Updated Name',
        })
        .expect(200);

      expect(response.body.data.name).toBe('Updated Name');
    });

    it('should update design layers', async () => {
      const design = await Design.create({
        name: 'Test Design',
        width: 1080,
        height: 1080,
        layers: [],
      });

      const newLayer = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        type: 'shape',
        name: 'Rectangle',
        zIndex: 0,
        position: { x: 50, y: 50 },
        dimensions: { width: 150, height: 150 },
        rotation: 0,
        shape: {
          shapeType: 'rectangle',
          fill: '#FF0000',
        },
      };

      const response = await request(app)
        .put(`/api/designs/${design._id}`)
        .send({
          layers: [newLayer],
        })
        .expect(200);

      expect(response.body.data.layers).toHaveLength(1);
      expect(response.body.data.layers[0].shape.fill).toBe('#FF0000');
    });

    it('should return 404 for non-existent design', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/designs/${fakeId}`)
        .send({ name: 'New Name' })
        .expect(404);

      expect(response.body.code).toBe('DESIGN_NOT_FOUND');
    });
  });

  describe('DELETE /api/designs/:id', () => {
    it('should delete a design', async () => {
      const design = await Design.create({
        name: 'To Delete',
        width: 1080,
        height: 1080,
        layers: [],
      });

      const response = await request(app)
        .delete(`/api/designs/${design._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Design deleted successfully');

      // Verify it's deleted
      const deletedDesign = await Design.findById(design._id);
      expect(deletedDesign).toBeNull();
    });

    it('should return 404 for non-existent design', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/designs/${fakeId}`)
        .expect(404);

      expect(response.body.code).toBe('DESIGN_NOT_FOUND');
    });
  });
});

