import { RegisterForm } from "../../components/form/RegisterForm";
import styles from "../login/LoginPage.module.css";

export default function RegisterPage() {
  return (
    <main className={styles.authContainer}>
        <RegisterForm />
    </main>
  );
}
