// ==========================================
// 관리자 컨트롤러
// ==========================================

import { authService } from '../services/auth.service.js';
import { projectsService } from '../services/projects.service.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { BadRequestError } from '../lib/AppError.js';

export const adminController = {
  // POST /api/admin/login  { password }
  login: asyncHandler(async (req, res) => {
    const password = req.body?.password;

    if (typeof password !== 'string' || password.length === 0) {
      throw new BadRequestError('비밀번호를 입력해 주세요.');
    }

    const result = authService.login(password, req.ip);
    res.json({ data: result });
  }),

  // POST /api/admin/logout
  logout: asyncHandler(async (req, res) => {
    res.json({ data: authService.logout(req.adminToken) });
  }),

  // GET /api/admin/session — 토큰이 아직 유효한지 확인
  session: asyncHandler(async (req, res) => {
    res.json({ data: { valid: true } });
  }),

  // GET /api/admin/projects — 초안까지 전부
  list: asyncHandler(async (req, res) => {
    const result = await projectsService.getProjects({
      category: req.query.category ?? 'all',
      includeDrafts: true
    });
    res.json({ data: result });
  }),

  // GET /api/admin/projects/:id
  detail: asyncHandler(async (req, res) => {
    const project = await projectsService.getProjectById(req.params.id, { includeDrafts: true });
    res.json({ data: project });
  }),

  // POST /api/admin/projects
  create: asyncHandler(async (req, res) => {
    const project = await projectsService.createProject(req.body ?? {});
    res.status(201).json({ data: project });
  }),

  // PUT /api/admin/projects/:id
  update: asyncHandler(async (req, res) => {
    const project = await projectsService.updateProject(req.params.id, req.body ?? {});
    res.json({ data: project });
  }),

  // DELETE /api/admin/projects/:id
  remove: asyncHandler(async (req, res) => {
    const result = await projectsService.deleteProject(req.params.id);
    res.json({ data: result });
  })
};
