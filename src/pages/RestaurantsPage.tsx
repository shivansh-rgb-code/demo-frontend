import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { listRestaurants } from "../api/endpoints";
import { Banner, Empty, Loading } from "../components/Feedback";
import type { Restaurant } from "../types";

export function RestaurantsPage() {
  const [query, setQuery] = useState("");
  const [openOnly, setOpenOnly] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(nextQuery = query, nextOpenOnly = openOnly) {
    setLoading(true);
    setError("");
    try {
      setRestaurants(await listRestaurants(nextQuery, nextOpenOnly));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load restaurants");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load("", false);
    // Initial load only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSearch(event: FormEvent) {
    event.preventDefault();
    void load(query, openOnly);
  }

  return (
    <section>
      <h1>Restaurants</h1>
      <form className="toolbar" onSubmit={onSearch}>
        <input
          placeholder="Search by name or address"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <label className="checkbox">
          <input
            type="checkbox"
            checked={openOnly}
            onChange={(event) => {
              const next = event.target.checked;
              setOpenOnly(next);
              void load(query, next);
            }}
          />
          Open now
        </label>
        <button type="submit">Search</button>
      </form>
      {error ? <Banner kind="error">{error}</Banner> : null}
      {loading ? <Loading /> : null}
      {!loading && !error && restaurants.length === 0 ? (
        <Empty>No restaurants match those filters.</Empty>
      ) : null}
      <div className="grid">
        {restaurants.map((restaurant) => (
          <Link
            key={restaurant.id}
            className="card restaurant-card"
            to={`/restaurants/${restaurant.id}`}
          >
            <h2>{restaurant.name}</h2>
            <p>{restaurant.address}</p>
            <span className={restaurant.open ? "pill open" : "pill closed"}>
              {restaurant.open ? "Open" : "Closed"}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
