// ==========================================
// 프로젝트 저장소 — DB 구현 (뼈대)
// ==========================================

import { getConnection } from './connection.js';

export const projectsRepository = {
  async findAll(filter = {}) {
    const db = await getConnection();
    const { category } = filter;

    // MongoDB 예시
    // const query = category && category !== 'all' ? { category } : {};
    // return db.collection('projects').find(query).toArray();

    // PostgreSQL 예시
    // const hasCategory = category && category !== 'all';
    // const { rows } = hasCategory
    //   ? await db.query('SELECT * FROM projects WHERE category = $1', [category])
    //   : await db.query('SELECT * FROM projects');
    // return rows;

    throw new Error(
      `projectsRepository.findAll()을 구현하세요. (category: ${category}, connection: ${typeof db})`
    );
  },

  async findById(id) {
    const db = await getConnection();

    // MongoDB 예시
    // return db.collection('projects').findOne({ id });

    throw new Error(
      `projectsRepository.findById()를 구현하세요. (id: ${id}, connection: ${typeof db})`
    );
  },

  async findCategories() {
    const db = await getConnection();

    // MongoDB 예시
    // return db.collection('categories').find({}).sort({ order: 1 }).toArray();

    throw new Error('projectsRepository.findCategories()를 구현하세요. (connection: ' + typeof db + ')');
  }
};
