import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listOrders } from "../api/endpoints";
import { Banner, Empty, Loading } from "../components/Feedback";
import { formatDate, formatMoney, statusLabel } from "../lib/format";
import type { Order } from "../types";

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError("");
    try {
      setOrders(await listOrders());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(true);
    const timer = window.setInterval(() => void load(), 15000);
    return () => window.clearInterval(timer);
  }, [load]);

  return (
    <section>
      <header className="page-head">
        <h1>Your orders</h1>
        <button type="button" className="secondary" onClick={() => void load(true)}>
          Refresh
        </button>
      </header>
      <p className="muted">Order statuses refresh automatically every 15 seconds.</p>
      {error ? <Banner kind="error">{error}</Banner> : null}
      {loading ? <Loading /> : null}
      {!loading && !error && orders.length === 0 ? (
        <Empty>You have not placed any orders yet.</Empty>
      ) : null}
      <div className="stack">
        {orders.map((order) => (
          <Link key={order.id} className="card order-row" to={`/orders/${order.id}`}>
            <div>
              <h2>{order.restaurantName}</h2>
              <p className="muted">{formatDate(order.createdAt)}</p>
              <p className="muted">
                {order.deliveryPartnerId ? "Delivery partner assigned" : "Delivery partner not assigned yet"}
              </p>
            </div>
            <div className="order-meta">
              <span>{statusLabel(order.status)}</span>
              <span>Payment: {statusLabel(order.paymentStatus)}</span>
              <strong>{formatMoney(order.totalAmount)}</strong>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
