import { RegisterForm } from "../../components/form/RegisterForm";
import styles from "../login/LoginPage.module.css";

export default function RegisterPage() {
  return (
    <div className={styles.authContainer}>
        <RegisterForm />
    </div>
  );
}
