import request from '../fetchWrapper';

export const getAllCampus = async () => {
  const res = await request('/api/campus');
  return res.data;
};

export const getCampusById = async (id) => {
  const res = await request(`/api/campus/${id}`);
  return res.data;
};

export const getCampusByStudentId = async (studentId) => {
  const res = await request(`/api/campus/student/${studentId}`);
  return res;
};

export const createCampus = async (campusData) => {
  const res = await request('/api/campus', {
    method: 'POST',
    body: campusData,
  });
  return res.data;
};

export const updateCampus = async (id, campusData) => {
  const res = await request(`/api/campus/${id}`, {
    method: 'PUT',
    body: campusData,
  });
  return res.data;
};
