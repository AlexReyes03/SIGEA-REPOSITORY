import request from '../fetchWrapper';

export const getAllGroups = async () => {
  const res = await request('/api/groups');
  return res.data;
};

export const getGroupById = async (id) => {
  const res = await request(`/api/groups/${id}`);
  return res;
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

// GROUP & STUDENTS
export const getGroupStudents = async (groupId) => {
  const res = await request(`/api/group-students/group/${groupId}`);
  return res;
};

export const getStudentsWithGroup = async () => {
  return await request('/api/group-students/students-with-group');
};

export const enrollStudentInGroup = async (groupId, studentId) => {
  return await request('/api/group-students/enroll', {
    method: 'POST',
    body: { groupId, studentId },
  });
};

export const removeStudentFromGroup = async (groupId, studentId) => {
  return await request('/api/group-students/remove', {
    method: 'DELETE',
    body: { groupId, studentId },
  });
};

export const getStudentGroupHistory = async (studentId) => {
  return await request(`/api/group-students/by-student/${studentId}`);
};

export const isStudentActiveInGroup = async (studentId, groupId) => {
  try {
    const history = await getStudentGroupHistory(studentId);
    return history.some(entry => entry.groupId === groupId && entry.status === 'ACTIVE');
  } catch (error) {
    console.error('Error checking student group status:', error);
    return false;
  }
};

export const validateQualificationCopy = async (sourceGroupId, targetGroupId) => {
  return await request(`/api/student-transfer/validate-copy?sourceGroupId=${sourceGroupId}&targetGroupId=${targetGroupId}`);
};

export const transferStudents = async (studentIds, sourceGroupId, targetGroupId, copyQualifications = false) => {
  return await request('/api/student-transfer/transfer', {
    method: 'POST',
    body: {
      studentIds,
      sourceGroupId,
      targetGroupId,
      copyQualifications
    }
  });
};

export const getStudentTransferGroupHistory = async (studentId) => {
  return await request(`/api/student-transfer/history/${studentId}`);
};

export const transferSingleStudent = async (studentId, sourceGroupId, targetGroupId, copyQualifications = false) => {
  return await transferStudents([studentId], sourceGroupId, targetGroupId, copyQualifications);
};

export const haveSameCurriculum = async (sourceGroupId, targetGroupId) => {
  try {
    const validation = await validateQualificationCopy(sourceGroupId, targetGroupId);
    return validation.sameCurriculum;
  } catch (error) {
    console.warn('Error validating curriculum compatibility:', error);
    return false;
  }
};