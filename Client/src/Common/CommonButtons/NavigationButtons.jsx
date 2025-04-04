import React, { useEffect, useState } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { FirstPage, NavigateBefore, NavigateNext, LastPage } from '@mui/icons-material';

const NavigationButtons = ({
  handleFirstButtonClick,
  handlePreviousButtonClick,
  handleNextButtonClick,
  handleLastButtonClick,
  isEditing,
}) => {
  const [highlightedButton, setHighlightedButton] = useState(null);

  const handleKeyDown = (event, handler) => {
    if (event.key === 'Enter') {
      handler();
    }
  };

  const getBackgroundColor = (button) =>
    highlightedButton === button ? 'blue' : 'blue';

  const buttonStyle = {
    color: 'white',
    backgroundColor: 'blue',
    transition: 'transform 0.3s ease, background-color 0.3s ease',
    cursor: isEditing ? 'not-allowed' : 'pointer',
    width: '30px',
    height: '30px',
    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.2)',
    fontSize: '12px',

  };


  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '-45px',marginRight:"200px"}}>
      <Tooltip title="First" arrow>
        <IconButton
          style={{
            ...buttonStyle,
            transform: highlightedButton === 'first' ? 'scale(1.1)' : 'scale(1)',
            backgroundColor: getBackgroundColor('first'),
          }}
          onKeyDown={(event) => handleKeyDown(event, handleFirstButtonClick)}
          disabled={isEditing}
          onClick={handleFirstButtonClick}
          onMouseEnter={() => setHighlightedButton('first')}
          onMouseLeave={() => setHighlightedButton(null)}
          aria-label="First Page"
        >
          <FirstPage />
        </IconButton>
      </Tooltip>

      <Tooltip title="Previous" arrow>
        <IconButton
          style={{
            ...buttonStyle,
            transform: highlightedButton === 'previous' ? 'scale(1.1)' : 'scale(1)',
            backgroundColor: getBackgroundColor('previous'),
          }}
          onKeyDown={(event) => handleKeyDown(event, handlePreviousButtonClick)}
          disabled={isEditing}
          onClick={handlePreviousButtonClick}
          onMouseEnter={() => setHighlightedButton('previous')}
          onMouseLeave={() => setHighlightedButton(null)}
          aria-label="Previous Page"
        >
          <NavigateBefore />
        </IconButton>
      </Tooltip>

      <Tooltip title="Next" arrow>
        <IconButton
          style={{
            ...buttonStyle,
            transform: highlightedButton === 'next' ? 'scale(1.1)' : 'scale(1)',
            backgroundColor: getBackgroundColor('next'),
          }}
          onKeyDown={(event) => handleKeyDown(event, handleNextButtonClick)}
          disabled={isEditing}
          onClick={handleNextButtonClick}
          onMouseEnter={() => setHighlightedButton('next')}
          onMouseLeave={() => setHighlightedButton(null)}
          aria-label="Next Page"
        >
          <NavigateNext />
        </IconButton>
      </Tooltip>

      <Tooltip title="Last" arrow>
        <IconButton
          style={{
            ...buttonStyle,
            transform: highlightedButton === 'last' ? 'scale(1.1)' : 'scale(1)',
            backgroundColor: getBackgroundColor('last'),
          }}
          onKeyDown={(event) => handleKeyDown(event, handleLastButtonClick)}
          disabled={isEditing}
          onClick={handleLastButtonClick}
          onMouseEnter={() => setHighlightedButton('last')}
          onMouseLeave={() => setHighlightedButton(null)}
          aria-label="Last Page"
        >
          <LastPage />
        </IconButton>
      </Tooltip>
    </div>
  );
};

export default NavigationButtons;
