import axios from 'axios';
import Storage from '../utils/storage';

const API_HOST = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const API_BASE = `${API_HOST}/api/coffee`;

const getClient = async () => {
  const token = await Storage.getItem('access_token');
  return axios.create({
    baseURL: API_BASE,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    timeout: 10000,
  });
};

export async function coffeeMenu(slug) {
  const client = await getClient();
  const { data } = await client.get(`/menu/${slug}/`);
  return data;
}

export async function coffeeCreateOrder(payload) {
  const client = await getClient();
  const { data } = await client.post('/order/', payload);
  return data;
}

export async function coffeeOrderStatus(orderId) {
  const client = await getClient();
  const { data } = await client.get(`/order/${orderId}/`);
  return data;
}

export async function coffeeBaristaOrders(slug) {
  const client = await getClient();
  const { data } = await client.get(`/barista/${slug}/orders/`);
  return data;
}

export async function coffeeAcceptOrder(orderId) {
  const client = await getClient();
  const { data } = await client.post(`/barista/order/${orderId}/accept/`);
  return data;
}

export async function coffeeReadyOrder(orderId) {
  const client = await getClient();
  const { data } = await client.post(`/barista/order/${orderId}/ready/`);
  return data;
}

export async function coffeeStopList(slug) {
  const client = await getClient();
  const { data } = await client.get(`/barista/${slug}/stop-list/`);
  return data;
}

export async function coffeeToggleStop(slug, dishId) {
  const client = await getClient();
  const { data } = await client.post(`/barista/${slug}/stop-list/`, { dish_id: dishId });
  return data;
}
