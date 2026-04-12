import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginSchema, type LoginInput } from "../../types/auth";
import { InputField } from "./InputField";
import { useAuth } from "../../context/AuthContext";
import "./AuthForms.css";

export const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<Partial<LoginInput>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof LoginInput]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setErrors({});

    try {
      loginSchema.parse(formData);

      setLoading(true);
      await login(formData.email, formData.password);
      navigate("/pages/DashboardPage");
    } catch (err: any) {
      if (err.errors) {
        const validationErrors: Partial<LoginInput> = {};
        err.errors.forEach((error: any) => {
          const field = error.path[0];
          validationErrors[field as keyof LoginInput] = error.message;
        });
        setErrors(validationErrors);
      } else {
        setApiError(err.message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Přihlášení</h2>

      {apiError && <div className="alert alert-error">{apiError}</div>}

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
        placeholder="Vaše heslo"
        disabled={loading}
      />

      <button type="submit" disabled={loading} className="auth-button">
        {loading ? "Přihlašuji..." : "Přihlásit se"}
      </button>

      <p className="auth-switch">
        Nemáte účet? <Link to="/pages/RegisterPage">Zaregistrujte se</Link>
      </p>
    </form>
  );
};
