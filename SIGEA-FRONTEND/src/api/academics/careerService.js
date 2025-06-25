import request from '../fetchWrapper';

export const getAllCareers = async () => {
  const res = await request('/api/careers');
  return res;
};

export const getCareerById = async (id) => {
  const res = await request(`/api/careers/${id}`);
  return res;
};

export const getCareerByPlantelId = async (plantelId) => {
  const res = await request(`/api/careers/plantel/${plantelId}`);
  return res;
};

export const createCareer = async (careerDto) => {
  return await request('/api/careers', {
    method: 'POST',
    body: careerDto,
  });
};

export const updateCareer = async (id, careerDto) => {
  return await request(`/api/careers/${id}`, {
    method: 'PUT',
    body: careerDto,
  });
};

export const deleteCareer = async (id) => {
  return await request(`/api/careers/${id}`, {
    method: 'DELETE',
  });
};

export const checkDifferentiatorAvailability = async (differentiator, plantelId) => {
  const res = await request(`/api/careers/check-differentiator?differentiator=${differentiator}&plantelId=${plantelId}`);
  return res;
};
