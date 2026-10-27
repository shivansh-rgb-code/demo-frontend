import { useCallback, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ApiError } from "../api/client";
import { createPaymentOrder, getOrder, verifyPayment } from "../api/endpoints";
import { Banner, Loading } from "../components/Feedback";
import { useAuth } from "../context/AuthContext";
import { formatDate, formatMoney, statusLabel } from "../lib/format";
import { openRazorpayCheckout } from "../lib/razorpay";
import type { Order } from "../types";

export function OrderDetailPage() {
  const { orderId = "" } = useParams();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState(() => {
    if (params.get("placed") === "1") return "Order placed. The server total is shown below.";
    if (params.get("paid") === "1") return "Payment verified by the backend.";
    if (params.get("pay") === "pending") {
      return "Checkout closed before payment finished. You can try paying again if this order uses Razorpay.";
    }
    return "";
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setOrder(await getOrder(orderId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load order");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function payNow() {
    if (!order) return;
    setPaying(true);
    setError("");
    try {
      const payment = await createPaymentOrder(order.id);
      await openRazorpayCheckout({
        payment,
        profile: user,
        onSuccess: (payload) => {
          void verifyPayment(order.id, {
            razorpayOrderId: payload.razorpay_order_id,
            razorpayPaymentId: payload.razorpay_payment_id,
            razorpaySignature: payload.razorpay_signature,
          })
            .then(async () => {
              setInfo("Payment verified by the backend.");
              await refresh();
            })
            .catch((err: unknown) => {
              setError(err instanceof Error ? err.message : "Payment verification failed");
            })
            .finally(() => setPaying(false));
        },
        onDismiss: () => {
          setPaying(false);
          setInfo("Payment window closed. Status is unchanged until the backend confirms payment.");
        },
      });
    } catch (err) {
      setPaying(false);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Unable to start payment");
      }
    }
  }

  return (
    <section>
      <header className="page-head">
        <h1>Order details</h1>
        <button type="button" className="secondary" onClick={() => void refresh()}>
          Refresh status
        </button>
      </header>
      <p>
        <Link to="/orders">Back to orders</Link>
      </p>
      {info ? <Banner kind="success">{info}</Banner> : null}
      {error ? <Banner kind="error">{error}</Banner> : null}
      {loading ? <Loading /> : null}
      {order ? (
        <div className="card stack">
          <p>
            <strong>{order.restaurantName}</strong>
          </p>
          <p>
            Status: {statusLabel(order.status)} · Payment: {statusLabel(order.paymentStatus)}
          </p>
          <p>Placed {formatDate(order.createdAt)}</p>
          <p>Deliver to: {order.deliveryAddress}</p>
          {order.customerNote ? <p>Note: {order.customerNote}</p> : null}
          <ul className="plain">
            {order.items.map((item) => (
              <li key={`${item.foodItemId}-${item.foodName}`}>
                {item.foodName} × {item.quantity} — {formatMoney(item.subtotal)}
              </li>
            ))}
          </ul>
          <p>
            Server total: <strong>{formatMoney(order.totalAmount)}</strong>
          </p>
          {order.paymentStatus === "PENDING" ? (
            <button type="button" onClick={() => void payNow()} disabled={paying}>
              {paying ? "Opening payment…" : "Pay with Razorpay"}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
