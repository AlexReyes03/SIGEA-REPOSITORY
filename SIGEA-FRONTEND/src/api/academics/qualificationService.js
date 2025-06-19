import request from '../fetchWrapper';

export const getAllQualifications = async () => {
  const res = await request('/api/qualifications');
  return res;
};

export const getQualificationsByGroup = async (groupId) => {
  const res = await request(`/api/qualifications/group/${groupId}`);
  return res;
};

export const getQualificationsByGroupWithDetails = async (groupId) => {
  return await request(`/api/qualifications/group/${groupId}/details`);
};

export const saveQualification = async (studentId, groupId, subjectId, teacherId, grade) => {
  return await request('/api/qualifications', {
    method: 'POST',
    body: { studentId, groupId, subjectId, teacherId, grade },
  });
};
