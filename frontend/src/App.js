import { useState, useEffect, createContext, useContext } from "react";
import "@/App.css";
import { HashRouter, Routes, Route, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Toaster, toast } from "sonner";
import Header from "./components/Header";
import GlobalSearchBar from "./components/GlobalSearchBar";
import HomePage from "./pages/HomePage";
import CarDetailPage from "./pages/CarDetailPage";
import MyListingsPage from "./pages/MyListingsPage";
import CreateListingPage from "./pages/CreateListingPage";
import FavoritesPage from "./pages/FavoritesPage";
import SavedSearchesPage from "./pages/SavedSearchesPage";
import MessagesPage from "./pages/MessagesPage";
import ProfilePage from "./pages/ProfilePage";
import PublicProfilePage from "./pages/PublicProfilePage";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Auth Context
export const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

function App() {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      return null;
    }
    try {
      return JSON.parse(storedUser);
    } catch (e) {
      localStorage.removeItem("user");
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const res = await axios.get(`${API}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(res.data);
          localStorage.setItem("user", JSON.stringify(res.data));
        } catch (e) {
          const status = e?.response?.status;
          if (status === 401 || status === 403) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setToken(null);
            setUser(null);
          }
        }
      } else {
        localStorage.removeItem("user");
        setUser(null);
      }
      setLoading(false);
    };
    checkAuth();
  }, [token]);

  const login = (newToken, userData) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      <div className="App min-h-screen bg-white pb-20">
        <Toaster position="top-center" richColors />
        <HashRouter>
          <Header />
          <GlobalSearchBar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/car/:id" element={<CarDetailPage />} />
            <Route path="/my-listings" element={<MyListingsPage />} />
            <Route path="/create-listing" element={<CreateListingPage />} />
            <Route path="/edit-listing/:id" element={<CreateListingPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/saved-searches" element={<SavedSearchesPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/user/:userId" element={<PublicProfilePage />} />
          </Routes>
        </HashRouter>
      </div>
    </AuthContext.Provider>
  );
}

export default App;
