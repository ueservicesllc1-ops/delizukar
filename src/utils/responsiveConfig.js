// Configuración responsive específica para laptops y diferentes tamaños de pantalla

export const breakpoints = {
  // Móviles
  xs: '0px',
  sm: '600px',
  // Tablets
  md: '900px',
  // Laptops (rango problemático)
  laptop: '1024px',
  laptopL: '1440px',
  // Desktop
  lg: '1200px',
  xl: '1536px'
};

export const laptopConfig = {
  // Configuración específica para laptops 1440x1024
  container: {
    maxWidth: '1300px',
    padding: '0 30px'
  },
  header: {
    height: '80px',
    padding: '0 30px'
  },
  banner: {
    height: '500px',
    padding: '50px 30px'
  },
  footer: {
    padding: '80px 30px 50px',
    spacing: '50px'
  },
  grid: {
    spacing: 8,
    columns: 3
  },
  // Configuración específica para 1440x1024
  laptop1440: {
    container: {
      maxWidth: '1300px',
      padding: '0 40px'
    },
    header: {
      height: '85px',
      padding: '0 40px'
    },
    banner: {
      height: '550px',
      padding: '60px 40px'
    },
    footer: {
      padding: '100px 40px 60px',
      spacing: '60px'
    }
  },
  // Configuración específica para HP ProBook
  hpProBook: {
    container: {
      maxWidth: '1200px',
      padding: '0 20px'
    },
    header: {
      height: '70px',
      padding: '0 20px'
    },
    banner: {
      height: '450px',
      padding: '30px 20px'
    },
    footer: {
      padding: '60px 20px 40px',
      spacing: '40px'
    },
    grid: {
      spacing: 6,
      columns: 3
    }
  }
};

export const getResponsiveValue = (values) => {
  return {
    xs: values.xs || values.sm || values.md || values.lg,
    sm: values.sm || values.md || values.lg,
    md: values.md || values.lg,
    lg: values.lg,
    xl: values.xl || values.lg
  };
};

export const laptopMediaQuery = `@media (min-width: 1024px) and (max-width: 1440px)`;
export const laptop1440MediaQuery = `@media (min-width: 1024px) and (max-width: 1440px) and (min-height: 1024px)`;
export const hpProBookMediaQuery = `@media (min-width: 1024px) and (max-width: 1440px) and (min-height: 768px) and (max-height: 1024px)`;
export const tabletMediaQuery = `@media (min-width: 768px) and (max-width: 1023px)`;
export const mobileMediaQuery = `@media (max-width: 767px)`;
