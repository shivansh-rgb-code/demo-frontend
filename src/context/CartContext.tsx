import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toNumber } from "../lib/format";
import type { CartItem, CartState, FoodItem } from "../types";

const STORAGE_KEY = "foodapp.customer.cart";

interface CartContextValue {
  cart: CartState | null;
  itemCount: number;
  subtotal: number;
  addItem: (restaurantId: string, restaurantName: string, item: FoodItem) => boolean;
  setQuantity: (foodItemId: string, quantity: number) => void;
  removeItem: (foodItemId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function loadCart(): CartState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CartState;
    if (!parsed.restaurantId || !Array.isArray(parsed.items)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartState | null>(() => loadCart());

  useEffect(() => {
    if (cart && cart.items.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [cart]);

  const addItem = useCallback(
    (restaurantId: string, restaurantName: string, item: FoodItem) => {
      let replaced = false;
      setCart((current) => {
        if (current && current.restaurantId !== restaurantId && current.items.length > 0) {
          replaced = true;
        }

        const base: CartState =
          current && current.restaurantId === restaurantId
            ? current
            : { restaurantId, restaurantName, items: [] };

        const existing = base.items.find((entry) => entry.foodItemId === item.id);
        const items: CartItem[] = existing
          ? base.items.map((entry) =>
              entry.foodItemId === item.id
                ? { ...entry, quantity: Math.min(100, entry.quantity + 1) }
                : entry,
            )
          : [
              ...base.items,
              {
                foodItemId: item.id,
                name: item.name,
                price: toNumber(item.price),
                quantity: 1,
              },
            ];

        return { restaurantId, restaurantName, items };
      });
      return replaced;
    },
    [],
  );

  const setQuantity = useCallback((foodItemId: string, quantity: number) => {
    setCart((current) => {
      if (!current) return current;
      const nextQuantity = Math.max(0, Math.min(100, quantity));
      const items =
        nextQuantity === 0
          ? current.items.filter((item) => item.foodItemId !== foodItemId)
          : current.items.map((item) =>
              item.foodItemId === foodItemId ? { ...item, quantity: nextQuantity } : item,
            );
      if (items.length === 0) return null;
      return { ...current, items };
    });
  }, []);

  const removeItem = useCallback((foodItemId: string) => {
    setCart((current) => {
      if (!current) return current;
      const items = current.items.filter((item) => item.foodItemId !== foodItemId);
      if (items.length === 0) return null;
      return { ...current, items };
    });
  }, []);

  const clearCart = useCallback(() => setCart(null), []);

  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const subtotal =
    cart?.items.reduce((sum, item) => sum + item.price * item.quantity, 0) ?? 0;

  const value = useMemo(
    () => ({
      cart,
      itemCount,
      subtotal,
      addItem,
      setQuantity,
      removeItem,
      clearCart,
    }),
    [cart, itemCount, subtotal, addItem, setQuantity, removeItem, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
