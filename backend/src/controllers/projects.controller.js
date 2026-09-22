// ==========================================
// 프로젝트 컨트롤러
// ==========================================

import { projectsService } from '../services/projects.service.js';
import { asyncHandler } from '../lib/asyncHandler.js';

export const projectsController = {
  // GET /api/projects?category=web
  list: asyncHandler(async (req, res) => {
    const category = req.query.category ?? 'all';
    const result = await projectsService.getProjects({ category });
    res.json({ data: result });
  }),

  // GET /api/projects/:id
  detail: asyncHandler(async (req, res) => {
    const project = await projectsService.getProjectById(req.params.id);
    res.json({ data: project });
  }),

  // GET /api/categories
  categories: asyncHandler(async (req, res) => {
    const categories = await projectsService.getCategories();
    res.json({ data: categories });
  })
};
