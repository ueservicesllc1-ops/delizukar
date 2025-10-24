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
          backgroundColor: 'rgba(200, 98, 109, 0.05)',
          '&:hover': {
            backgroundColor: 'rgba(200, 98, 109, 0.15)',
            color: '#c8626d'
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
        PaperProps={{
          sx: {
            backgroundColor: '#fafafa',
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            mt: 1
          }
        }}
      >
        <MenuItem 
          onClick={() => changeLanguage('en')}
          selected={i18n.language === 'en'}
          sx={{
            '&:hover': {
              backgroundColor: 'rgba(200, 98, 109, 0.1)'
            },
            '&.Mui-selected': {
              backgroundColor: 'rgba(200, 98, 109, 0.15)',
              color: '#c8626d'
            }
          }}
        >
          {t('language.english')}
        </MenuItem>
        <MenuItem 
          onClick={() => changeLanguage('es')}
          selected={i18n.language === 'es'}
          sx={{
            '&:hover': {
              backgroundColor: 'rgba(200, 98, 109, 0.1)'
            },
            '&.Mui-selected': {
              backgroundColor: 'rgba(200, 98, 109, 0.15)',
              color: '#c8626d'
            }
          }}
        >
          {t('language.spanish')}
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default LanguageSwitcher;
