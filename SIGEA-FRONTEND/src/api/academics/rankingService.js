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

export const getStudentEvaluationModules = async (studentId) => {
  const response = await request(`/api/rankings/student/${studentId}/modules`);
  return response.data || [];
};

export const submitEvaluation = async (evaluationData) => {
  return await createRanking(evaluationData);
};

export const checkStudentTeacherEvaluation = async (studentId, teacherId) => {
  const response = await request(`/api/rankings/student/${studentId}/teacher/${teacherId}`);
  return response.data;
};

export const getStudentEvaluations = async (studentId) => {
  const response = await request(`/api/rankings/student/${studentId}`);
  return response.data || [];
};

export const validateEvaluation = (evaluationData) => {
  const errors = [];

  if (!evaluationData.studentId) {
    errors.push('Student ID is required');
  }

  if (!evaluationData.moduleId) {
    errors.push('Module ID is required');
  }

  if (!evaluationData.teacherId) {
    errors.push('Teacher ID is required');
  }

  if (!evaluationData.star || evaluationData.star < 1 || evaluationData.star > 5) {
    errors.push('La puntuación debe ser entre 1 y 5 estrellas');
  }

  if (!evaluationData.comment || evaluationData.comment.trim().length === 0) {
    errors.push('El comentario es obligatorio');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: {
      studentId: evaluationData.studentId,
      moduleId: evaluationData.moduleId,
      teacherId: evaluationData.teacherId,
      star: evaluationData.star,
      comment: evaluationData.comment?.trim() || null
    }
  };
};