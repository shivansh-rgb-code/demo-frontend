import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { getRestaurant, listFoodItems } from "../api/endpoints";
import { Banner, Empty, Loading } from "../components/Feedback";
import { useCart } from "../context/CartContext";
import { categoryLabel, formatMoney } from "../lib/format";
import { FOOD_CATEGORIES, type FoodCategory, type FoodItem, type Restaurant } from "../types";

export function MenuPage() {
  const { restaurantId = "" } = useParams();
  const { cart, addItem } = useCart();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [items, setItems] = useState<FoodItem[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FoodCategory | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadMenu(
    nextQuery = query,
    nextCategory: FoodCategory | "" = category,
  ) {
    setLoading(true);
    setError("");
    try {
      const [nextRestaurant, nextItems] = await Promise.all([
        getRestaurant(restaurantId),
        listFoodItems(restaurantId, nextQuery, nextCategory),
      ]);
      setRestaurant(nextRestaurant);
      setItems(nextItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load menu");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMenu("", "");
    // Load whenever the restaurant route changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  function onFilter(event: FormEvent) {
    event.preventDefault();
    void loadMenu(query, category);
  }

  function onAdd(item: FoodItem) {
    if (!restaurant) return;
    if (cart && cart.restaurantId !== restaurant.id && cart.items.length > 0) {
      const replace = window.confirm(
        `Your cart has items from ${cart.restaurantName}. Replace that cart?`,
      );
      if (!replace) return;
    }
    addItem(restaurant.id, restaurant.name, item);
    setNotice(`${item.name} added to cart`);
  }

  return (
    <section>
      {restaurant ? (
        <header className="page-head">
          <div>
            <h1>{restaurant.name}</h1>
            <p className="muted">{restaurant.address}</p>
          </div>
          <span className={restaurant.open ? "pill open" : "pill closed"}>
            {restaurant.open ? "Open" : "Closed"}
          </span>
        </header>
      ) : (
        <h1>Menu</h1>
      )}

      <form className="toolbar" onSubmit={onFilter}>
        <input
          placeholder="Search menu"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select
          value={category}
          onChange={(event) => {
            const next = event.target.value as FoodCategory | "";
            setCategory(next);
            void loadMenu(query, next);
          }}
        >
          <option value="">All categories</option>
          {FOOD_CATEGORIES.map((value) => (
            <option key={value} value={value}>
              {categoryLabel(value)}
            </option>
          ))}
        </select>
        <button type="submit">Filter</button>
        <Link to="/cart" className="button secondary">
          View cart
        </Link>
      </form>

      {notice ? <Banner kind="success">{notice}</Banner> : null}
      {error ? <Banner kind="error">{error}</Banner> : null}
      {loading ? <Loading /> : null}
      {!loading && !error && items.length === 0 ? (
        <Empty>No available items match those filters.</Empty>
      ) : null}

      <div className="stack">
        {items.map((item) => (
          <article key={item.id} className="card menu-item">
            <div>
              <h2>{item.name}</h2>
              <p className="muted">{categoryLabel(item.category)}</p>
              {item.description ? <p>{item.description}</p> : null}
              <strong>{formatMoney(item.price)}</strong>
            </div>
            <button type="button" onClick={() => onAdd(item)} disabled={!restaurant?.open}>
              Add
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
