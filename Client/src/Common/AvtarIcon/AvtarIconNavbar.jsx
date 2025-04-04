import React, { useState, useRef } from 'react';
import { styled } from '@mui/material/styles';
import Badge from '@mui/material/Badge';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CloseIcon from '@mui/icons-material/Close';
import LockIcon from '@mui/icons-material/Lock';
import { useNavigate } from "react-router-dom";
import Slide from '@mui/material/Slide';
import { Box, IconButton } from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import Swal from 'sweetalert2';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import EditIcon from '@mui/icons-material/Edit';

const API_URL = process.env.REACT_APP_API;

const StyledBadge = styled(Badge)(({ theme }) => ({
    '& .MuiBadge-badge': {
        backgroundColor: '#44b700',
        color: '#44b700',
        boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
        '&::after': {
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            animation: 'ripple 1.2s infinite ease-in-out',
            border: '1px solid currentColor',
            content: '""',
        },
    },
    '@keyframes ripple': {
        '0%': { transform: 'scale(.8)', opacity: 1 },
        '100%': { transform: 'scale(2.4)', opacity: 0 },
    },
}));

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

function AvatarIcon() {
    const storedUsername = sessionStorage.getItem('username');
    const [anchorEl, setAnchorEl] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [openChangePasswordDialog, setOpenChangePasswordDialog] = useState(false);

    // Change Password functionality
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const oldPasswordRef = useRef(null);

    const navigate = useNavigate();

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleSignOutClick = () => {
        setOpenDialog(true);
    };

    const handleChangePasswordClick = () => {
        setOpenChangePasswordDialog(true);
        handleClose();
        setOldPassword('')
        setNewPassword('')
        setConfirmPassword('')
        if (oldPasswordRef.current) {
            oldPasswordRef.current.focus();
        }
    };

    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            toast("All Feilds Are Required.!")
            return;
        }

        if (newPassword !== confirmPassword) {
            toast('New password and confirm password must match!');
            return;
        }

        // const accessToken = sessionStorage.getItem('access_token');
        const uid = sessionStorage.getItem('uid');

        // if (!accessToken) {
        //     Swal.fire('Error', 'No access token found. Please login again.', 'error');
        //     return;
        // }

        try {
            const response = await axios.put(
                `${API_URL}/change_password`,
                {
                    uid: uid,
                    Old_Password: oldPassword,
                    New_Password: newPassword,
                },
                // {
                //     headers: {
                //         Authorization: `Bearer ${accessToken}`,
                //     },
                // }
            );

            if (response.status === 200) {
                Swal.fire('Success', 'Password updated successfully', 'success');
                setOpenChangePasswordDialog(false);
            }
            setOldPassword('')
            setNewPassword('')
            setConfirmPassword('')
        } catch (err) {
            console.error(err);
            if (err.response && err.response.data && err.response.data.error) {
                const errorMessage = err.response.data.error;
                toast(errorMessage);
            } else {
                toast('Failed to change password. Please try again.');
            }
        }
    };

    const handleDialogClose = () => {
        setOpenDialog(false);
    };

    const handleSignOut = () => {
        sessionStorage.clear();
        navigate('/');
    };

    const handleChangePasswordDialogClose = () => {
        setOpenChangePasswordDialog(false);
    };

    return (
        <>
            <Tooltip title={storedUsername} >
                <StyledBadge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    variant="dot"
                    sx={{ fontSize: 30 }}
                >
                    <Avatar
                        alt="User Avatar"
                        src=""
                        onClick={handleClick}
                        sx={{ cursor: 'pointer' }}
                    />
                </StyledBadge>
            </Tooltip>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
            >
                <MenuItem onClick={handleClose}>
                    <EditIcon style={{ marginRight: 8 }} />
                    Edit Profile
                </MenuItem>
                <MenuItem onClick={handleChangePasswordClick}>
                    <LockIcon style={{ marginRight: 8 }} />
                    Change Password
                </MenuItem>
                <MenuItem onClick={handleSignOutClick}>
                    <ExitToAppIcon style={{ marginRight: 8 }} />
                    Sign Out
                </MenuItem>
            </Menu>

            <Dialog
                open={openDialog}
                onClose={handleDialogClose}
                TransitionComponent={Transition}
                sx={{
                    '& .MuiDialog-paper': {
                        width: '400px',
                        height: '300px',
                        padding: '20px',
                        borderRadius: '12px',
                        textAlign: 'center',
                        position: 'relative',
                    },
                }}
            >
                <IconButton
                    onClick={handleDialogClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: 'gray',
                    }}
                >
                    <CloseIcon />
                </IconButton>

                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                    <WarningAmberIcon sx={{ fontSize: 80, color: 'orange' }} />
                </Box>

                <DialogTitle>
                    <Typography variant="h6" fontWeight="bold">
                        Confirm Sign Out
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1">
                        Are you sure you want to sign out?
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 2 }}>
                    <Button onClick={handleDialogClose} variant="outlined" autoFocus>
                        Cancel
                    </Button>
                    <Button onClick={handleSignOut} variant="contained" color="error">
                        Sign Out
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={openChangePasswordDialog}
                onClose={handleChangePasswordDialogClose}
                TransitionComponent={Transition}
                sx={{
                    '& .MuiDialog-paper': {
                        width: '400px',
                        padding: '20px',
                        borderRadius: '12px',
                    },
                }}
            >
                <IconButton
                    onClick={handleChangePasswordDialogClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: 'gray',
                    }}
                >
                    <CloseIcon />
                </IconButton>

                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <LockIcon sx={{ fontSize: 50, color: 'green' }} />
                </Box>

                <DialogTitle>
                    <Typography variant="h6" fontWeight="bold" textAlign="center">
                        Change Password
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mb: 2 }}>
                        <input
                            type="password"
                            placeholder="Old Password"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            ref={oldPasswordRef}
                            style={{
                                width: '100%',
                                padding: '8px',
                                borderRadius: '5px',
                                border: '1px solid #ccc',
                            }}
                        />
                    </Box>
                    <Box sx={{ mb: 2 }}>
                        <input
                            type="password"
                            placeholder="New Password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px',
                                borderRadius: '5px',
                                border: '1px solid #ccc',
                            }}
                        />
                    </Box>
                    <Box sx={{ mb: 2 }}>
                        <input
                            type="password"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px',
                                borderRadius: '5px',
                                border: '1px solid #ccc',
                            }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', gap: 2 }}>
                    <Button onClick={handleChangePasswordDialogClose} variant="outlined" color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleChangePassword} variant="contained" color="primary">
                        Change Password
                    </Button>
                </DialogActions>
                <ToastContainer />
            </Dialog>
        </>
    );
}

export default AvatarIcon;

