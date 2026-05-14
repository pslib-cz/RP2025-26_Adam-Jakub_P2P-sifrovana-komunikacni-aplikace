import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { profileSchema } from "../../types/auth";
import styles from "./ProfilePage.module.css";
import { Pencil, ChevronLeft } from "lucide-react";
function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateProfile, logout } = useAuth();

  const [username, setUsername] = useState(user?.username || "");
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || "/pfp-default.png");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) {
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Nahraný soubor musí být obrázek!");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Obrázek nesmí být větší než 2MB!");
      return;
    }

    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setProfilePicture(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const result = profileSchema.safeParse({ username });
      if (!result.success) {
        setError(result.error?.issues[0]?.message || "Profil se nepodařilo změnit");
        return;
      }

      const newProfilePicture = profilePicture !== user?.profilePicture ? profilePicture : undefined;
      await updateProfile(username, newProfilePicture);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Nepodařilo se aktualizovat profil.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/pages/HomePage");
    } catch (err: any) {
      console.error("Logout err", err);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.content}>
        <header className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate("/dashboard")} title="Zpět na dashboard">
            <ChevronLeft size={24} />
          </button>
          <h1 className={styles.headerTitle}>Upravit profil</h1>
        </header>


        <div className={styles.avatarSection}>
          <img
            src={profilePicture}
            alt="Profile Avatar"
            className={styles.avatar}
          />

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className={styles.avatarInput}
            id="avatarUpload"
          />

          <label htmlFor="avatarUpload" className={styles.avatarLabel}>
            Upravit obrázek <Pencil />
          </label>
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <form onSubmit={handleSave} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="username">Uživatelské jméno</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) setError(null);
              }}
              className={styles.input}
              placeholder="Zadej nové jméno"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="email">Email (nelze měnit)</label>
            <input
              id="email"
              type="email"
              value={user.email}
              disabled
              className={styles.input}
            />
          </div>



          <button type="submit" disabled={loading} className={styles.saveButton}>
            {loading ? "Ukládám..." : "Uložit změny"}
          </button>
        </form>

        <button onClick={handleLogout} className={styles.logoutButton}>
          Odhlásit se
        </button>
      </div>
    </main>
  );
}

export default ProfilePage;