import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginSchema, type LoginInput } from "../../types/auth";
import { InputField } from "./InputField";
import { useAuth } from "../../context/AuthContext";
import styles from "./AuthForms.module.css";

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

    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const validationErrors: Partial<LoginInput> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0];
        validationErrors[field as keyof LoginInput] = issue.message;
      });
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      await login(formData.email, formData.password);
      navigate("/dashboard");
    } catch (err: any) {
      setApiError(err.message || "Přihlášení selhalo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.authForm}>
      <h1>Přihlášení</h1>

      {apiError && <div className={`${styles.alert} ${styles["alert--error"]}`}>{apiError}</div>}

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

      <button type="submit" disabled={loading} className={styles.authButton}>
        {loading ? "Přihlašuji..." : "Přihlásit se"}
      </button>

      <p className={styles.authSwitch}>
        Nemáte účet? <Link to="/register">Zaregistrujte se</Link>
      </p>
    </form>
  );
};
