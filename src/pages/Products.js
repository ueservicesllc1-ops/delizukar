import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Box, Container, Typography, Grid, Card, CardContent, CardActions, Button, Chip, Rating, IconButton, TextField, InputAdornment, Dialog, DialogContent, Skeleton, Accordion, AccordionSummary, AccordionDetails, useMediaQuery, useTheme } from '@mui/material';
import { Close, ExpandMore } from '@mui/icons-material';
import { Search, AddShoppingCart, Favorite, FavoriteBorder, AccountBalanceWallet, ShoppingBag } from '@mui/icons-material';
import { useStore } from '../context/StoreContext';
import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
// import VideoReviewsCarousel from '../components/VideoReviewsCarousel';
import ComparisonTable from '../components/ComparisonTable';
import ProductImageCarousel from '../components/ProductImageCarousel';
import ProductImage from '../components/ProductImage';
import BoxSelectionPopup from '../components/BoxSelectionPopup';
import AfterpayMessaging from '../components/AfterpayMessaging';
import { useLanguage } from '../context/LanguageContext';

const TEXTS = {
  es: {
    title: 'Nuestras Galletas',
    addToCart: 'Agregar al carrito',
    nuevo: 'Nuevo',
    masVendido: 'Más vendido',
    stock: 'Stock:',
    units: 'unidades',
    agotado: 'Agotado',
    stockBajo: 'Stock bajo',
    stockMedio: 'Stock medio',
    enStock: 'En stock',
    reseñas: 'reseñas',
    cerrar: 'Cerrar',
    stockDisponible: 'Stock disponible:',
    unidades: 'unidades',
    offMessage: 'de descuento aplicado al total',
    ferreroDescription: 'Galleta estilo NY con Ferrero Rocher, chips de chocolate oscuro y avellanas tostadas—intensa, elegante y adictiva.',
    defaultDescription: 'Deliciosas {name} con ingredientes premium. Galletas estilo Nueva York perfectamente horneadas para disfrutar o compartir.',
    aboutTitle: 'Recién horneadas para ti',
    aboutContent: 'En Delizukar no hacemos cookies para almacenar. Cada pedido se hornea al momento con ingredientes de primera calidad. Luego las sellamos para que lleguen a tu puerta tan frescas como salieron del horno. Crujientes por fuera. Suaves y fundentes por dentro. Así debe ser una verdadera cookie.',
    differentTitle: '¿Por qué Delizukar?',
    differentContent: 'Porque las buenas cookies empiezan con ingredientes reales. Mantequilla de verdad. Huevos frescos. Chocolate premium. Sin conservantes. Sin sabores artificiales. Solo cookies artesanales hechas para disfrutarse recién horneadas.',
    ingredientsTitle: 'Ingredientes reales',
    ingredientsContent: 'Harina, mantequilla, huevos, azúcar blanca, azúcar moreno, chocolate, vainilla, polvo para hornear y una pizca de sal. Los ingredientes pueden variar ligeramente según el sabor. Nada más. Sin ingredientes extraños. Solo cookies gruesas, suaves y llenas de sabor. Delizukar no solo somos cookies, somos momentos dulces.'
  },
  en: {
    title: 'Our Cookies',
    addToCart: 'Add to cart',
    nuevo: 'New',
    masVendido: 'Best seller',
    stock: 'Stock:',
    units: 'units',
    agotado: 'Out of stock',
    stockBajo: 'Low stock',
    stockMedio: 'Medium stock',
    enStock: 'In stock',
    reseñas: 'reviews',
    cerrar: 'Close',
    stockDisponible: 'Stock available:',
    unidades: 'units',
    offMessage: 'OFF - Price based on cookies',
    ferreroDescription: 'NY-style cookie with Ferrero Rocher, dark chocolate chips, and toasted hazelnuts—intense, elegant, and addictive.',
    defaultDescription: 'Delicious {name} with premium ingredients. Perfectly baked New York-style cookies to enjoy or share.',
    aboutTitle: 'About our cookies',
    aboutContent: 'At Delizukar, we don\'t bake cookies to sit on a shelf. Every order is baked to order using top-quality ingredients. We then seal them to ensure they arrive at your doorstep as fresh as the moment they left the oven. Crispy on the outside, soft and gooey on the inside. That’s exactly how a real cookie should be.',
    differentTitle: 'What makes us different',
    differentContent: 'Because great cookies start with real ingredients. Real butter. Fresh eggs. Premium chocolate. No preservatives. No artificial flavors. Just artisanal cookies crafted to be enjoyed freshly baked.',
    ingredientsTitle: 'Ingredients',
    ingredientsContent: 'Flour, butter, eggs, white sugar, brown sugar, chocolate, vanilla, baking powder, and a pinch of salt. Ingredients may vary slightly depending on the flavor. Nothing else. No strange additives. Just thick, soft, and flavor-packed cookies. At Delizukar, we aren\'t just about cookies; we are about creating sweet moments.'
  },
  fr: {
    title: 'Nos biscuits',
    addToCart: 'Ajouter au panier',
    nuevo: 'Nouveau',
    masVendido: 'Meilleure vente',
    stock: 'Stock :',
    units: 'unités',
    agotado: 'Rupture de stock',
    stockBajo: 'Stock bas',
    stockMedio: 'Stock moyen',
    enStock: 'En stock',
    reseñas: 'avis',
    cerrar: 'Fermer',
    stockDisponible: 'Stock disponible :',
    unidades: 'unités'
  },
  pt: {
    title: 'Nossos cookies',
    addToCart: 'Adicionar ao carrinho',
    nuevo: 'Novo',
    masVendido: 'Mais vendido',
    stock: 'Estoque:',
    units: 'unidades',
    agotado: 'Esgotado',
    stockBajo: 'Estoque baixo',
    stockMedio: 'Estoque médio',
    enStock: 'Em estoque',
    reseñas: 'avaliações',
    cerrar: 'Fechar',
    stockDisponible: 'Estoque disponible:',
    unidades: 'unidades'
  }
};

