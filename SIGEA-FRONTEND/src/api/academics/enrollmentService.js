import request from '../fetchWrapper';

export const getAllEnrollments = async () => {
  const res = await request('/api/enrollments');
  return res;
};

export const getEnrollmentsByUser = async (userId) => {
  const res = await request(`/api/enrollments/user/${userId}`);
  return res;
};

export const getEnrollmentsByCareer = async (careerId) => {
  const res = await request(`/api/enrollments/career/${careerId}`);
  return res;
};

export const getActiveEnrollmentsByCareer = async (careerId) => {
  const res = await request(`/api/enrollments/career/${careerId}/active`);
  return res;
};

export const createEnrollment = async (enrollmentDto) => {
  return await request('/api/enrollments', {
    method: 'POST',
    body: enrollmentDto,
  });
};

export const updateEnrollment = async (enrollmentId, enrollmentDto) => {
  return await request(`/api/enrollments/${enrollmentId}`, {
    method: 'PUT',
    body: enrollmentDto,
  });
};

export const completeEnrollment = async (enrollmentId) => {
  return await request(`/api/enrollments/${enrollmentId}/complete`, {
    method: 'PATCH',
  });
};

export const deactivateEnrollment = async (enrollmentId) => {
  return await request(`/api/enrollments/${enrollmentId}/deactivate`, {
    method: 'PATCH',
  });
};

export const reactivateEnrollment = async (enrollmentId) => {
  return await request(`/api/enrollments/${enrollmentId}/reactivate`, {
    method: 'PATCH',
  });
};

export const deleteEnrollment = async (enrollmentId) => {
  return await request(`/api/enrollments/${enrollmentId}`, {
    method: 'DELETE',
  });
};

export const generateRegistrationNumber = async (careerId) => {
  const res = await request(`/api/enrollments/generate-number/${careerId}`);
  return res;
};

export const generateRegistrationNumberByRole = async (careerId, userRole) => {
  const res = await request(`/api/enrollments/generate-number/${careerId}/role/${userRole}`);
  return res;
};

export const updateEnrollmentRegistration = async (enrollmentId, newRegistrationNumber) => {
  return await request(`/api/enrollments/${enrollmentId}/registration-number`, {
    method: 'PATCH',
    body: { newRegistrationNumber },
  });
};

export const getTeachersByCareer = async (careerId) => {
  const res = await request(`/api/enrollments/teachers/career/${careerId}`);
  return res;
};

export const checkStudentGroupsInCareer = async (userId, careerId) => {
  const res = await request(`/api/group-students/check-user-groups/${userId}/career/${careerId}`);
  return res;
};

export const getStudentsByCareer = async (careerId) => {
  const res = await request(`/api/enrollments/students/career/${careerId}`);
  return res;
};

export const getStudentRegistrationByCareerId = async (studentId, careerId) => {
  try {
    const enrollments = await getEnrollmentsByUser(studentId);
    const enrollment = enrollments.find((e) => e.careerId === careerId);
    return enrollment?.registrationNumber || null;
  } catch (error) {
    console.error('Error getting student registration:', error);
    return null;
  }
};

export const canRemoveUserFromCareer = async (userId, careerId) => {
  try {
    const groupCheck = await checkStudentGroupsInCareer(userId, careerId);
    return !groupCheck.hasActiveGroups;
  } catch (error) {
    console.error('Error checking user groups:', error);
    return false;
  }
};

export const updateUserRegistrations = async (userId, registrationUpdates) => {
  const promises = registrationUpdates.map((update) => updateEnrollmentRegistration(update.enrollmentId, update.newRegistrationNumber));
  return Promise.all(promises);
};