import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useAuth, API } from "../App";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Eye, EyeOff, Mail, Lock, User, Phone } from "lucide-react";

export default function AuthModal({ open, onClose }) {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    phone: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const payload = isLogin 
        ? { email: form.email, password: form.password }
        : form;
      
      const res = await axios.post(`${API}${endpoint}`, payload);
      login(res.data.access_token, res.data.user);
      toast.success(isLogin ? "Welcome back!" : "Account created successfully!");
      onClose();
      setForm({ email: "", password: "", name: "", phone: "" });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="auth-modal">
        <DialogHeader>
          <DialogTitle className="text-2xl font-manrope font-bold text-center">
            {isLogin ? "Welcome Back" : "Create Account"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {!isLogin && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="name"
                    data-testid="auth-name-input"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="pl-10 h-12 bg-slate-50 border-slate-200"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="phone"
                    data-testid="auth-phone-input"
                    placeholder="+1 234 567 8900"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="pl-10 h-12 bg-slate-50 border-slate-200"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="email"
                type="email"
                data-testid="auth-email-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="pl-10 h-12 bg-slate-50 border-slate-200"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                data-testid="auth-password-input"
                placeholder="********"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="pl-10 pr-10 h-12 bg-slate-50 border-slate-200"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            data-testid="auth-submit-btn"
            className="w-full h-12 rounded-full bg-slate-900 text-white font-semibold hover:bg-slate-800"
            disabled={loading}
          >
            {loading ? "Please wait..." : (isLogin ? "Sign In" : "Create Account")}
          </Button>
        </form>

        <div className="text-center mt-4">
          <button
            type="button"
            data-testid="auth-toggle-btn"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
