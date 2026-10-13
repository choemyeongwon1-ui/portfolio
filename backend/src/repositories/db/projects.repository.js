// ==========================================
// 프로젝트 저장소 — Supabase 구현
// ------------------------------------------
// json/projects.repository.js 와 같은 함수 이름·같은 반환 형태를 지킨다.
// DB 열 이름(team_size, link_url, link_label)과 화면이 쓰는 필드 이름(teamSize, link)이
// 달라서, 테이블(row) ↔ 도메인 객체 변환 함수(toDomain/toRow)를 둔다.
// ==========================================

import { getConnection } from './connection.js';
import { AppError } from '../../lib/AppError.js';

function toDomain(row) {
  return {
    id: row.id,
    status: row.status,
    category: row.category,
    title: row.title,
    role: row.role,
    description: row.description,
    date: row.date,
    teamSize: row.team_size ?? '',
    notes: row.notes ?? '',
    link: row.link_url ? { url: row.link_url, label: row.link_label || '바로가기' } : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toRow(project) {
  const teamSize =
    project.teamSize === '' || project.teamSize === null || project.teamSize === undefined
      ? null
      : project.teamSize;

  return {
    id: project.id,
    status: project.status,
    category: project.category,
    title: project.title,
    role: project.role,
    description: project.description,
    date: project.date,
    team_size: teamSize,
    notes: project.notes,
    link_url: project.link?.url ?? null,
    link_label: project.link?.label ?? null,
    created_at: project.createdAt,
    updated_at: project.updatedAt
  };
}

function sortByNewest(projects) {
  return [...projects].sort((a, b) =>
    String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))
  );
}

function fail(error) {
  throw new AppError(error.message, { status: 500, code: 'DB_ERROR', cause: error });
}

export const projectsRepository = {
  async findAll(filter = {}) {
    const { category, includeDrafts = false } = filter;
    const supabase = getConnection();

    let query = supabase.from('projects').select('*');
    if (!includeDrafts) query = query.eq('status', 'published');
    if (category && category !== 'all') query = query.eq('category', category);

    const { data, error } = await query;
    if (error) fail(error);

    return sortByNewest(data.map(toDomain));
  },

  async findById(id, options = {}) {
    const { includeDrafts = false } = options;
    const supabase = getConnection();

    const { data, error } = await supabase.from('projects').select('*').eq('id', id).maybeSingle();
    if (error) fail(error);
    if (!data) return null;

    const project = toDomain(data);
    if (!includeDrafts && project.status !== 'published') return null;
    return project;
  },

  async create(project) {
    const supabase = getConnection();
    const { data, error } = await supabase
      .from('projects')
      .insert(toRow(project))
      .select()
      .single();

    if (error) fail(error);
    return toDomain(data);
  },

  async update(id, project) {
    const supabase = getConnection();
    const { data, error } = await supabase
      .from('projects')
      .update(toRow(project))
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) fail(error);
    return data ? toDomain(data) : null;
  },

  async remove(id) {
    const supabase = getConnection();
    const { data, error } = await supabase.from('projects').delete().eq('id', id).select();

    if (error) fail(error);
    return data.length > 0;
  },

  async findCategories() {
    const supabase = getConnection();
    const { data, error } = await supabase
      .from('categories')
      .select('id, label, description')
      .order('sort_order');

    if (error) fail(error);
    return data;
  }
};
