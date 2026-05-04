import client from '../api/client';

const normalizeList = (data) => data?.results || data?.items || data || [];

export const inventoryAPI = {
  async getStock() {
    const response = await client.get('/inventory/mobile/stock/');
    return normalizeList(response.data);
  },

  async addIncoming(ingredientId, quantity) {
    const response = await client.post('/inventory/stock/incoming/', {
      ingredient_id: ingredientId,
      quantity,
    });
    return response.data;
  },

  async getIngredients() {
    const response = await client.get('/inventory/ingredients/');
    return normalizeList(response.data);
  },

  async getRecipes(dishId) {
    const response = await client.get('/inventory/recipes/', {
      params: { dish_id: dishId },
    });
    return normalizeList(response.data);
  },

  async saveRecipe(dishId, ingredientId, quantityNeeded) {
    const response = await client.post('/inventory/recipes/', {
      dish_id: dishId,
      ingredient_id: ingredientId,
      quantity_needed: quantityNeeded,
    });
    return response.data;
  },
};
