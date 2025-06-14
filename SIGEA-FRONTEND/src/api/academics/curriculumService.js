import request from '../fetchWrapper';

export const getCurriculumByCareerId = async (careerId) => {
  return await request(`/api/curriculums/career/${careerId}`);
};

export const createCurriculum = async (curriculum) => {
  return await request(`/api/curriculums`, {
    method: 'POST',
    body: curriculum,
  });
};

export const updateCurriculum = async (id, curriculum) => {
  return await request(`/api/curriculums/${id}`, {
    method: 'PUT',
    body: curriculum,
  });
};

export const deleteCurriculum = async (id) => {
  return await request(`/api/curriculums/${id}`, {
    method: 'DELETE',
  });
};
