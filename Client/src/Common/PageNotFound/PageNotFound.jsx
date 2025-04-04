// src/NotAuthorized.jsx
import React from "react";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import notAuthorizedImage from "../../Assets/NotAuthorized.png";

const NotAuthorized = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/dashboard");
  };

  return (
    <div style={styles.container}>
      <div style={styles.imageContainer}>
        <img
          src={notAuthorizedImage}
          alt="Not Authorized"
          style={styles.image}
        />
      </div>
      <h5 > Sorry,You Do Not Have Permission To View This Page!.</h5>
      <Button variant="contained" color="primary" onClick={handleBack}>
        Go Back
      </Button>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "80vh",
    textAlign: "center",
  },
  imageContainer: {
    width: "200px",
    height: "200px",
    marginBottom: "20px",
    animation: "float 3s ease-in-out infinite",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  title: {
    fontSize: "2rem",
    marginBottom: "20px",
  }
};

const styleSheet = document.styleSheets[0];
styleSheet.insertRule(
  `@keyframes float {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-20px);
    }
  }`,
  styleSheet.cssRules.length
);

export default NotAuthorized;