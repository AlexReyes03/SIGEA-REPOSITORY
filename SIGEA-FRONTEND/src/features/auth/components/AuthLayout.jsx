import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../../../assets/img/logo_cetec.png';
import CareerCarousel from '../components/CareerCarousel';
import { getAllCareers } from '../../../api/academics/careerService';

export default function AuthLayout({ title, subtitle, children }) {
  const [showCarousel, setShowCarousel] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [careersWithImages, setCareersWithImages] = useState([]);

  useEffect(() => {
    const checkCareersWithImages = async () => {
      try {
        setIsLoading(true);
        const allCareers = await getAllCareers();
        const filtered = Array.isArray(allCareers) ? allCareers.filter((career) => career.imageUrl) : [];
        setCareersWithImages(filtered);
        setShowCarousel(filtered.length > 0);
      } catch (err) {
        console.error('Error checking careers for carousel:', err);
        setShowCarousel(false);
        setCareersWithImages([]);
      } finally {
        setIsLoading(false);
      }
    };

    checkCareersWithImages();
  }, []);

  // Variantes de animación para Framer Motion
  const carouselVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 },
    },
    exit: { opacity: 0, y: 30, scale: 0.95, transition: { duration: 0.5, ease: 'easeInOut' } },
  };

  const backgroundVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  return (
    <main className="container-fluid">
      <div className="row vh-100">
        {/* Panel izquierdo */}
        <div className="col-12 col-md-6 d-flex flex-column bg-main justify-content-between p-4">
          <div className="d-flex justify-content-between align-items-center mb-4 user-select-none">
            <img src={Logo} alt="CETEC Logo" height={50} />
            <h3 className="fw-bold fs-3 text-blue-800 mb-0">SIGEA</h3>
          </div>

          <div className="flex-grow-1 d-flex flex-column justify-content-center">
            <h1 className="text-center text-blue-500 fw-semibold mb-0 mx-5">{title}</h1>
            <p className="text-center text-muted mb-5 mx-5">{subtitle}</p>
            <div className="row justify-content-center mt-2">
              <div className="col-12 col-lg-8">{children}</div>
            </div>
          </div>

          <footer className="text-center text-muted small">Copyright © {new Date().getFullYear()} Corporativo CETEC.</footer>
        </div>

        {/* Panel derecho: color sólido + inner shadow + carrusel condicional */}
        <motion.div className="col-md-6 d-none d-md-block auth-panel-right bg-blue-500 dots-bg position-relative" variants={backgroundVariants} initial="hidden" animate="visible" style={{ overflow: 'hidden', height: '100%' }}>
          <AnimatePresence mode="wait">
            {!isLoading && showCarousel && (
              <motion.div
                key="carousel"
                className="position-absolute top-50 start-50 translate-middle"
                style={{
                  width: '95%',
                  height: '80%',
                  zIndex: 2,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
                variants={carouselVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <CareerCarousel careers={careersWithImages} />
              </motion.div>
            )}

            {!isLoading && !showCarousel && (
              <motion.div key="placeholder" className="position-absolute top-50 start-50 translate-middle text-center text-white" style={{ zIndex: 2 }} variants={carouselVariants} initial="hidden" animate="visible" exit="exit">
                <motion.div
                  className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-4"
                  style={{
                    width: '120px',
                    height: '120px',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                  }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <i className="pi pi-image" style={{ fontSize: '3rem', opacity: 0.7 }}></i>
                </motion.div>
                <motion.h5 className="opacity-75 mb-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 0.75, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}>
                  Carreras CETEC
                </motion.h5>
                <motion.p className="small opacity-50 mb-0" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 0.5, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }}>
                  Aún no hay imágenes disponibles para mostrar.
                </motion.p>
              </motion.div>
            )}

            {isLoading && (
              <motion.div key="loading" className="position-absolute top-50 start-50 translate-middle text-center text-white" style={{ zIndex: 2 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <div className="spinner-border text-light mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                  <span className="visually-hidden">Cargando...</span>
                </div>
                <p className="small opacity-75">Cargando imágenes...</p>
                <p className="small opacity-75">Esto puede tardar unos segundos.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </main>
  );
}
