import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { Design } from '../src/models/Design';
import { Comment } from '../src/models/Comment';

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
  await Comment.deleteMany({});
});

describe('Comment API', () => {
  let testDesignId: string;

  beforeEach(async () => {
    const design = await Design.create({
      name: 'Test Design',
      width: 1080,
      height: 1080,
      layers: [],
    });
    testDesignId = (design._id as mongoose.Types.ObjectId).toString();
  });

  describe('POST /api/designs/:id/comments', () => {
    it('should create a comment', async () => {
      const response = await request(app)
        .post(`/api/designs/${testDesignId}/comments`)
        .send({
          content: 'This is a test comment',
          author: 'John Doe',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe('This is a test comment');
      expect(response.body.data.author).toBe('John Doe');
      expect(response.body.data.mentions).toEqual([]);
    });

    it('should extract mentions from comment content', async () => {
      const response = await request(app)
        .post(`/api/designs/${testDesignId}/comments`)
        .send({
          content: 'Hey @john and @jane, check this out!',
          author: 'Bob',
        })
        .expect(201);

      expect(response.body.data.mentions).toHaveLength(2);
      expect(response.body.data.mentions).toContain('john');
      expect(response.body.data.mentions).toContain('jane');
    });

    it('should handle duplicate mentions', async () => {
      const response = await request(app)
        .post(`/api/designs/${testDesignId}/comments`)
        .send({
          content: 'Hey @john, @john needs to see this @john',
          author: 'Alice',
        })
        .expect(201);

      expect(response.body.data.mentions).toHaveLength(1);
      expect(response.body.data.mentions).toContain('john');
    });

    it('should return 404 for non-existent design', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post(`/api/designs/${fakeId}/comments`)
        .send({
          content: 'Test comment',
          author: 'John',
        })
        .expect(404);

      expect(response.body.code).toBe('DESIGN_NOT_FOUND');
    });

    it('should reject comment without content', async () => {
      const response = await request(app)
        .post(`/api/designs/${testDesignId}/comments`)
        .send({
          author: 'John',
        })
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject comment without author', async () => {
      const response = await request(app)
        .post(`/api/designs/${testDesignId}/comments`)
        .send({
          content: 'Test comment',
        })
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject comment that is too long', async () => {
      const longContent = 'a'.repeat(1001);
      const response = await request(app)
        .post(`/api/designs/${testDesignId}/comments`)
        .send({
          content: longContent,
          author: 'John',
        })
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/designs/:id/comments', () => {
    beforeEach(async () => {
      // Create test comments
      await Comment.create([
        {
          designId: testDesignId,
          content: 'Comment 1',
          author: 'User 1',
          mentions: [],
        },
        {
          designId: testDesignId,
          content: 'Comment 2 @user1',
          author: 'User 2',
          mentions: ['user1'],
        },
        {
          designId: testDesignId,
          content: 'Comment 3',
          author: 'User 3',
          mentions: [],
        },
      ]);
    });

    it('should get all comments for a design', async () => {
      const response = await request(app)
        .get(`/api/designs/${testDesignId}/comments`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination.total).toBe(3);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`/api/designs/${testDesignId}/comments?page=1&limit=2`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.pagination.totalPages).toBe(2);
    });

    it('should return comments in reverse chronological order', async () => {
      const response = await request(app)
        .get(`/api/designs/${testDesignId}/comments`)
        .expect(200);

      // Most recent first
      expect(response.body.data[0].content).toBe('Comment 3');
      expect(response.body.data[2].content).toBe('Comment 1');
    });

    it('should return 404 for non-existent design', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/designs/${fakeId}/comments`)
        .expect(404);

      expect(response.body.code).toBe('DESIGN_NOT_FOUND');
    });

    it('should return empty array for design with no comments', async () => {
      const newDesign = await Design.create({
        name: 'Design Without Comments',
        width: 1080,
        height: 1080,
        layers: [],
      });

      const response = await request(app)
        .get(`/api/designs/${newDesign._id}/comments`)
        .expect(200);

      expect(response.body.data).toHaveLength(0);
      expect(response.body.pagination.total).toBe(0);
    });
  });

  describe('Error Response Format', () => {
    it('should return structured error for validation errors', async () => {
      const response = await request(app)
        .post('/api/designs')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('details');
      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(response.body.message).toBe('Validation failed');
      expect(Array.isArray(response.body.details)).toBe(true);
    });

    it('should return structured error for not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/designs/${fakeId}`)
        .expect(404);

      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('message');
      expect(response.body.code).toBe('DESIGN_NOT_FOUND');
      expect(response.body.message).toBe('Design not found');
    });

    it('should return structured error for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/designs/invalid-id')
        .expect(400);

      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('message');
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });
});

