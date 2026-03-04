import client from './client';

/**
 * Fetch all dishes
 */
export const fetchDishes = async () => {
    const response = await client.get('/menu/dishes/');
    return response.data;
};

/**
 * Fetch dishes grouped by category
 */
export const fetchDishesByCategory = async () => {
    const response = await client.get('/menu/dishes/by_category/');
    return response.data;
};

/**
 * Fetch all menu categories
 */
export const fetchCategories = async () => {
    const response = await client.get('/menu/categories/');
    return response.data;
};

/**
 * Create a new dish
 */
export const createDish = async (dishData) => {
    const formData = new FormData();

    if (dishData.image) {
        formData.append('image', {
            uri: dishData.image,
            type: 'image/jpeg',
            name: 'dish.jpg',
        });
    }

    formData.append('name', dishData.name);
    formData.append('price', dishData.price);
    formData.append('category', dishData.category);
    formData.append('cooking_time', dishData.cooking_time || 15);
    if (dishData.description) {
        formData.append('description', dishData.description);
    }

    const response = await client.post('/menu/dishes/', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

/**
 * Toggle dish availability (mark as in stock / out of stock)
 */
export const toggleDishAvailability = async (dishId, isAvailable, reason = '') => {
    const response = await client.post(`/menu/dishes/${dishId}/toggle_availability/`, {
        is_available: isAvailable,
        unavailable_reason: reason
    });
    return response.data;
};

/**
 * Update a dish
 */
export const updateDish = async (dishId, dishData) => {
    const response = await client.patch(`/menu/dishes/${dishId}/`, dishData);
    return response.data;
};

/**
 * Delete a dish
 */
export const deleteDish = async (dishId) => {
    const response = await client.delete(`/menu/dishes/${dishId}/`);
    return response.data;
};

/**
 * Create a new category
 */
export const createCategory = async (name) => {
    const response = await client.post('/menu/categories/', { name });
    return response.data;
};
