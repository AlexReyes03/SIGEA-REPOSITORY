import request from '../fetchWrapper';

export const getAllCampus = async () => {
  const res = await request('/api/campus');
  return res.data;
};