import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { useAuth, API } from "../App";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { User, Camera, Save, Loader2 } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function ProfilePage() {
  const { user, token, login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    nickname: "",
    phone: "",
    avatar: "",
    showFavorites: true,
    showSavedSearches: false
  });

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    fetchProfile();
  }, [user, navigate]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile({
        name: res.data.name || "",
        nickname: res.data.nickname || "",
        phone: res.data.phone || "",
        avatar: res.data.avatar || "",
        showFavorites: res.data.show_favorites !== false,
        showSavedSearches: res.data.show_saved_searches || false
      });
    } catch (err) {
      // Use existing user data as fallback
      setProfile(prev => ({
        ...prev,
        name: user.name || "",
        phone: user.phone || ""
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await axios.put(`${API}/profile`, {
        name: profile.name,
        nickname: profile.nickname,
        phone: profile.phone,
        avatar: profile.avatar,
        show_favorites: profile.showFavorites,
        show_saved_searches: profile.showSavedSearches
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local user state
      login(token, { ...user, ...res.data });
      toast.success("Profile updated!");
    } catch (err) {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);
    formData.append("authorization", `Bearer ${token}`);

    try {
      const res = await axios.post(`${API}/profile/avatar`, formData, {
        headers: { 
          "Content-Type": "multipart/form-data"
        }
      });
      setProfile(prev => ({ ...prev, avatar: res.data.avatar }));
      toast.success("Avatar uploaded!");
    } catch (err) {
      toast.error("Failed to upload avatar");
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="profile-page">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-manrope font-bold text-2xl sm:text-3xl text-slate-900 mb-8">
          Profile Settings
        </h1>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative" data-testid="avatar-container">
              <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden" data-testid="avatar">
                {profile.avatar ? (
                  <img 
                    src={profile.avatar.startsWith('/') ? `${BACKEND_URL}${profile.avatar}` : profile.avatar} 
                    alt="Avatar" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <User className="w-10 h-10 text-slate-400" />
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center cursor-pointer hover:bg-slate-700 transition-colors" data-testid="avatar-upload">
                <Camera className="w-4 h-4 text-white" />
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleAvatarUpload}
                  data-testid="avatar-input"
                />
              </label>
            </div>
            <div>
              <p className="font-semibold text-slate-900">{profile.name}</p>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input
              value={profile.name}
              onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
              className="h-12 bg-slate-50"
              data-testid="profile-name"
            />
          </div>

          {/* Nickname */}
          <div className="space-y-2">
            <Label>Nickname (public display name)</Label>
            <Input
              value={profile.nickname}
              onChange={(e) => setProfile(prev => ({ ...prev, nickname: e.target.value }))}
              placeholder="e.g. CarEnthusiast92"
              className="h-12 bg-slate-50"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input
              value={profile.phone}
              onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+1 234 567 8900"
              className="h-12 bg-slate-50"
            />
          </div>

          {/* Privacy Settings */}
          <div className="border-t border-slate-100 pt-6">
            <h3 className="font-semibold text-slate-900 mb-4">Public Profile Settings</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">Show Favorites</p>
                  <p className="text-sm text-slate-500">Others can see your favorite cars</p>
                </div>
                <Switch
                  checked={profile.showFavorites}
                  onCheckedChange={(checked) => setProfile(prev => ({ ...prev, showFavorites: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">Show Saved Searches</p>
                  <p className="text-sm text-slate-500">Others can see your saved search criteria</p>
                </div>
                <Switch
                  checked={profile.showSavedSearches}
                  onCheckedChange={(checked) => setProfile(prev => ({ ...prev, showSavedSearches: checked }))}
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saving}
            data-testid="save-profile-btn"
            className="w-full h-12 rounded-full bg-slate-900 text-white hover:bg-slate-800"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>

          {/* View Public Profile */}
          <Button
            variant="outline"
            onClick={() => navigate(`/user/${user.id}`)}
            className="w-full h-12 rounded-full"
          >
            View My Public Profile
          </Button>
        </div>
      </div>
    </div>
  );
}