export const PRODUCT_TRANSLATIONS = {
  es: {
    'Chocolate Chip Clásica': {
      name: 'Chocolate Chip Clásica',
      description: 'Nuestra galleta de chocolate chip clásica, horneada con trozos de chocolate premium y el sabor de hogar.'
    },
    'Vainilla Premium': {
      name: 'Vainilla Premium',
      description: 'Galleta de vainilla con un toque especial de canela y una textura suave que se deshace en tu boca.'
    },
    'Oatmeal Raisin': {
      name: 'Avena y Pasas',
      description: 'La combinación perfecta de avena natural y pasas dulces, crujiente por fuera y tierna por dentro.'
    },
    'Chocole DeLux': { 
      name: 'Chocole DeLux',
      description: 'Nuestra versión premium de la clásica cookie de chocolate, con ingredientes seleccionados para una experiencia superior.'
    },
    'Chocolate Deluxe': { 
      name: 'Chocolate Deluxe',
      description: 'Una galleta intensa con cuatro tipos de chocolate, textura cremosa y un sabor profundo para los verdaderos amantes del cacao.'
    },
    'Ferrero Hype': { 
      name: 'Ferrero Hype',
      description: 'Galleta estilo NY con bombón Ferrero Rocher, chips de chocolate oscuro y avellanas tostadas—intensa, elegante y adictiva.'
    },
    'PecanBerry Oat': { 
      name: 'PecanBerry Oat',
      description: 'La combinación perfecta de bienestar y sabor. Deliciosa galleta de avena con trozos de pacanas crujientes y arándanos deshidratados.'
    },
    'White Hazelnut Kisses': { 
      name: 'White Hazelnut Kisses',
      description: 'Delicadas por fuera y seductoras por dentro. Nuestros Besos Blancos de Avellanas combinan una masa suave de vainilla blanca con trocitos de avellana tostada, un corazón cremoso de chocolate blanco con avellanas y una fina capa de crujiente cobertura tipo “Ferrero blanco”. Un mordisco… y el amor es inevitable.'
    },
    'Lotus Biscoff Spice': {
      name: 'Lotus Biscoff Spice',
      description: 'Una explosión de especias cálidas y cremosa Lotus, con trozos de Biscoff, chocolate blanco y un toque crujiente que cautiva en cualquier estación. Nuestra galleta más audaz y especiada. En su corazón se encuentra un centro cremoso de Lotus, envuelto en una masa suave salpicada de trozos de galleta Biscoff, chocolate blanco fundente y una mezcla secreta de especias cálidas que despiertan los sentidos. Es como una galleta de invierno... hecha para cualquier época del año. Un deleite intenso, cremoso y crujiente para los amantes de lo extraordinario.'
    },
    'Lotus Cream': {
      name: 'Lotus Cream',
      description: 'Una explosión de especias cálidas y cremosa Lotus, con trozos de Biscoff, chocolate blanco y un toque crujiente que cautiva en cualquier estación. Nuestra galleta más audaz y especiada. En su corazón se encuentra un centro cremoso de Lotus, envuelto en una masa suave salpicada de trozos de galleta Biscoff, chocolate blanco fundente y una mezcla secreta de especias cálidas que despiertan los sentidos. Es como una galleta de invierno... hecha para cualquier época del año. Un deleite intenso, cremoso y crujiente para los amantes de lo extraordinario.'
    },
    'LOTUS CREAM': {
      name: 'Lotus Cream',
      description: 'Una explosión de especias cálidas y cremosa Lotus, con trozos de Biscoff, chocolate blanco y un toque crujiente que cautiva en cualquier estación. Nuestra galleta más audaz y especiada. En su corazón se encuentra un centro cremoso de Lotus, envuelto en una masa suave salpicada de trozos de galleta Biscoff, chocolate blanco fundente y una mezcla secreta de especias cálidas que despiertan los sentidos. Es como una galleta de invierno... hecha para cualquier época del año. Un deleite intenso, cremoso y crujiente para los amantes de lo extraordinario.'
    },
    'Dubai Luxe Pistachio': {
      name: 'Dubai Luxe Pistacho',
      description: 'Intensa, exótica y elegante: chocolate profundo, crema de pistacho y un toque dorado que sabe a lujo. Una joya inspirada en los sabores del desierto, con un cautivador matiz verde. Sobre una base de rico chocolate, cremosas chispas de chocolate, crema de pistacho, el crujiente dorado del kataifi y delicadas láminas de oro comestible. Una galleta intensa, exótica y elegante, como un paseo por Dubái en cada bocado.'
    },
    'GREEN DUBAI GOLD': {
      name: 'Green Dubai Gold',
      description: 'Intensa, exótica y elegante: chocolate profundo, crema de pistacho y un toque dorado que sabe a lujo. Una joya inspirada en los sabores del desierto, con un cautivador matiz verde. Sobre una base de rico chocolate, cremosas chispas de chocolate, crema de pistacho, el crujiente dorado del kataifi y delicadas láminas de oro comestible. Una galleta intensa, exótica y elegante, como un paseo por Dubái en cada bocado.'
    },
    'Green Dubai Gold': {
      name: 'Green Dubai Gold',
      description: 'Intensa, exótica y elegante: chocolate profundo, crema de pistacho y un toque dorado que sabe a lujo. Una joya inspirada en los sabores del desierto, con un cautivador matiz verde. Sobre una base de rico chocolate, cremosas chispas de chocolate, crema de pistacho, el crujiente dorado del kataifi y delicadas láminas de oro comestible. Una galleta intensa, exótica y elegante, como un paseo por Dubái en cada bocado.'
    },
    'RED VERVET KISS': {
      name: 'Red Velvet Kiss',
      description: 'Una galleta inspirada en el clásico red velvet, suave y sedosa, elaborada con cocoa amarga, cargada de chispas de chocolate premium y un corazón fundente de crema de vainilla. El equilibrio perfecto entre elegancia y dulzura.'
    },
    'Red Velvet Kiss': {
      name: 'Red Velvet Kiss',
      description: 'Una galleta inspirada en el clásico red velvet, suave y sedosa, elaborada con cocoa amarga, cargada de chispas de chocolate premium y un corazón fundente de crema de vainilla. El equilibrio perfecto entre elegancia y dulzura.'
    },
    'RED VELVET KISS': {
      name: 'Red Velvet Kiss',
      description: 'Una galleta inspirada en el clásico red velvet, suave y sedosa, elaborada con cocoa amarga, cargada de chispas de chocolate premium y un corazón fundente de crema de vainilla. El equilibrio perfecto entre elegancia y dulzura.'
    },
    'Golden Almond': { 
      name: 'Golden Almond',
      description: 'Elegancia en cada mordisco. Galleta de vainilla con almendras fileteadas tostadas y un toque de caramelo salado que resalta su sabor artesanal.'
    },
    'Gift Message + Premium Card': { 
      name: 'Gift Message + Premium Card',
      description: 'Haz que tu pedido sea aún más especial con nuestra presentación de regalo DeliZukar y una tarjeta personalizada.'
    },
    '"A little luxury Box" 4 Cookies': { 
      name: '"Caja Un Pequeño Lujo" 4 Galletas', 
      description: 'Caja perfecta para disfrutar o regalar un momento dulce.' 
    },
    '"Sweet Moments Box" 6 Cookies': { 
      name: '"Caja Momentos Dulces" 6 Galletas', 
      description: '6 galletas estilo Nueva York para compartir y disfrutar de un momento especial.' 
    },
    '"Sweet Moments Box" 6 New York-style cookies to share and enjoy a special moment.': {
      name: '"Caja Momentos Dulces" 6 Galletas',
      description: '6 galletas estilo Nueva York para compartir y disfrutar de un momento especial.'
    },
    '"A little luxury Box" 4 New York-style cookies perfect to enjoy or gift a sweet moment.': {
      name: '"Caja Un Pequeño Lujo" 4 Galletas',
      description: 'Caja perfecta para disfrutar o regalar un momento dulce.'
    },
    '"Celebration Box" 12 Cookies': { 
      name: '"Caja de Celebración" 12 Galletas', 
      description: '12 galletas estilo Nueva York perfectas para celebrar, compartir o sorprender a alguien.' 
    },
    '"SWEET MOMENTS BOX" 6 NEW YORK-STYLE COOKIES TO SHARE AND ENJOY A SPECIAL MOMENT.': {
      name: '"Caja Momentos Dulces" 6 Galletas',
      description: '6 galletas estilo Nueva York para compartir y disfrutar de un momento especial.'
    },
    '"A LITTLE LUXURY BOX" 4 NEW YORK-STYLE COOKIES PERFECT TO ENJOY OR GIFT A SWEET MOMENT.': {
      name: '"Caja Un Pequeño Lujo" 4 Galletas',
      description: 'Caja perfecta para disfrutar o regalar un momento dulce.'
    }
  },
  en: {
    'Chocolate Chip Clásica': {
      name: 'Classic Chocolate Chip',
      description: 'Our classic chocolate chip cookie, baked with premium chocolate chips and the taste of home.'
    },
    'Vainilla Premium': {
      name: 'Premium Vanilla',
      description: 'Vanilla cookie with a special touch of cinnamon and a soft texture that melts in your mouth.'
    },
    'Oatmeal Raisin': {
      name: 'Oatmeal Raisin',
      description: 'The perfect combination of natural oats and sweet raisins, crispy on the outside and tender on the inside.'
    },
    'Chocole DeLux': { 
      name: 'Chocole DeLux',
      description: 'Our premium version of the classic chocolate cookie, with selected ingredients for a superior experience.'
    },
    'Chocolate Deluxe': { 
      name: 'Chocolate Deluxe',
      description: 'An intense cookie with four types of chocolate, creamy texture, and deep flavor for true cocoa lovers.'
    },
    'Ferrero Hype': { 
      name: 'Ferrero Hype',
      description: 'NY-style cookie with Ferrero Rocher, dark chocolate chips, and toasted hazelnuts—intense, elegant, and addictive.'
    },
    'PecanBerry Oat': { 
      name: 'PecanBerry Oat',
      description: 'The perfect blend of wellness and flavor. Delicious oatmeal cookie with crunchy pecans and dried cranberries.'
    },
    'White Hazelnut Kisses': { 
      name: 'White Hazelnut Kisses',
      description: 'Delicate outside, seductive inside. Our White Hazelnut Kisses combine a soft white vanilla dough with toasted hazelnut pieces, a creamy white chocolate and hazelnut core, and a thin layer of crunchy "white Ferrero" style coating. One bite... and love is inevitable.'
    },
    'Lotus Biscoff Spice': {
      name: 'Lotus Biscoff Spice',
      description: 'A burst of warm spices and creamy Lotus, with Biscoff pieces, white chocolate, and a crunchy touch that captivates in every season. Our boldest and spiciest cookie. At its heart lies a creamy Lotus center, wrapped in a soft dough studded with Biscoff cookie pieces, melting white chocolate, and a secret blend of warm spices that awaken the senses. It’s like a winter cookie… made for any season. An intense, creamy, and crunchy delight for lovers of the extraordinary.'
    },
    'Dubai Luxe Pistachio': {
      name: 'Dubai Luxe Pistachio',
      description: 'Intense, exotic, and elegant: deep chocolate, pistachio cream, and a golden touch that tastes like luxury. A jewel inspired by the flavors of the desert, with a captivating hint of green. On a base of rich chocolate, creamy chocolate chips, pistachio cream, the golden crunch of kataifi, and delicate sheets of edible gold. An intense, exotic, and elegant cookie—like a stroll through Dubai, but in every bite.'
    },
    'LOTUS CREAM': {
      name: 'Lotus Cream',
      description: 'A burst of warm spices and creamy Lotus, with Biscoff pieces, white chocolate, and a crunchy touch that captivates in every season. Our boldest and spiciest cookie. At its heart lies a creamy Lotus center, wrapped in a soft dough studded with Biscoff cookie pieces, melting white chocolate, and a secret blend of warm spices that awaken the senses. It’s like a winter cookie… made for any season. An intense, creamy, and crunchy delight for lovers of the extraordinary.'
    },
    'GREEN DUBAI GOLD': {
      name: 'Green Dubai Gold',
      description: 'Intense, exotic, and elegant: deep chocolate, pistachio cream, and a golden touch that tastes like luxury. A jewel inspired by the flavors of the desert, with a captivating hint of green. On a base of rich chocolate, creamy chocolate chips, pistachio cream, the golden crunch of kataifi, and delicate sheets of edible gold. An intense, exotic, and elegant cookie—like a stroll through Dubai, but in every bite.'
    },
    'RED VERVET KISS': {
      name: 'Red Velvet Kiss',
      description: 'A cookie inspired by the classic red velvet, soft and silky, made with bitter cocoa, loaded with premium chocolate chips and a melting vanilla cream heart. The perfect balance between elegance and sweetness.'
    },
    'Golden Almond': { 
      name: 'Golden Almond',
      description: 'Elegance in every bite. Vanilla cookie with toasted sliced almonds and a touch of salted caramel.'
    },
    'Gift Message + Premium Card': { 
      name: 'Gift Message + Premium Card',
      description: 'Make your order even more special with our DeliZukar gift presentation and a personalized card.'
    },
    '"A little luxury Box" 4 Cookies': { 
      name: '"A little luxury Box" 4 Cookies', 
      description: 'Perfect for enjoying or gifting a sweet moment.' 
    },
    '"Sweet Moments Box" 6 Cookies': { 
      name: '"Sweet Moments Box" 6 Cookies', 
      description: '6 New York-style cookies to share and enjoy a special moment.' 
    },
    '"Sweet Moments Box" 6 New York-style cookies to share and enjoy a special moment.': {
      name: '"Sweet Moments Box" 6 Cookies',
      description: '6 New York-style cookies to share and enjoy a special moment.'
    },
    '"A little luxury Box" 4 New York-style cookies perfect to enjoy or gift a sweet moment.': {
      name: '"A little luxury Box" 4 Cookies',
      description: 'Perfect for enjoying or gifting a sweet moment.'
    },
    '"Celebration Box" 12 Cookies': { 
      name: '"Celebration Box" 12 Cookies', 
      description: '12 New York-style cookies perfect for celebrating, sharing, or surprising someone.' 
    },
    '"SWEET MOMENTS BOX" 6 NEW YORK-STYLE COOKIES TO SHARE AND ENJOY A SPECIAL MOMENT.': {
      name: '"Sweet Moments Box" 6 Cookies',
      description: '6 New York-style cookies to share and enjoy a special moment.'
    },
    '"A LITTLE LUXURY BOX" 4 NEW YORK-STYLE COOKIES PERFECT TO ENJOY OR GIFT A SWEET MOMENT.': {
      name: '"A little luxury Box" 4 Cookies',
      description: 'Perfect for enjoying or gifting a sweet moment.'
    }
  }
};

