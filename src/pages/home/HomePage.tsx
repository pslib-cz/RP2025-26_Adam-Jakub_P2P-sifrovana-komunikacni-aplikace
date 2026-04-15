import React from "react";
import styles from "./HomePage.module.css";
import { Link, Navigate, useNavigate } from "react-router-dom";
import AnimatedLogo from "../../components/ui/logo/AnimatedLogo";

function HomePage() {
    const navigate = useNavigate();

  return (
      <div className={styles.homeContainer}>
          <Link className={styles.logoWrapper} to="/HomePage">
              <AnimatedLogo />    
          </Link>     
          <h1>P2P Komunikační aplikace</h1>
          <button onClick={() => {navigate("/pages/LoginPage");}} className={styles.button}>
            Pokračovat
          </button>
      </div>
  );
}

export default HomePage;