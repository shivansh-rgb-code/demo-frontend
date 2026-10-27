import { Link } from "react-router-dom";
import { Empty } from "../components/Feedback";
import { useCart } from "../context/CartContext";
import { formatMoney } from "../lib/format";

export function CartPage() {
  const { cart, subtotal, setQuantity, removeItem, clearCart } = useCart();

  if (!cart || cart.items.length === 0) {
    return (
      <section>
        <h1>Cart</h1>
        <Empty>Your cart is empty.</Empty>
        <Link to="/">Browse restaurants</Link>
      </section>
    );
  }

  return (
    <section>
      <header className="page-head">
        <div>
          <h1>Cart</h1>
          <p className="muted">{cart.restaurantName}</p>
        </div>
        <button type="button" className="secondary" onClick={clearCart}>
          Clear
        </button>
      </header>

      <div className="stack">
        {cart.items.map((item) => (
          <article key={item.foodItemId} className="card menu-item">
            <div>
              <h2>{item.name}</h2>
              <p>{formatMoney(item.price)} each</p>
            </div>
            <div className="qty">
              <button
                type="button"
                onClick={() => setQuantity(item.foodItemId, item.quantity - 1)}
              >
                -
              </button>
              <span>{item.quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(item.foodItemId, item.quantity + 1)}
              >
                +
              </button>
              <button type="button" className="linkish" onClick={() => removeItem(item.foodItemId)}>
                Remove
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="card summary">
        <p>
          Estimated subtotal: <strong>{formatMoney(subtotal)}</strong>
        </p>
        <p className="muted">
          This total is for display only. The backend calculates the charged amount when you place
          the order.
        </p>
        <Link className="button" to="/checkout">
          Checkout
        </Link>
      </div>
    </section>
  );
}
