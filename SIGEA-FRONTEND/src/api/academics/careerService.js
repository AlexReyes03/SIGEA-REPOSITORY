import request from '../fetchWrapper';

export const getAllCareers = async () => {
  const res = await request('/api/careers');
  return res;
};

export const getCareerById = async (id) => {
  const res = await request(`/api/careers/${id}`);
  return res;
};

export const getCareerByPlantelId = async (campusId) => {
  const res = await request(`/api/careers/campus/${campusId}`);
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
