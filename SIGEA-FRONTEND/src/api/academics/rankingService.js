import request from '../fetchWrapper';

export const getAllRankings = async () => {
  const res = await request('/api/rankings');
  return res;
};

export const getRankingById = async (id) => {
  const res = await request(`/api/rankings/${id}`);
  return res;
};

export const getRankingsByTeacher = async (teacherId) => {
  const res = await request(`/api/rankings/teacher/${teacherId}`);
  return res;
};

export const createRanking = async (rankingData) => {
  const res = await request('/api/rankings', {
    method: 'POST',
    body: rankingData,
  });
  return res;
};
