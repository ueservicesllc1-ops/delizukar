// Sistema de diseño responsivo universal
// Basado en las mejores prácticas de Shopify, Amazon, etc.

export const breakpoints = {
  xs: '0px',      // Móviles pequeños
  sm: '600px',    // Móviles grandes
  md: '768px',    // Tablets
  lg: '1024px',   // Laptops pequeños
  xl: '1200px',   // Laptops grandes
  xxl: '1440px'   // Desktop
};

// Configuración responsiva universal
export const responsiveConfig = {
  // Contenedores flexibles
  container: {
    maxWidth: '100%',
    padding: { xs: '16px', sm: '24px', md: '32px', lg: '40px' },
    margin: '0 auto'
  },
  
  // Grid responsivo
  grid: {
    spacing: { xs: 2, sm: 3, md: 4, lg: 6 },
    columns: { xs: 1, sm: 2, md: 3, lg: 4 }
  },
  
  // Tipografía responsiva
  typography: {
    h1: { xs: '1.5rem', sm: '2rem', md: '2.5rem', lg: '3rem' },
    h2: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem', lg: '2rem' },
    h3: { xs: '1.125rem', sm: '1.25rem', md: '1.5rem', lg: '1.75rem' },
    body: { xs: '0.875rem', sm: '1rem', md: '1.125rem', lg: '1.25rem' }
  },
  
  // Espaciado responsivo
  spacing: {
    xs: { xs: 1, sm: 2, md: 3, lg: 4 },
    sm: { xs: 2, sm: 3, md: 4, lg: 6 },
    md: { xs: 3, sm: 4, md: 6, lg: 8 },
    lg: { xs: 4, sm: 6, md: 8, lg: 12 }
  }
};

// Media queries responsivas
export const mediaQueries = {
  mobile: `@media (max-width: 767px)`,
  tablet: `@media (min-width: 768px) and (max-width: 1023px)`,
  laptop: `@media (min-width: 1024px) and (max-width: 1439px)`,
  desktop: `@media (min-width: 1440px)`
};

// Utilidades responsivas
export const getResponsiveValue = (values) => {
  return {
    xs: values.xs || values.sm || values.md || values.lg,
    sm: values.sm || values.md || values.lg,
    md: values.md || values.lg,
    lg: values.lg,
    xl: values.xl || values.lg
  };
};

// Configuración de componentes responsivos
export const responsiveComponents = {
  container: {
    padding: { xs: '0 16px', sm: '0 24px', md: '0 32px', lg: '0 40px', xl: '0 50px' }
  },
  
  header: {
    height: { xs: '120px', sm: '130px', md: '140px', lg: '150px', xl: '160px' },
    padding: { xs: '0 16px', sm: '0 24px', md: '0 32px', lg: '0 40px', xl: '0 50px' }
  },
  
  banner: {
    height: { xs: '50vh', sm: '55vh', md: '60vh', lg: '65vh', xl: '70vh' },
    padding: { xs: '20px 16px', sm: '30px 24px', md: '40px 32px', lg: '50px 40px', xl: '60px 50px' },
    marginTop: { xs: '0px', sm: '0px', md: '0px', lg: '0px', xl: '0px' }
  },
  
  footer: {
    padding: { xs: '20px 16px', sm: '30px 24px', md: '40px 32px', lg: '50px 40px' },
    spacing: { xs: 2, sm: 3, md: 4, lg: 5 }
  }
};
