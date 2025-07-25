import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Carousel } from 'primereact/carousel';
import { ProgressSpinner } from 'primereact/progressspinner';
import { getAllCareers } from '../api/academics/careerService';
import { BACKEND_BASE_URL } from '../api/common-url';

export default function CareerCarousel() {
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCareersWithImages = async () => {
      try {
        setLoading(true);
        const allCareers = await getAllCareers();
        
        // Filtrar solo carreras que tienen imagen
        const careersWithImages = Array.isArray(allCareers) 
          ? allCareers.filter(career => career.imageUrl) 
          : [];
        
        setCareers(careersWithImages);
      } catch (err) {
        console.error('Error loading careers for carousel:', err);
        setCareers([]);
      } finally {
        setLoading(false);
      }
    };

    loadCareersWithImages();
  }, []);

  function getImageUrl(url) {
    if (!url) return null;
    if (/^https?:\/\//.test(url)) return url;
    return `${BACKEND_BASE_URL}${url}`;
  }

  const careerTemplate = (career, index) => {
    return (
      <motion.div 
        className="career-slide p-3"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ 
          duration: 0.5, 
          delay: index * 0.1,
          ease: "easeOut"
        }}
      >
        <motion.div 
          className="career-card bg-white rounded-4 shadow-sm overflow-hidden h-100"
          whileHover={{ 
            scale: 1.02, 
            y: -5,
            transition: { duration: 0.2 }
          }}
        >
          <div className="career-image-container position-relative">
            <img
              src={getImageUrl(career.imageUrl)}
              alt={career.name}
              className="w-100"
              style={{
                height: '200px',
                objectFit: 'cover',
              }}
            />
            <div className="career-overlay position-absolute bottom-0 start-0 end-0 p-3"
              style={{
                background: 'linear-gradient(transparent, rgba(0,0,0,0.8))'
              }}>
              <motion.h6 
                className="text-white fw-bold mb-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {career.name}
              </motion.h6>
              <motion.small 
                className="text-light"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {career.campusName}
              </motion.small>
            </div>
          </div>
          
          <div className="career-info p-3">
            <div className="d-flex justify-content-between align-items-center">
              <motion.span 
                className="badge bg-primary"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                {career.differentiator}
              </motion.span>
              <small className="text-muted">
                {career.studentsCount} estudiante{career.studentsCount !== 1 ? 's' : ''}
              </small>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center h-100">
        <div className="text-center text-white">
          <ProgressSpinner 
            style={{ width: '40px', height: '40px' }} 
            strokeWidth="4"
            fill="transparent"
            animationDuration="1s"
          />
          <p className="mt-3 small opacity-75">Cargando carreras...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="career-carousel-container h-100 d-flex align-items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-100" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <Carousel
          value={careers}
          itemTemplate={careerTemplate}
          numVisible={1}
          numScroll={1}
          orientation="vertical"
          verticalViewPortHeight="400px"
          autoplayInterval={5000}
          circular
          showNavigators={careers.length > 1}
          showIndicators={careers.length > 1}
          className="career-carousel"
        />
      </div>
      
      <style jsx>{`
        .career-carousel .p-carousel-content {
          padding: 0;
        }
        
        .career-carousel .p-carousel-indicators {
          padding: 1rem 0;
        }
        
        .career-carousel .p-carousel-indicator button {
          background-color: rgba(255, 255, 255, 0.3);
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: none;
          margin: 0 4px;
          transition: all 0.3s ease;
        }
        
        .career-carousel .p-carousel-indicator.p-highlight button {
          background-color: rgba(255, 255, 255, 0.9);
          transform: scale(1.3);
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
        }
        
        .career-carousel .p-carousel-prev,
        .career-carousel .p-carousel-next {
          background-color: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }
        
        .career-carousel .p-carousel-prev:hover,
        .career-carousel .p-carousel-next:hover {
          background-color: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.4);
          transform: scale(1.1);
        }
        
        .career-slide {
          padding: 0 1rem;
        }
        
        .career-card {
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          will-change: transform;
        }
        
        @media (max-height: 600px) {
          .career-carousel {
            verticalViewPortHeight: 300px !important;
          }
          
          .career-image-container img {
            height: 150px !important;
          }
        }
        
        @media (max-width: 768px) {
          .career-slide {
            padding: 0 0.5rem;
          }
        }
      `}</style>
    </motion.div>
  );
}