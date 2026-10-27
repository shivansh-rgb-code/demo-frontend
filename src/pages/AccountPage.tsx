import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  createAddress,
  deleteAddress,
  getProfile,  updateProfile,
  listAddresses,
  setDefaultAddress,
  updateAddress,
} from "../api/endpoints";
import { Banner, Loading } from "../components/Feedback";
import { useAuth } from "../context/AuthContext";
import type { DeliveryAddress, DeliveryAddressRequest, UserProfile } from "../types";

const blankForm = {
  label: "Home",
  fullAddress: "",
  street: "",
  city: "",
  state: "",
  postalCode: "",
  deliveryInstructions: "",
  isDefault: false,
};

export function AccountPage() {
  const { user: sessionUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(sessionUser);
  const [profileName, setProfileName] = useState(sessionUser?.fullName ?? "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [nextProfile, nextAddresses] = await Promise.all([
        getProfile(),
        listAddresses(),
      ]);
      setProfile(nextProfile);
      setProfileName(nextProfile.fullName);
      setAddresses(nextAddresses);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load account");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);
  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const fullName = profileName.trim();
    if (!fullName || fullName.length > 100) {
      setError("Name must contain between 1 and 100 characters.");
      return;
    }

    setProfileSaving(true);
    setError("");
    setMessage("");

    try {
      const updatedProfile = await updateProfile(fullName);
      setProfile(updatedProfile);
      setProfileName(updatedProfile.fullName);
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update profile");
    } finally {
      setProfileSaving(false);
    }
  }

  function resetForm() {
    setEditingId(null);
    setForm(blankForm);
  }

  function editAddress(address: DeliveryAddress) {
    setEditingId(address.id);
    setForm({
      label: address.label,
      fullAddress: address.fullAddress,
      street: address.street ?? "",
      city: address.city ?? "",
      state: address.state ?? "",
      postalCode: address.postalCode ?? "",
      deliveryInstructions: address.deliveryInstructions ?? "",
      isDefault: address.isDefault,
    });
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const request: DeliveryAddressRequest = {
      label: form.label.trim(),
      fullAddress: form.fullAddress.trim(),
      street: form.street.trim() || undefined,
      city: form.city.trim() || undefined,
      state: form.state.trim() || undefined,
      postalCode: form.postalCode.trim() || undefined,
      deliveryInstructions: form.deliveryInstructions.trim() || undefined,
      isDefault: form.isDefault || addresses.length === 0,
    };

    try {
      if (editingId) {
        await updateAddress(editingId, request);
        setMessage("Address updated.");
      } else {
        await createAddress(request);
        setMessage("Address saved.");
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save address");
    } finally {
      setSaving(false);
    }
  }

  async function makeDefault(id: string) {
    setError("");
    setMessage("");
    try {
      await setDefaultAddress(id);
      setMessage("Default delivery address updated.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to change default address");
    }
  }

  async function removeAddress(address: DeliveryAddress) {
    if (!window.confirm(`Delete the "${address.label}" address?`)) return;
    setError("");
    setMessage("");
    try {
      await deleteAddress(address.id);
      if (editingId === address.id) resetForm();
      setMessage("Address deleted.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete address");
    }
  }

  return (
    <section className="stack">
      <h1>My account</h1>
      {error ? <Banner kind="error">{error}</Banner> : null}
      {message ? <Banner kind="success">{message}</Banner> : null}
      {loading ? <Loading /> : null}
      {profile ? (
        <div className="card stack">
          <h2>Profile</h2>
          <p><strong>Role:</strong> {profile.role.replaceAll("_", " ")}</p>
          <p><strong>Account status:</strong> {profile.accountStatus}</p>
          <p className="muted">Account role and status cannot be changed here.</p>

          <form className="stack" onSubmit={saveProfile}>
            <label>
              Full name
              <input
                required
                minLength={1}
                maxLength={100}
                autoComplete="name"
                value={profileName}
                onChange={(event) => setProfileName(event.target.value)}
              />
            </label>
            <div className="toolbar">
              <button type="submit" disabled={profileSaving || !profileName.trim()}>
                {profileSaving ? "Saving profile..." : "Save profile"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="card stack">
        <h2>{editingId ? "Edit address" : "Add a delivery address"}</h2>
        <form className="stack" onSubmit={save}>
          <label>
            Label
            <input required maxLength={50} value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })} />
          </label>
          <label>
            Full address
            <textarea required maxLength={500} value={form.fullAddress}
              onChange={(e) => setForm({ ...form, fullAddress: e.target.value })} />
          </label>
          <label>
            Street (optional)
            <input maxLength={200} value={form.street}
              onChange={(e) => setForm({ ...form, street: e.target.value })} />
          </label>
          <div className="address-fields">
            <label>
              City
              <input maxLength={100} value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </label>
            <label>
              State
              <input maxLength={100} value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </label>
            <label>
              Postal code
              <input maxLength={20} value={form.postalCode}
                onChange={(e) => setForm({ ...form, postalCode: e.target.value })} />
            </label>
          </div>
          <label>
            Delivery instructions (optional)
            <textarea maxLength={500} value={form.deliveryInstructions}
              onChange={(e) => setForm({ ...form, deliveryInstructions: e.target.value })} />
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={form.isDefault}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
            Make this my default address
          </label>
          <div className="toolbar">
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Save changes" : "Add address"}
            </button>
            {editingId ? (
              <button type="button" className="secondary" onClick={resetForm}>Cancel edit</button>
            ) : null}
          </div>
        </form>
      </div>

      <div className="stack">
        <h2>Saved addresses</h2>
        {!loading && addresses.length === 0 ? (
          <p className="muted">No saved addresses yet.</p>
        ) : null}
        {addresses.map((address) => (
          <article className="card stack" key={address.id}>
            <div className="row-gap">
              <strong>{address.label}</strong>
              {address.isDefault ? <span className="pill open">Default</span> : null}
            </div>
            <p>{address.fullAddress}</p>
            {address.deliveryInstructions ? (
              <p className="muted">Instructions: {address.deliveryInstructions}</p>
            ) : null}
            <div className="toolbar">
              <button type="button" className="secondary" onClick={() => editAddress(address)}>Edit</button>
              {!address.isDefault ? (
                <button type="button" className="secondary" onClick={() => void makeDefault(address.id)}>
                  Set default
                </button>
              ) : null}
              <button type="button" className="secondary" onClick={() => void removeAddress(address)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
