import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Typography, Box } from '@mui/material';
import { AiOutlineUser, AiFillLock } from 'react-icons/ai';
import { useNavigate } from 'react-router-dom';
import logo from "../../Assets/jklogo.png";
import Swal from 'sweetalert2';
import './Login.css';

const API_URL = process.env.REACT_APP_API;

const Login = () => {
  const navigate = useNavigate();
  const UsernameRef = useRef(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loginData, setLoginData] = useState({
    Login_Name: '',
    Password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loginData.Login_Name || !loginData.Password) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Please fill in both the username and password fields!',
      });
      return;
    }
    try {
      const response = await axios.post(`${API_URL}/login`, loginData);
      const { user_data, access_token } = response.data;
      sessionStorage.setItem('user_type', user_data.UserType);
      sessionStorage.setItem('access_token', access_token);

      const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 1000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.onmouseenter = Swal.stopTimer;
          toast.onmouseleave = Swal.resumeTimer;
        }
      });
      Toast.fire({
        icon: "success",
        title: "Signed in successfully"
      });

      setTimeout(() => {
        navigate("/company-list");
      }, 1000);

    } catch (error) {
      if (error.response) {
        Swal.fire({
          icon: 'error',
          title: 'Login Failed',
          text: error.response.data.error || "Login failed!",
        });
      } else if (error.request) {
        Swal.fire({
          icon: 'error',
          title: 'Network Error',
          text: 'The login request was made but no response was received.',
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'An Error Occurred',
          text: error.message,
        });
      }
    }
  };

  useEffect(() => {
    UsernameRef.current.focus();
  }, []);

  return (
    <div className="form-container">
      <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
        <img src={logo} alt="Company Logo" />
        <Typography variant="h5" style={{ color: "green" }} gutterBottom>JK Sugars & Commodities Pvt. Ltd</Typography>
      </Box>
      <form className="form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label>Username</label>
          <div className="input-wrapper">
            <AiOutlineUser />
            <input
              type="text"
              className="input"
              placeholder="Enter your Username"
              name="Login_Name"
              value={loginData.Login_Name}
              onChange={handleChange}
              ref={UsernameRef}
              autoComplete="off"
            />
          </div>
        </div>
        <div className="form-field">
          <label>Password</label>
          <div className="input-wrapper">
            <AiFillLock />
            <input
              type={passwordVisible ? "text" : "password"}
              className="input"
              placeholder="Enter your Password"
              name="Password"
              value={loginData.Password}
              onChange={handleChange}
              autoComplete="off"
            />
          </div>
        </div>
        <button className="button-submit" type="submit">Sign In</button>
        <p className="p">Don't have an account? <span className="span">Sign Up</span></p>
      </form>
    </div>

  );
};

export default Login;
