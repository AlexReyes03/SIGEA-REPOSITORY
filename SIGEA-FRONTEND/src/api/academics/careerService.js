import request from '../fetchWrapper';

export const getAllCareers = async () => {
  const res = await request('/api/careers');
  return res;
};

export const getCareerById = async (id) => {
  const res = await request(`/api/careers/${id}`);
  return res;
};

export const getCareerByPlantelId = async (PlantelId) => {
  const res = await request(`/api/careers/plantel/${PlantelId}`);
  return res;
};

export const createCareer = async (careerDto, plantelId) => {
  return await request(`/api/careers?plantelId=${plantelId}`, {
    method: 'POST',
    body: careerDto,
  });
};

export const updateCareer = async (id, careerDto, plantelId) => {
  return await request(`/api/careers/${id}?plantelId=${plantelId}`, {
    method: 'PUT',
    body: careerDto,
  });
};

export const deleteCareer = async (id) => {
  return await request(`/api/careers/${id}`, {
    method: 'DELETE',
  });
};
