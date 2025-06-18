import request from '../fetchWrapper';

export const getAllQualifications = async () => {
  const res = await request('/api/qualifications');
  return res;
};

export const getQualificationsByGroup = async (groupId) => {
  const res = await request(`/api/qualifications/group/${groupId}`);
  return res;
};
