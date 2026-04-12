import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerSchema, type RegisterInput } from "../../types/auth";
import { InputField } from "./InputField";
import { useAuth } from "../../context/AuthContext";
import "./AuthForms.css";

export const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState({
    userId: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Partial<RegisterInput>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof RegisterInput]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setErrors({});

    try {
      registerSchema.parse(formData);

      setLoading(true);
      await register(formData.userId, formData.username, formData.email, formData.password);
      navigate("/pages/DashboardPage");
    } catch (err: any) {
      if (err.errors) {
        const validationErrors: Partial<RegisterInput> = {};
        err.errors.forEach((error: any) => {
          const field = error.path[0];
          validationErrors[field as keyof RegisterInput] = error.message;
        });
        setErrors(validationErrors);
      } else {
        setApiError(err.message || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Vytvořit účet</h2>

      {apiError && <div className="alert alert-error">{apiError}</div>}

      <InputField
        id="userId"
        label="Uživatelské ID"
        type="text"
        value={formData.userId}
        onChange={(value) => handleChange("userId", value)}
        error={errors.userId}
        placeholder="Např. john_doe"
        disabled={loading}
      />

      <InputField
        id="username"
        label="Jméno"
        type="text"
        value={formData.username}
        onChange={(value) => handleChange("username", value)}
        error={errors.username}
        placeholder="Vaše jméno"
        disabled={loading}
      />

      <InputField
        id="email"
        label="Email"
        type="email"
        value={formData.email}
        onChange={(value) => handleChange("email", value)}
        error={errors.email}
        placeholder="vase@email.com"
        disabled={loading}
      />

      <InputField
        id="password"
        label="Heslo"
        type="password"
        value={formData.password}
        onChange={(value) => handleChange("password", value)}
        error={errors.password}
        placeholder="Min. 8 znaků, velké písmeno, číslo"
        disabled={loading}
      />

      <InputField
        id="confirmPassword"
        label="Potvrďte heslo"
        type="password"
        value={formData.confirmPassword}
        onChange={(value) => handleChange("confirmPassword", value)}
        error={errors.confirmPassword}
        placeholder="Opakujte heslo"
        disabled={loading}
      />

      <button type="submit" disabled={loading} className="auth-button">
        {loading ? "Registruji..." : "Registrace"}
      </button>

      <p className="auth-switch">
        Už máte účet? <Link to="/pages/LoginPage">Přihlaste se</Link>
      </p>
    </form>

    </div>  
  );
};
