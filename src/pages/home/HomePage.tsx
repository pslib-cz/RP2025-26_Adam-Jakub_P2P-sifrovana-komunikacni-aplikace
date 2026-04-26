import styles from "./HomePage.module.css";
import { Link, useNavigate } from "react-router-dom";
import AnimatedLogo from "../../components/ui/logo/AnimatedLogo";

function HomePage() {
  const navigate = useNavigate();

  return (
    <main className={styles.homeContainer}>
      <Link
        className={styles.logoWrapper}
        to="/home"
        aria-label="Domovská stránka"
      >
        <AnimatedLogo />
      </Link>
<span className={styles.lcpFix}>
  P2P Komunikační aplikace
</span>
      <h1 className={styles.title}>
        P2P Komunikační aplikace
      </h1>

      <button
        onClick={() => navigate("/login")}
        className={styles.button}
      >
        Pokračovat
      </button>
    </main>
  );
}

export default HomePage;