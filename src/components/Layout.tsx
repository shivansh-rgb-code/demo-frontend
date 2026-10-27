import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export function Layout() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">
          Food Delivery
        </Link>
        <nav className="nav">
          <NavLink to="/">Restaurants</NavLink>
          <NavLink to="/orders">Orders</NavLink>
          <NavLink to="/account">Account</NavLink>
          <NavLink to="/cart">Cart ({itemCount})</NavLink>
        </nav>
        <div className="session">
          {user ? (
            <>
              <span className="muted">{user.fullName}</span>
              <button type="button" className="linkish" onClick={() => void logout()}>
                Log out
              </button>
            </>
          ) : (
            <NavLink to="/login">Log in</NavLink>
          )}
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

