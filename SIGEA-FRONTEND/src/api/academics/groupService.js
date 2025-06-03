import request from '../fetchWrapper';

export const getAllGroups = async () => {
  const res = await request('/api/groups');
  return res.data;
};

export const getGroupById = async (id) => {
  const res = await request(`/api/groups/${id}`);
  return res.data;
};

export const getGroupByTeacher = async (teacherId) => {
  return await request(`/api/groups/teacher/${teacherId}`);
};

export const getGroupByCareer = async (careerId) => {
  return await request(`/api/groups/career/${careerId}`);
};

export const createGroup = async (groupDto) => {
  return await request(`/api/groups`, {
    method: 'POST',
    body: groupDto,
  });
};

export const updateGroup = async (id, groupDto) => {
  return await request(`/api/groups/${id}`, {
    method: 'PUT',
    body: groupDto,
  });
};

export const deleteGroup = async (id) => {
  return await request(`/api/groups/${id}`, {
    method: 'DELETE',
  });
};
