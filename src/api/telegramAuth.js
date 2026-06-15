import apiClient from './apiClient';

export const telegramLogin = async (initData) => {
  const response = await apiClient.post('/api/v1/auth/telegram/', {
    initData,
  });
  return response.data;
};

export const telegramLinkPhone = async (initData, phoneNumber) => {
  const response = await apiClient.post('/api/v1/auth/telegram/link-phone/', {
    initData,
    phone_number: phoneNumber,
  });
  return response.data;
};