const Products = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { categories, products, addToCart, productsLoading } = useStore();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showBoxPopup, setShowBoxPopup] = useState(false);
  const [selectedBox, setSelectedBox] = useState(null);
  const [accordionData, setAccordionData] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  React.useEffect(() => {
    const fetchAccordionData = async () => {
      try {
        const docRef = doc(db, 'settings', 'accordionMenu');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setAccordionData(docSnap.data());
        }
      } catch (err) {
        console.error('Error fetching accordion data:', err);
      }
    };
    fetchAccordionData();
  }, []);
  const translatedTexts = useMemo(
    () => TEXTS[language] || TEXTS.es,
    [language]
  );

  return (
    <Box className="products-page-mobile" sx={{ 
      py: 4, 
      pt: { xs: 6, sm: 18, md: 18 }, 
      backgroundColor: '#fafafa', 
      minHeight: '100vh' 
    }}>
      <Container maxWidth="xl" sx={{ maxWidth: '1400px' }}>
        {/* Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography
            sx={{
              fontFamily: 'BrittanySignature',
              fontSize: { xs: '2.4rem', md: '3rem' },
              mt: { xs: 0, md: 2.5 },
              color: '#c8626d'
            }}
          >
            {translatedTexts.title}
          </Typography>
        </Box>

        {/* Grid de productos */}
        <Grid container spacing={3} className="products-grid-mobile" sx={{ 
          display: 'grid',
          gridTemplateColumns: { 
            xs: '1fr', 
            sm: 'repeat(2, 1fr)', 
            md: 'repeat(3, 1fr)' 
          },
          gap: 3,
          maxWidth: '1000px',
          mx: 'auto'
        }}>
          {productsLoading ? (
            // Skeleton loading mientras cargan los productos
            Array.from({ length: 8 }).map((_, index) => (
              <Box key={index}>
                <Card sx={{ width: '100%', height: '320px', display: 'flex', flexDirection: 'column' }}>
                  <Skeleton variant="rectangular" height={280} />
                  <CardContent>
                    <Skeleton variant="text" height={30} />
                    <Skeleton variant="text" height={20} />
                    <Skeleton variant="text" height={20} />
                  </CardContent>
                  <CardActions>
                    <Skeleton variant="rectangular" height={40} width="100%" />
                  </CardActions>
                </Card>
              </Box>
            ))
          ) : (
            products.filter(p => p.category !== 'boxes').map((product, index) => (
            <Box key={product.id}>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -10 }}
              >
                <Card
                  className="product-card-mobile"
                  onClick={() => { 
                    if (product.category === 'boxes') {
                      setSelectedBox(product);
                      setShowBoxPopup(true);
                      return;
                    }
                    console.log('Producto clickeado:', product);
                    setSelected(product); 
                    setOpen(true);
                    console.log('Abriendo dialog, open:', true);
                  }}
                  sx={{
                    width: '100%',
                    maxWidth: '100%',
                    height: '360px',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 16px 48px rgba(0,0,0,0.15)',
                      transform: 'translateY(-5px)'
                    }
                  }}
                >
                  {/* Imagen del producto */}
                  <Box className="product-image-container" sx={{ position: 'relative', overflow: 'hidden' }}>
                    <ProductImage
                      src={product.image}
                      alt={product.name}
                      height={180}
                      width={160}
                      sx={{
                        transition: 'transform 0.3s ease',
                        transform: 'translateY(0px)',
                        '&:hover': {
                          transform: 'translateY(0px) scale(1.05)'
                        }
                      }}
                    />
                    
                    {/* Badges */}
                    <Box sx={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {product.isNew && (
                        <Chip
                          label={translatedTexts.nuevo}
                          size="small"
                          sx={{
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.75rem'
                          }}
                        />
                      )}
                      {product.isBestSeller && (
                        <Chip
                          label={translatedTexts.masVendido}
                          size="small"
                          sx={{
                            backgroundColor: '#FF6B35',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.75rem'
                          }}
                        />
                      )}
                    </Box>



                    {/* Botón de favoritos */}
                    <IconButton
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        '&:hover': {
                          backgroundColor: 'rgba(255,255,255,1)'
                        }
                      }}
                    >
                      <FavoriteBorder />
                    </IconButton>
                  </Box>

                  <CardContent sx={{ flexGrow: 0, p: 1.5 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        mb: 0.5,
                        color: '#333',
                        fontSize: '1rem',
                        fontFamily: '"Asap", sans-serif',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      {(() => {
                        const name = product.name || '';
                        const translation = PRODUCT_TRANSLATIONS[language]?.[name.trim()] || 
                                           PRODUCT_TRANSLATIONS[language]?.[name.trim().toUpperCase()] ||
                                           PRODUCT_TRANSLATIONS[language]?.[name];
                        return translation?.name || product[`name_${language}`] || product.name_en || product.name;
                      })()}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        fontSize: '0.75rem',
                        mb: 1,
                        lineHeight: 1.3,
                        mt: 1,
                        textAlign: 'center',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {(() => {
                        const name = product.name || '';
                        const translation = PRODUCT_TRANSLATIONS[language]?.[name.trim()] || 
                                           PRODUCT_TRANSLATIONS[language]?.[name.trim().toUpperCase()] ||
                                           PRODUCT_TRANSLATIONS[language]?.[name];
                        return translation?.description || 
                               product[`description_${language}`] || 
                               product.description_en || 
                               product.description ||
                               (name.toLowerCase().includes('ferrero') 
                                  ? translatedTexts.ferreroDescription
                                  : translatedTexts.defaultDescription.replace('{name}', product[`name_${language}`] || product.name));
                      })()}
                    </Typography>

                    {/* Precio y Rating */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5, mt: 1, transform: 'translateY(-10px)' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            color: '#c8626d',
                            fontSize: '1.3rem'
                          }}
                        >
                          {product.category === 'boxes' ? (
                            `${product.discountPercentage}% ${translatedTexts.offMessage}`
                          ) : (
                            `$${product.price}`
                          )}
                        </Typography>
                        {product.originalPrice && (
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#999',
                              textDecoration: 'line-through',
                              fontSize: '1rem'
                            }}
                          >
                            ${product.originalPrice}
                          </Typography>
                        )}
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Rating
                          value={product.rating}
                          precision={0.1}
                          readOnly
                          size="small"
                          sx={{ color: '#FFD700' }}
                        />
                      </Box>
                    </Box>

                    {/* Inventario */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, transform: 'translateY(-10px)' }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#666',
                          fontSize: '0.8rem',
                          fontWeight: 500
                        }}
                      >
                        {translatedTexts.stock} {product.inventory || 0} {translatedTexts.units}
                      </Typography>
                      <Chip
                        label={
                          (product.inventory || 0) === 0 ? translatedTexts.agotado :
                          (product.inventory || 0) < 10 ? translatedTexts.stockBajo :
                          (product.inventory || 0) < 50 ? translatedTexts.stockMedio : translatedTexts.enStock
                        }
                        size="small"
                        sx={{
                          backgroundColor: 
                            (product.inventory || 0) === 0 ? '#7C281520' :
                            (product.inventory || 0) < 10 ? '#EB8B8B20' :
                            (product.inventory || 0) < 50 ? '#8D9A7D20' : '#C8626D20',
                          color: 
                            (product.inventory || 0) === 0 ? '#7C2815' :
                            (product.inventory || 0) < 10 ? '#EB8B8B' :
                            (product.inventory || 0) < 50 ? '#8D9A7D' : '#C8626D',
                          fontWeight: 600,
                          fontSize: '0.7rem'
                        }}
                      />
                    </Box>
                  </CardContent>

                  <CardActions sx={{ p: 0.5, pt: 0, mt: -2, transform: 'translateY(-10px)' }}>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<ShoppingBag />}
                      sx={{
                        backgroundColor: '#c8626d',
                        color: 'white',
                        py: 0.5,
                        borderRadius: '15px',
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        '&:hover': {
                          backgroundColor: '#b25763',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(139, 69, 19, 0.3)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (product.category === 'boxes') {
                          setSelectedBox(product);
                          setShowBoxPopup(true);
                        } else {
                          addToCart(product);
                        }
                      }}
                    >
                      {translatedTexts.addToCart}
                    </Button>
                  </CardActions>
                </Card>
              </motion.div>
            </Box>
            ))
          )}
        </Grid>

        {/* Acordeón Informativo - Todas las versiones */}
        {accordionData && (
          <Box sx={{ mt: 6, mb: 4, px: 2 }}>
            <Accordion elevation={0} sx={{ 
              backgroundColor: 'transparent',
              '&:before': { display: 'none' },
              borderBottom: '1px solid #eee',
              borderRadius: '0 !important',
              '&.Mui-expanded': { margin: 0 }
            }}>
              <AccordionSummary 
                expandIcon={<ExpandMore sx={{ color: '#7C2815' }} />}
                sx={{ px: 0 }}
              >
                <Typography sx={{ fontWeight: 600, color: '#7C2815', fontSize: '1.1rem' }}>
                  {language === 'es' ? (accordionData?.aboutTitle || translatedTexts.aboutTitle) : (accordionData?.[`aboutTitle_${language}`] || accordionData?.aboutTitle || translatedTexts.aboutTitle)}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0, pb: 2 }}>
                <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.8 }}>
                  {language === 'es' ? (accordionData?.aboutContent || translatedTexts.aboutContent) : (accordionData?.[`aboutContent_${language}`] || accordionData?.aboutContent || translatedTexts.aboutContent)}
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion elevation={0} sx={{ 
              backgroundColor: 'transparent',
              '&:before': { display: 'none' },
              borderBottom: '1px solid #eee',
              borderRadius: '0 !important',
              '&.Mui-expanded': { margin: 0 }
            }}>
              <AccordionSummary 
                expandIcon={<ExpandMore sx={{ color: '#7C2815' }} />}
                sx={{ px: 0 }}
              >
                <Typography sx={{ fontWeight: 600, color: '#7C2815', fontSize: '1.1rem' }}>
                  {language === 'es' ? (accordionData?.differentTitle || translatedTexts.differentTitle) : (accordionData?.[`differentTitle_${language}`] || accordionData?.differentTitle || translatedTexts.differentTitle)}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0, pb: 2 }}>
                <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.8 }}>
                  {language === 'es' ? (accordionData?.differentContent || translatedTexts.differentContent) : (accordionData?.[`differentContent_${language}`] || accordionData?.differentContent || translatedTexts.differentContent)}
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion elevation={0} sx={{ 
              backgroundColor: 'transparent',
              '&:before': { display: 'none' },
              borderBottom: '1px solid #eee',
              borderRadius: '0 !important',
              '&.Mui-expanded': { margin: 0 }
            }}>
              <AccordionSummary 
                expandIcon={<ExpandMore sx={{ color: '#7C2815' }} />}
                sx={{ px: 0 }}
              >
                <Typography sx={{ fontWeight: 600, color: '#7C2815', fontSize: '1.1rem' }}>
                  {language === 'es' ? (accordionData?.ingredientsTitle || translatedTexts.ingredientsTitle) : (accordionData?.[`ingredientsTitle_${language}`] || accordionData?.ingredientsTitle || translatedTexts.ingredientsTitle)}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0, pb: 2 }}>
                <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.8 }}>
                  {language === 'es' ? (accordionData?.ingredientsContent || translatedTexts.ingredientsContent) : (accordionData?.[`ingredientsContent_${language}`] || accordionData?.ingredientsContent || translatedTexts.ingredientsContent)}
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Box>
        )}

        {/* Popup de producto */}
        <Dialog
          open={open}
          onClose={() => {
            console.log('Cerrando dialog');
            setOpen(false);
          }}
          maxWidth="md"
          fullWidth
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false);
          }}
          PaperProps={{
            sx: {
              borderRadius: '20px',
              minHeight: '600px',
              maxHeight: '90vh',
              backgroundColor: '#fafafa',
              border: '1px solid #e0e0e0',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
            }
          }}
        >
          <DialogContent sx={{ p: 0, position: 'relative' }}>
            <IconButton
              aria-label={translatedTexts.cerrar}
              onClick={() => setOpen(false)}
              sx={{ 
                position: 'absolute', 
                top: 8, 
                right: 8, 
                zIndex: 1, 
                backgroundColor: 'rgba(200, 98, 109, 0.1)',
                color: '#c8626d',
                '&:hover': {
                  backgroundColor: 'rgba(200, 98, 109, 0.2)'
                }
              }}
            >
              <Close />
            </IconButton>
            {selected && (
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: '500px' }}>
                {/* Lado Izquierdo - Imagen */}
                <Box sx={{ flex: 1, height: '500px', overflow: 'hidden', position: 'relative' }}>
                  {selected.images && selected.images.length > 1 ? (
                    <ProductImageCarousel images={selected.images} />
                  ) : (
                    <img
                      src={selected.image}
                      alt={selected.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  )}
                </Box>
                
                {/* Lado Derecho - Información */}
                <Box sx={{ flex: 1, p: { xs: 2, md: 3 }, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h5" sx={{ 
                      fontWeight: 700, 
                      mb: 1, 
                      color: '#333',
                      fontFamily: '"Asap", sans-serif',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {(() => {
                        const name = selected.name || '';
                        const translation = PRODUCT_TRANSLATIONS[language]?.[name.trim()] || 
                                           PRODUCT_TRANSLATIONS[language]?.[name.trim().toUpperCase()] ||
                                           PRODUCT_TRANSLATIONS[language]?.[name];
                        return translation?.name || selected[`name_${language}`] || selected.name_en || selected.name;
                      })()}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Rating value={selected.rating} precision={0.1} readOnly size="small" sx={{ color: '#FFD700' }} />
                      <Typography variant="body2" sx={{ ml: 1, color: '#666' }}>({selected.reviews} {translatedTexts.reseñas})</Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#c8626d', mb: 2 }}>
                      {selected.category === 'boxes' ? (
                        `${selected.discountPercentage}% ${translatedTexts.offMessage}`
                      ) : (
                        `$${selected.price}`
                      )}
                    </Typography>
                    
                    {/* Afterpay Messaging */}
                    {selected.price >= 1 && selected.price <= 4000 && (
                      <AfterpayMessaging amount={selected.price} />
                    )}
                    
                    {/* Información de inventario en el popup */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#666',
                          fontSize: '0.9rem',
                          fontWeight: 500
                        }}
                      >
                        {translatedTexts.stockDisponible} {selected.inventory || 0} {translatedTexts.unidades}
                      </Typography>
                      <Chip
                        label={
                          (selected.inventory || 0) === 0 ? translatedTexts.agotado :
                          (selected.inventory || 0) < 10 ? translatedTexts.stockBajo :
                          (selected.inventory || 0) < 50 ? translatedTexts.stockMedio : translatedTexts.enStock
                        }
                        size="small"
                        sx={{
                          backgroundColor: 
                            (selected.inventory || 0) === 0 ? '#7C281520' :
                            (selected.inventory || 0) < 10 ? '#EB8B8B20' :
                            (selected.inventory || 0) < 50 ? '#8D9A7D20' : '#C8626D20',
                          color: 
                            (selected.inventory || 0) === 0 ? '#7C2815' :
                            (selected.inventory || 0) < 10 ? '#EB8B8B' :
                            (selected.inventory || 0) < 50 ? '#8D9A7D' : '#C8626D',
                          fontWeight: 600,
                          fontSize: '0.8rem'
                        }}
                      />
                    </Box>
                    
                    <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.6, mb: 3 }}>
                      {(() => {
                        const name = selected.name || '';
                        const translation = PRODUCT_TRANSLATIONS[language]?.[name.trim()] || 
                                           PRODUCT_TRANSLATIONS[language]?.[name.trim().toUpperCase()] ||
                                           PRODUCT_TRANSLATIONS[language]?.[name];
                        return translation?.description || 
                               selected[`description_${language}`] || 
                               selected.description_en ||
                               selected.description || 
                                (name.toLowerCase().includes('ferrero') 
                                  ? translatedTexts.ferreroDescription
                                  : translatedTexts.defaultDescription.replace('{name}', selected[`name_${language}`] || selected.name)
                                );
                      })()}
                    </Typography>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<ShoppingBag />}
                      sx={{
                        backgroundColor: '#c8626d',
                        textTransform: 'none',
                        fontWeight: 700,
                        py: 1.5,
                        '&:hover': { backgroundColor: '#b25763' }
                      }}
                      onClick={() => {
                        addToCart(selected);
                        setOpen(false);
                      }}
                    >
                      {translatedTexts.addToCart}
                    </Button>
                </Box>
              </Box>
            )}
          </DialogContent>
        </Dialog>

        <BoxSelectionPopup 
          open={showBoxPopup}
          onClose={() => setShowBoxPopup(false)}
          selectedBox={selectedBox}
        />
      </Container>

      {/* Video Reviews and Comparison Table */}
      {/* <VideoReviewsCarousel /> */}
      <ComparisonTable />
    </Box>
  );
};

export default Products;
