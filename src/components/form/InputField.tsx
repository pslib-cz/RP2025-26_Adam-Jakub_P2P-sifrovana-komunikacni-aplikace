import React from "react";
import styles from "./InputField.module.css";

interface InputFieldProps {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const InputField: React.FC<InputFieldProps> = ({
  id,
  label,
  type,
  value,
  onChange,
  error,
  placeholder,
  disabled = false,
}) => {
  return (
    <div className={styles.formGroup}>
      <label htmlFor={id} className={styles.formGroup__label}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`${styles.formGroup__input} ${error ? styles["formGroup__input--error"] : ""}`}
      />
      {error && <span className={styles.formGroup__error}>{error}</span>}
    </div>
  );
};
