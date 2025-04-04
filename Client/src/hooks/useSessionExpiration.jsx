import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';

const IDLE_TIMEOUT = 3600000;
const REFRESH_INTERVAL = 900000;

const useSessionExpiration = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/') return;
    let idleTimer;
    let refreshInterval;

    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        sessionStorage.clear();
        Swal.fire({
          icon: 'warning',
          title: 'Session Expired',
          text: 'You were logged out due to inactivity.',
        }).then(() => {
          navigate('/');
        });
      }, IDLE_TIMEOUT);
    };

    const refreshToken = async () => {
      const token = sessionStorage.getItem('access_token');
      if (!token) return;

      try {
        const res = await axios.get(`${process.env.REACT_APP_API}/check-token`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.data?.new_token) {
          sessionStorage.setItem('access_token', res.data.new_token);
        }

      } catch (err) {
        if (
          err.response &&
          err.response.status === 401 &&
          err.response.data?.msg === "Token has expired"
        ) {
          sessionStorage.clear();
          Swal.fire({
            icon: 'warning',
            title: 'Session Expired',
            text: 'Your session has expired. Please log in again.',
          }).then(() => {
            navigate('/');
          });
        }
      }
    };

    const events = ['mousemove', 'keydown', 'mousedown', 'scroll', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, resetIdleTimer));

    refreshInterval = setInterval(refreshToken, REFRESH_INTERVAL);

    resetIdleTimer();

    return () => {
      clearTimeout(idleTimer);
      clearInterval(refreshInterval);
      events.forEach((event) => window.removeEventListener(event, resetIdleTimer));
    };
  }, [navigate]);
};

export default useSessionExpiration;
