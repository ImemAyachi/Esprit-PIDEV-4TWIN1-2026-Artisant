/**
 * Simple calculation utility for testing
 */
export const calculateTotal = (price, quantity, tax = 0) => {
  if (price < 0 || quantity < 0) return 0;
  const subtotal = price * quantity;
  return subtotal + (subtotal * tax);
};
