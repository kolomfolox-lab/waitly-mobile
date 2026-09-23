import axios from 'axios';
import Storage from '../utils/storage';
import { ensureApiBase } from '../api/baseUrl';

const getClient = async () => {
  const token = await Storage.getItem('access_token');
  const base = await ensureApiBase();
  return axios.create({
    baseURL: `${base}/api/coffee`,
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
