import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Menu, MenuItem, Box } from '@mui/material';
import { Language as LanguageIcon } from '@mui/icons-material';
import { useState } from 'react';

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);


  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng).then(() => {
      // Forzar el guardado en localStorage
      localStorage.setItem('i18nextLng', lng);
    });
    handleClose();
  };

  const getCurrentLanguageName = () => {
    return i18n.language === 'es' ? t('language.spanish') : t('language.english');
  };

  return (
    <Box>
      <Button
        id="language-button"
        aria-controls={open ? 'language-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        startIcon={<LanguageIcon />}
        sx={{ 
          color: '#c8626d',
          textTransform: 'none',
          fontSize: '0.8rem',
          fontWeight: 600,
          border: '1px solid #c8626d',
          borderRadius: '20px',
          px: 2,
          py: 0.5,
          '&:hover': {
            backgroundColor: '#c8626d',
            color: 'white'
          }
        }}
      >
        {getCurrentLanguageName()}
      </Button>
      <Menu
        id="language-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'language-button',
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <MenuItem 
          onClick={() => changeLanguage('en')}
          selected={i18n.language === 'en'}
        >
          {t('language.english')}
        </MenuItem>
        <MenuItem 
          onClick={() => changeLanguage('es')}
          selected={i18n.language === 'es'}
        >
          {t('language.spanish')}
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default LanguageSwitcher;
