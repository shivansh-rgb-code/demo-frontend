
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import {
  createAddress,
  createPaymentOrder,
  listAddresses,
  placeOrder,
  verifyPayment,
} from "../api/endpoints";
import { Banner, Empty, Loading } from "../components/Feedback";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { formatMoney } from "../lib/format";
import { openRazorpayCheckout } from "../lib/razorpay";
import type { DeliveryAddress, PaymentMethod } from "../types";

export function CheckoutPage() {
  const { user } = useAuth();
  const { cart, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  const [label, setLabel] = useState("Home");
  const [saveAddress, setSaveAddress] = useState(false);
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("CASH_ON_DELIVERY");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const next = await listAddresses();

        if (cancelled) return;

        setAddresses(next);

        const defaultAddress =
          next.find((item) => item.isDefault) ?? next[0];

        if (defaultAddress) {
          setSelectedId(defaultAddress.id);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load addresses",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!cart || cart.items.length === 0) {
    return (
      <section>
        <h1>Checkout</h1>
        <Empty>Add items to your cart before checking out.</Empty>
        <Link to="/">Browse restaurants</Link>
      </section>
    );
  }

  const selectedAddress = addresses.find(
    (item) => item.id === selectedId,
  );

  const deliveryAddress =
    selectedAddress?.fullAddress ?? manualAddress.trim();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!cart) return;

    if (!deliveryAddress) {
      setError("A delivery address is required.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      if (saveAddress && !selectedId && manualAddress.trim()) {
        await createAddress({
          label: label.trim() || "Saved",
          fullAddress: manualAddress.trim(),
          deliveryInstructions: note.trim() || undefined,
          isDefault: addresses.length === 0,
        });
      }

      const order = await placeOrder(
        {
          restaurantId: cart.restaurantId,
          deliveryAddress,
          customerNote: note.trim() || undefined,
          items: cart.items.map((item) => ({
            foodItemId: item.foodItemId,
            quantity: item.quantity,
          })),
        },
        paymentMethod,
      );

      if (paymentMethod === "RAZORPAY") {
        const payment = await createPaymentOrder(order.id);

        clearCart();

        await openRazorpayCheckout({
          payment,
          profile: user,
          onSuccess: (payload) => {
            void verifyPayment(order.id, {
              razorpayOrderId: payload.razorpay_order_id,
              razorpayPaymentId: payload.razorpay_payment_id,
              razorpaySignature: payload.razorpay_signature,
            })
              .then(() => {
                navigate(`/orders/${order.id}?paid=1`);
              })
              .catch((err: unknown) => {
                setError(
                  err instanceof Error
                    ? `${err.message} The order was created; check its payment status on the order page.`
                    : "Payment verification failed. Check the order page for payment status.",
                );

                navigate(`/orders/${order.id}`);
              });
          },
          onDismiss: () => {
            navigate(`/orders/${order.id}?pay=pending`);
          },
        });

        return;
      }

      clearCart();
      navigate(`/orders/${order.id}?placed=1`);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not place order";

      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section>
      <h1>Checkout</h1>

      <p className="muted">
        Ordering from {cart.restaurantName}. Review your items,
        delivery address, and payment method before placing your order.
      </p>

      {error ? <Banner kind="error">{error}</Banner> : null}

      {loading ? <Loading label="Loading saved addresses..." /> : null}

      <form className="stack" onSubmit={onSubmit}>
        <fieldset className="card">
          <legend>Delivery address</legend>

          {addresses.length === 0 ? (
            <p className="muted">No saved addresses yet.</p>
          ) : (
            addresses.map((address) => (
              <label key={address.id} className="choice">
                <input
                  type="radio"
                  name="address"
                  checked={selectedId === address.id}
                  onChange={() => {
                    setSelectedId(address.id);
                    setManualAddress("");
                  }}
                />

                <span>
                  <strong>{address.label}</strong>
                  {address.isDefault ? " (default)" : ""}
                  <br />
                  {address.fullAddress}
                </span>
              </label>
            ))
          )}

          <label className="choice">
            <input
              type="radio"
              name="address"
              checked={!selectedId}
              onChange={() => setSelectedId("")}
            />
            Use a new address
          </label>

          {!selectedId ? (
            <>
              <label>
                Address
                <textarea
                  required
                  maxLength={500}
                  value={manualAddress}
                  onChange={(event) =>
                    setManualAddress(event.target.value)
                  }
                />
              </label>

              <label>
                Save as
                <input
                  maxLength={50}
                  value={label}
                  onChange={(event) => setLabel(event.target.value)}
                />
              </label>

              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={saveAddress}
                  onChange={(event) =>
                    setSaveAddress(event.target.checked)
                  }
                />
                Save this address for next time
              </label>
            </>
          ) : null}
        </fieldset>

        <label>
          Note for restaurant (optional)
          <textarea
            maxLength={500}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>

        <fieldset className="card">
          <legend>Order summary</legend>

          {cart.items.map((item) => (
            <div
              key={item.foodItemId}
              className="row"
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "1rem",
                paddingBlock: "0.5rem",
              }}
            >
              <span>
                {item.name} × {item.quantity}
                <span className="muted">
                  {" "}
                  ({formatMoney(item.price)} each)
                </span>
              </span>

              <strong>
                {formatMoney(item.price * item.quantity)}
              </strong>
            </div>
          ))}

          <div
            className="row"
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "1rem",
              borderTop: "1px solid currentColor",
              paddingTop: "0.75rem",
              marginTop: "0.5rem",
            }}
          >
            <strong>Estimated subtotal</strong>
            <strong>{formatMoney(subtotal)}</strong>
          </div>

          <p className="muted">
            This is an estimate based on your cart. The backend-calculated
            total, including applicable charges, is authoritative.
          </p>
        </fieldset>

        <fieldset className="card">
          <legend>Payment method</legend>

          <label className="choice">
            <input
              type="radio"
              name="payment"
              checked={paymentMethod === "CASH_ON_DELIVERY"}
              onChange={() =>
                setPaymentMethod("CASH_ON_DELIVERY")
              }
            />
            Cash on delivery
          </label>

          <label className="choice">
            <input
              type="radio"
              name="payment"
              checked={paymentMethod === "RAZORPAY"}
              onChange={() => setPaymentMethod("RAZORPAY")}
            />
            Pay online with Razorpay
          </label>

          <p className="muted">
            For online payments, your payment is confirmed only after
            the backend verifies Razorpay's payment signature.
          </p>
        </fieldset>

        <button
          type="submit"
          disabled={submitting || loading}
        >
          {submitting
            ? "Processing order..."
            : paymentMethod === "RAZORPAY"
              ? "Place order & pay"
              : "Place order"}
        </button>
      </form>
    </section>
  );
}
