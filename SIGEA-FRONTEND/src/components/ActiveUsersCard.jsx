import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { getActiveUsers } from '../api/userService';

export default function ActiveUsersCard() {
  const [count, setCount] = useState(0);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchCount = async () => {
      try {
        const active = await getActiveUsers();
        if (mounted) setCount(active);
      } catch (e) {
        console.error(e);
      }
    };
    fetchCount();
    const iv = setInterval(fetchCount, 60_000);
    return () => {
      mounted = false;
      clearInterval(iv);
    };
  }, []);

  return (
    <motion.div
      className="d-flex align-items-center bg-white text-dark rounded-4 shadow px-3 d-none d-md-flex"
      style={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        overflow: 'hidden',
        zIndex: 1100,
        height: '50px',
      }}
      initial={{ width: '4.8rem' }}
      animate={{ width: hover ? '14rem' : '4.6rem' }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Texto */}
      <AnimatePresence>
        {hover && (
          <motion.span key="label" className="fw-semibold text-truncate text-nowrap me-auto" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.3 }}>
            Usuarios activos
          </motion.span>
        )}
      </AnimatePresence>

      {/* Contador */}
      <span className="fw-semibold mx-2">{count}</span>

      {/* Dot */}
      <div
        style={{
          width: '1.2rem',
          height: '1.2rem',
          borderRadius: '50%',
          background: '#3EC80C',
          border: '4px solid #A8FF88',
          flexShrink: 0,
        }}
      />
    </motion.div>
  );
}
