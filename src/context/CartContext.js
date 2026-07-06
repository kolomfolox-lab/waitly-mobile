import React, { createContext, useState, useContext, useCallback } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [items, setItems] = useState([]);

    const addItem = useCallback((dish, quantity = 1) => {
        setItems(prev => {
            const existing = prev.find(item => item.id === dish.id);
            if (existing) {
                return prev.map(item =>
                    item.id === dish.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [...prev, {
                id: dish.id,
                name: dish.name,
                price: dish.price,
                quantity,
                image: dish.image || null,
            }];
        });
    }, []);

    const removeItem = useCallback((dishId) => {
        setItems(prev => prev.filter(item => item.id !== dishId));
    }, []);

    const updateQuantity = useCallback((dishId, qty) => {
        if (qty <= 0) {
            setItems(prev => prev.filter(item => item.id !== dishId));
            return;
        }
        setItems(prev =>
            prev.map(item =>
                item.id === dishId ? { ...item, quantity: qty } : item
            )
        );
    }, []);

    const clearCart = useCallback(() => {
        setItems([]);
    }, []);

    const getTotal = useCallback(() => {
        return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }, [items]);

    const getItemCount = useCallback(() => {
        return items.reduce((sum, item) => sum + item.quantity, 0);
    }, [items]);

    return (
        <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, getTotal, getItemCount }}>
            {children}
        </CartContext.Provider>
    );
};
