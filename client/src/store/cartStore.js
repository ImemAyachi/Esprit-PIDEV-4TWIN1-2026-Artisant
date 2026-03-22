import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCartStore = create(
    persist(
        (set, get) => ({
            items: [],
            
            addItem: (product, quantity = 1) => {
                const existing = get().items.find(i => i.product._id === product._id);
                if (existing) {
                    set({
                        items: get().items.map(i => 
                            i.product._id === product._id 
                            ? { ...i, quantity: i.quantity + quantity } 
                            : i
                        )
                    });
                } else {
                    set({ items: [...get().items, { product, quantity }] });
                }
            },

            removeItem: (productId) => {
                set({ items: get().items.filter(i => i.product._id !== productId) });
            },

            updateQuantity: (productId, quantity) => {
                if (quantity <= 0) {
                    get().removeItem(productId);
                    return;
                }
                set({
                    items: get().items.map(i => 
                        i.product._id === productId 
                        ? { ...i, quantity } 
                        : i
                    )
                });
            },

            clearCart: () => set({ items: [] }),

            getFinancials: () => {
                const subtotal = get().items.reduce((acc, i) => acc + (i.product.price * i.quantity), 0);
                const tax = subtotal * 0.19;
                const shippingCost = subtotal > 500 ? 0 : 50;
                return {
                    subtotal,
                    tax,
                    shippingCost,
                    total: subtotal + tax + shippingCost
                };
            }
        }),
        {
            name: 'artisant-cart-v1', // persistence key
        }
    )
);

export default useCartStore;
