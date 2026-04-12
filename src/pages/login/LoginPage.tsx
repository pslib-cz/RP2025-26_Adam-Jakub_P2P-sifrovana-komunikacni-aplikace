import { LoginForm } from "../../components/form/LoginForm";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  return (
  <div className={styles.authContainer}>
<LoginForm />
</div>
  );
}


