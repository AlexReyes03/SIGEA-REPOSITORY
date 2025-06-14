import request from '../fetchWrapper';

export const getModulesByCurriculumId = async (curriculumId) => {
  return await request(`/api/modules/curriculum/${curriculumId}`);
};

export const createModule = async (module) => {
  return await request(`/api/modules`, {
    method: 'POST',
    body: module,
  });
};

export const updateModule = async (id, module) => {
  return await request(`/api/modules/${id}`, {
    method: 'PUT',
    body: module,
  });
};

export const deleteModule = async (id) => {
  return await request(`/api/modules/${id}`, {
    method: 'DELETE',
  });
};
