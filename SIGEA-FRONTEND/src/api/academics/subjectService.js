import request from '../fetchWrapper';

export const getSubjectsByModuleId = async (moduleId) => {
  return await request(`/api/subjects/module/${moduleId}`);
};

export const createSubject = async (subject) => {
  return await request(`/api/subjects`, {
    method: 'POST',
    body: subject,
  })
};

export const updateSubject = async (id, subject) => {
  return await request(`/api/subjects/${id}`, {
    method: 'PUT',
    body: subject,
  });
};

export const deleteSubject = async (id) => {
  return await request(`/api/subjects/${id}`, {
    method: 'DELETE',
  });
};
