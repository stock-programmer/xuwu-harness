import { Project } from '../../models/Project';
import { sequelize } from '../../config/database';

describe('Project Model', () => {
  beforeAll(async () => {
    // Sync database for tests
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  afterEach(async () => {
    // Clean up after each test
    await Project.destroy({ where: {}, truncate: true });
  });

  describe('create', () => {
    it('should create a new project', async () => {
      const project = await Project.create({
        name: 'Test Project',
        type: 'backend',
        root_path: '/test/path',
        status: 'active',
      });

      expect(project).toBeDefined();
      expect(project.id).toBeDefined();
      expect(project.name).toBe('Test Project');
      expect(project.type).toBe('backend');
      expect(project.root_path).toBe('/test/path');
      expect(project.status).toBe('active');
    });

    it('should auto-generate UUID for id', async () => {
      const project = await Project.create({
        name: 'Test Project',
        type: 'frontend',
        root_path: '/test/path',
        status: 'active',
      });

      expect(project.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('should set timestamps', async () => {
      const project = await Project.create({
        name: 'Test Project',
        type: 'fullstack',
        root_path: '/test/path',
        status: 'active',
      });

      expect(project.created_at).toBeInstanceOf(Date);
      expect(project.updated_at).toBeInstanceOf(Date);
    });

    it('should create projects with different types', async () => {
      const types = ['backend', 'frontend', 'fullstack'] as const;

      for (const type of types) {
        const project = await Project.create({
          name: `${type} Project`,
          type,
          root_path: '/test/path',
          status: 'active',
        });

        expect(project.type).toBe(type);
      }
    });
  });

  describe('findByPk', () => {
    it('should find project by primary key', async () => {
      const created = await Project.create({
        name: 'Test Project',
        type: 'backend',
        root_path: '/test/path',
        status: 'active',
      });

      const found = await Project.findByPk(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe('Test Project');
    });

    it('should return null for non-existent id', async () => {
      const found = await Project.findByPk('00000000-0000-0000-0000-000000000000');
      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    it('should update project fields', async () => {
      const project = await Project.create({
        name: 'Test Project',
        type: 'backend',
        root_path: '/test/path',
        status: 'active',
      });

      await project.update({
        name: 'Updated Project',
        status: 'completed',
      });

      expect(project.name).toBe('Updated Project');
      expect(project.status).toBe('completed');
    });

    it('should update current_mode', async () => {
      const project = await Project.create({
        name: 'Test Project',
        type: 'backend',
        root_path: '/test/path',
        status: 'active',
      });

      await project.update({ current_mode: 'dev-layer-by-layer' });

      expect(project.current_mode).toBe('dev-layer-by-layer');
    });
  });

  describe('destroy', () => {
    it('should delete a project', async () => {
      const project = await Project.create({
        name: 'Test Project',
        type: 'backend',
        root_path: '/test/path',
        status: 'active',
      });

      await project.destroy();

      const found = await Project.findByPk(project.id);
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should find all projects', async () => {
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

      const projects = await Project.findAll();
      expect(projects).toHaveLength(2);
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

      const activeProjects = await Project.findAll({ where: { status: 'active' } });
      expect(activeProjects).toHaveLength(1);
      expect(activeProjects[0].name).toBe('Active Project');
    });
  });
});
