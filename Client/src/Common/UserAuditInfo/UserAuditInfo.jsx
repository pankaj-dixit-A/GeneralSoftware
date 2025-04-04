import React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

const UserAuditInfo = ({ createdBy, modifiedBy, title }) => {
  return (
    <>
      <Box sx={{
        backgroundColor: '#eefefd',
        padding: '10px',
        marginTop: '20px',
        maxWidth: '250px',
        width: '80%',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',

      }}>
        <Typography variant="subtitle2" gutterBottom component="h2" sx={{
          fontSize: '14px',
          color: 'blue',
          fontWeight: 'bold',
          letterSpacing: '1px'

        }}>
          Created By: {createdBy}
        </Typography>
      </Box>

      <Box sx={{
        backgroundColor: '#eefefd',
        padding: '10px',
        float: 'right',
        maxWidth: '250px',
        width: '80%',
        marginTop: '-43px',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <Typography variant="subtitle2" gutterBottom component="h2" sx={{
          fontSize: '14px',
          color: 'blue',
          margin: 0,
          fontWeight: 'bold',
          letterSpacing: '1px'
        }}>
          Modified By: {modifiedBy}
        </Typography>
      </Box>
      <Typography variant="subtitle2" gutterBottom component="h2" sx={{
        fontSize: '20px',
        color: 'black',
        fontWeight: 'bold',
        letterSpacing: '1px',
        marginTop:"-30px",
        textAlign:"center",
        marginLeft:"200px"
      }}>
        {title}
      </Typography>
    </>
  );
};

export default UserAuditInfo;
