
import request from '../fetchWrapper';

export const getAllCampus = async () => {
  const res = await request('/api/campus');
  return res.data;
};

export const getCampusById = async (id) => {
  const res = await request(`/api/campus/${id}`);
  return res.data;
};

export const updateCampus = async (id, campusData) => {
  const res = await request(`/api/campus/${id}`, {
    method: 'PUT',
    body: campusData,
  });
  return res.data;
};