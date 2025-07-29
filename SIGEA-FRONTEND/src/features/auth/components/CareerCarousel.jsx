import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Carousel } from 'primereact/carousel';
import { ProgressSpinner } from 'primereact/progressspinner';
import { BACKEND_BASE_URL } from '../../../api/common-url';

export default function CareerCarousel({ careers = [] }) {
  const loading = !Array.isArray(careers);
  const containerRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    function updateHeight() {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.offsetHeight);
      }
    }
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  useEffect(() => {
    if (containerHeight > 100 && careers.length > 1) {
      const timer = setTimeout(() => {
        setShouldRender(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [containerHeight, careers.length]);

  function getImageUrl(url) {
    if (!url) return null;
    if (/^https?:\/\//.test(url)) return url;
    return `${BACKEND_BASE_URL}${url}`;
  }

  const careerTemplate = (career) => (
    <motion.div
      className="career-slide h-100"
      initial={false}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="career-card bg-white rounded-4 shadow-sm overflow-hidden"
        style={{
          width: '100%',
          maxWidth: 430,
          height: '85%',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
        }}
      >
        <div className="career-image-container position-relative h-100" style={{ height: '100%' }}>
          <img
            src={getImageUrl(career.imageUrl)}
            alt={career.name}
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
              {career.name}
            </h5>
            <small className="text-light opacity-75" style={{ fontSize: '0.95rem' }}>
              {career.campusName}
            </small>
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (loading || !careers.length) {
    return (
      <div className="d-flex justify-content-center align-items-center h-100">
        <div className="text-center text-white">
          <ProgressSpinner style={{ width: '40px', height: '40px' }} strokeWidth="4" fill="transparent" animationDuration="1s" />
          <p className="mt-3 small opacity-75">Cargando carreras...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div ref={containerRef} className="career-carousel-wrapper h-100 d-flex flex-column p-2" initial={false} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} style={{ height: '100%', overflow: 'hidden', justifyContent: 'center' }}>
      <div className="career-carousel-container flex-grow-1 d-flex align-items-center justify-content-center" style={{ height: '100%' }}>
        {containerHeight > 100 && shouldRender && (
          <Carousel
            value={careers}
            itemTemplate={careerTemplate}
            numVisible={1}
            numScroll={1}
            orientation="vertical"
            verticalViewPortHeight="100%"
            autoplayInterval={4500}
            circular={careers.length > 1}
            showNavigators={false}
            showIndicators={false}
            className="career-carousel h-100"
          />
        )}
      </div>
      <style jsx>{`
        .career-carousel-wrapper {
          position: relative;
          height: 100%;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .career-carousel-container {
          height: 100%;
          flex-grow: 1;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .career-carousel {
          height: 100%;
          overflow: hidden;
        }
        .career-carousel .p-carousel-container {
          height: 100%;
          overflow: hidden;
        }
        .career-carousel .p-carousel-content {
          padding: 0;
          height: 100%;
          overflow: hidden;
        }
        .career-carousel .p-carousel-viewport {
          height: 100% !important;
          overflow: hidden !important;
        }
        .career-carousel .p-carousel-item {
          height: 100%;
          min-height: 0;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .career-slide {
          height: 100%;
          padding: 0;
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
        @media (max-width: 768px) {
          .career-card {
            max-width: 380px !important;
          }
        }
        @media (max-width: 576px) {
          .career-card {
            max-width: 300px !important;
          }
          .career-carousel-wrapper {
            padding: 0.25rem;
          }
        }
      `}</style>
    </motion.div>
  );
}
