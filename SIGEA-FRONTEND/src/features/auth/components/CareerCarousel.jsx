import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProgressSpinner } from 'primereact/progressspinner';
import { BACKEND_BASE_URL } from '../../../api/common-url';

export default function CareerCarousel({ careers = [] }) {
  const loading = !Array.isArray(careers);
  const containerRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    function updateHeight() {
      if (containerRef.current) {
        const height = containerRef.current.offsetHeight;
        setContainerHeight(height);
      }
    }
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  useEffect(() => {
    if (containerHeight > 100 && careers.length > 0) {
      setIsReady(true);
    } else {
      setIsReady(false);
    }
  }, [containerHeight, careers.length]);

  useEffect(() => {
    if (!isReady || careers.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % careers.length;
        return nextIndex;
      });
    }, 4500);

    return () => {
      clearInterval(interval);
    };
  }, [isReady, careers.length]);

  function getImageUrl(url) {
    if (!url) return null;
    if (/^https?:\/\//.test(url)) return url;
    return `${BACKEND_BASE_URL}${url}`;
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center h-100">
        <div className="text-center text-white">
          <ProgressSpinner style={{ width: '40px', height: '40px' }} strokeWidth="4" fill="transparent" animationDuration="1s" />
          <p className="mt-3 small opacity-75">Cargando carreras...</p>
        </div>
      </div>
    );
  }

  if (!careers.length) {
    return (
      <div className="d-flex justify-content-center align-items-center h-100">
        <div className="text-center text-white">
          <p className="opacity-75">No hay carreras para mostrar</p>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div ref={containerRef} className="h-100 d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        <div className="text-center text-white">
          <p className="opacity-75">Preparando carrusel...</p>
        </div>
      </div>
    );
  }

  const currentCareer = careers[currentIndex];

  return (
    <motion.div ref={containerRef} className="career-carousel-wrapper h-100 d-flex flex-column justify-content-center align-items-center p-2" initial={false} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} style={{ height: '100%', overflow: 'hidden' }}>
      <div className="career-carousel-container h-100 w-100 d-flex align-items-center justify-content-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={`career-${currentIndex}`}
            className="career-slide h-100 w-100 d-flex align-items-center justify-content-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{
              duration: 0.5,
              ease: 'easeInOut',
            }}
            style={{
              padding: '0 10px',
            }}
          >
            <div
              className="career-card bg-white rounded-4 shadow-sm overflow-hidden"
              style={{
                width: '100%',
                maxWidth: 'min(90vw, 500px)',
                height: '85%',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
              }}
            >
              <div className="career-image-container position-relative h-100">
                <img
                  src={getImageUrl(currentCareer.imageUrl)}
                  alt={currentCareer.name}
                  className="w-100 h-100 rounded-3"
                  style={{
                    objectFit: 'cover',
                    height: '100%',
                  }}
                />
                <div
                  className="career-overlay position-absolute bottom-0 start-0 end-0 p-4 rounded-bottom-3"
                  style={{
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
                  }}
                >
                  <h5 className="text-white fw-bold mb-2" style={{ fontSize: '1.15rem' }}>
                    {currentCareer.name}
                  </h5>
                  <small className="text-light opacity-75" style={{ fontSize: '0.95rem' }}>
                    {currentCareer.campusName}
                  </small>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <style jsx>{`
        .career-carousel-wrapper {
          position: relative;
          height: 100%;
          overflow: hidden;
        }
        .career-carousel-container {
          height: calc(100% - 30px);
          overflow: hidden;
        }
        .career-slide {
          height: 100%;
        }
        .career-card {
          cursor: default;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.13);
        }
        .career-image-container {
          overflow: hidden;
          height: 100%;
        }
        .career-image-container img {
          transition: none;
        }
        .carousel-indicator:hover {
          backgroundcolor: rgba(255, 255, 255, 0.8) !important;
          transform: scale(1.2);
        }

        @media (max-width: 1200px) {
          .career-card {
            max-width: min(85vw, 450px) !important;
          }
        }
        @media (max-width: 992px) {
          .career-card {
            max-width: min(80vw, 400px) !important;
          }
        }
        @media (max-width: 768px) {
          .career-card {
            max-width: min(75vw, 350px) !important;
          }
        }
        @media (max-width: 576px) {
          .career-card {
            max-width: min(90vw, 300px) !important;
          }
          .career-carousel-wrapper {
            padding: 0.25rem;
          }
        }
      `}</style>
    </motion.div>
  );
}
