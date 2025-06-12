import request from './fetchWrapper';

export async function uploadMedia(purpose, file) {
  const form = new FormData();
  form.append('file', file);

  return request(`/api/media/upload/${purpose}`, {
    method: 'POST',
    body: form,
    isMultipart: true
  });
}

export async function uploadAvatar(userId, file) {
  const form = new FormData();
  form.append('file', file);

  return request(`/api/users/${userId}/avatar`, {
    method: 'POST',
    body: form,
    isMultipart: true
  });
}
