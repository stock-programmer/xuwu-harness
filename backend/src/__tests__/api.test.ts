import request from 'supertest';
import { Express } from 'express';
import { createApp } from '../app';
import { sequelize } from '../config/database';
import { Project } from '../models/Project';

describe('API Integration Tests', () => {
  let app: Express;

  beforeAll(async () => {
    // Initialize database
    await sequelize.sync({ force: true });

    // Create app (orchestrator now created per-project)
    app = createApp();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  afterEach(async () => {
    // Clean up database after each test
    await Project.destroy({ where: {}, truncate: true });
  });

  describe('GET /', () => {
    it('should return API information', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('environment');
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('services');
    });

    it('should check database health', async () => {
      const response = await request(app).get('/health');

      expect(response.body.services).toHaveProperty('database');
      expect(response.body.services.database).toBe('healthy');
    });
  });

  describe('POST /api/projects', () => {
    it('should create a new project', async () => {
      const response = await request(app).post('/api/projects').send({
        name: 'Test Project',
        type: 'backend',
        root_path: '/test/path',
        status: 'active',
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe('Test Project');
    });

    it('should validate required fields', async () => {
      const response = await request(app).post('/api/projects').send({
        name: 'Test Project',
        // missing type and root_path
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate project type', async () => {
      const response = await request(app).post('/api/projects').send({
        name: 'Test Project',
        type: 'invalid-type',
        root_path: '/test/path',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/projects', () => {
    it('should list all projects', async () => {
      // Create test projects
      await Project.create({
        name: 'Project 1',
        type: 'backend',
        root_path: '/test/path1',
        status: 'active',
      });

      await Project.create({
        name: 'Project 2',
        type: 'frontend',
        root_path: '/test/path2',
        status: 'active',
      });

      const response = await request(app).get('/api/projects');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.projects).toHaveLength(2);
    });

    it('should support pagination', async () => {
      // Create multiple projects
      for (let i = 0; i < 15; i++) {
        await Project.create({
          name: `Project ${i}`,
          type: 'backend',
          root_path: `/test/path${i}`,
          status: 'active',
        });
      }

      const response = await request(app).get('/api/projects?limit=5&offset=0');

      expect(response.status).toBe(200);
      expect(response.body.data.projects).toHaveLength(5);
      expect(response.body.data.pagination.total).toBe(15);
    });

    it('should filter by status', async () => {
      await Project.create({
        name: 'Active Project',
        type: 'backend',
        root_path: '/test/path1',
        status: 'active',
      });

      await Project.create({
        name: 'Completed Project',
        type: 'backend',
        root_path: '/test/path2',
        status: 'completed',
      });

      const response = await request(app).get('/api/projects?status=active');

      expect(response.status).toBe(200);
      expect(response.body.data.projects).toHaveLength(1);
      expect(response.body.data.projects[0].name).toBe('Active Project');
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should get project details', async () => {
      const project = await Project.create({
        name: 'Test Project',
        type: 'backend',
        root_path: '/test/path',
        status: 'active',
      });

      const response = await request(app).get(`/api/projects/${project.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.project.id).toBe(project.id);
      expect(response.body.data.stats).toBeDefined();
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app).get(
        '/api/projects/00000000-0000-0000-0000-000000000000'
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('should update a project', async () => {
      const project = await Project.create({
        name: 'Test Project',
        type: 'backend',
        root_path: '/test/path',
        status: 'active',
      });

      const response = await request(app).put(`/api/projects/${project.id}`).send({
        name: 'Updated Project',
        status: 'completed',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Project');
      expect(response.body.data.status).toBe('completed');
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .put('/api/projects/00000000-0000-0000-0000-000000000000')
        .send({
          name: 'Updated Project',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('should delete a project', async () => {
      const project = await Project.create({
        name: 'Test Project',
        type: 'backend',
        root_path: '/test/path',
        status: 'active',
      });

      const response = await request(app).delete(`/api/projects/${project.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify project is deleted
      const found = await Project.findByPk(project.id);
      expect(found).toBeNull();
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app).delete(
        '/api/projects/00000000-0000-0000-0000-000000000000'
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/api/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Not Found');
    });
  });
});
