// ==========================================
// 프로젝트 저장소 — DB 구현 (뼈대)
// ------------------------------------------
// json/projects.repository.js 와 같은 함수 이름·같은 반환 형태를 지킨다.
// ==========================================

import { getConnection } from './connection.js';

export const projectsRepository = {
  async findAll(filter = {}) {
    const db = await getConnection();
    const { category, includeDrafts = false } = filter;

    // MongoDB 예시
    // const query = {};
    // if (!includeDrafts) query.status = 'published';
    // if (category && category !== 'all') query.category = category;
    // return db.collection('projects').find(query).sort({ createdAt: -1 }).toArray();

    throw new Error(
      `projectsRepository.findAll()을 구현하세요. ` +
        `(category: ${category}, includeDrafts: ${includeDrafts}, connection: ${typeof db})`
    );
  },

  async findById(id, options = {}) {
    const db = await getConnection();
    const { includeDrafts = false } = options;

    // MongoDB 예시
    // const query = includeDrafts ? { id } : { id, status: 'published' };
    // return db.collection('projects').findOne(query);

    throw new Error(
      `projectsRepository.findById()를 구현하세요. (id: ${id}, connection: ${typeof db})`
    );
  },

  async create(project) {
    const db = await getConnection();

    // MongoDB 예시
    // await db.collection('projects').insertOne(project);
    // return project;

    throw new Error(
      `projectsRepository.create()를 구현하세요. (id: ${project?.id}, connection: ${typeof db})`
    );
  },

  async update(id, project) {
    const db = await getConnection();

    // MongoDB 예시
    // const result = await db.collection('projects').replaceOne({ id }, project);
    // return result.matchedCount ? project : null;

    throw new Error(
      `projectsRepository.update()를 구현하세요. (id: ${id}, connection: ${typeof db})`
    );
  },

  async remove(id) {
    const db = await getConnection();

    // MongoDB 예시
    // const result = await db.collection('projects').deleteOne({ id });
    // return result.deletedCount > 0;

    throw new Error(
      `projectsRepository.remove()를 구현하세요. (id: ${id}, connection: ${typeof db})`
    );
  },

  async findCategories() {
    const db = await getConnection();

    // MongoDB 예시
    // return db.collection('categories').find({}).sort({ order: 1 }).toArray();

    throw new Error('projectsRepository.findCategories()를 구현하세요. (connection: ' + typeof db + ')');
  }
};
