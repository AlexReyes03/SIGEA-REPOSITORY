import request from './fetchWrapper';

export const assignCampusToSupervisor = async (supervisorId, campusId, assignedByUserId) => {
  return await request('/api/supervision/assign', {
    method: 'POST',
    body: {
      supervisorId,
      campusId,
      assignedByUserId,
    },
  });
};

export const updateSupervisorCampuses = async (supervisorId, campusIds, updatedByUserId) => {
  return await request(`/api/supervision/supervisor/${supervisorId}/campuses`, {
    method: 'PUT',
    body: {
      supervisorId,
      campusIds,
      updatedByUserId,
    },
  });
};

export const removeCampusFromSupervisor = async (supervisorId, campusId) => {
  return await request('/api/supervision/remove', {
    method: 'DELETE',
    body: {
      supervisorId,
      campusId,
    },
  });
};

export const getSupervisorCampuses = async (supervisorId) => {
  const res = await request(`/api/supervision/supervisor/${supervisorId}/campuses`);
  return res;
};

export const getSupervisorsByCampus = async (campusId) => {
  const res = await request(`/api/supervision/campus/${campusId}/supervisors`);
  return res;
};

export const assignMultipleCampusToSupervisor = async (supervisorId, campusIds, assignedByUserId) => {
  const promises = campusIds.map((campusId) => assignCampusToSupervisor(supervisorId, campusId, assignedByUserId));

  try {
    const results = await Promise.allSettled(promises);
    const successful = results.filter((result) => result.status === 'fulfilled');
    const failed = results.filter((result) => result.status === 'rejected');

    return {
      successful: successful.length,
      failed: failed.length,
      total: campusIds.length,
      errors: failed.map((f) => f.reason),
    };
  } catch (error) {
    throw error;
  }
};
