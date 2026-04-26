import { LoginForm } from "../../components/form/LoginForm";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  return (
  <main className={styles.authContainer}>
<LoginForm />
</main>
  );
}


