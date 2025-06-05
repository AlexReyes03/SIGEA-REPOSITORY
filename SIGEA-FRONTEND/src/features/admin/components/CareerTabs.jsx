import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function CareerTabs() {
  const navigate = useNavigate();
  const location = useLocation();
  const career = location.state?.career;
  const path = location.pathname;

  const tabs = useMemo(
    () => [
      { key: 'groups', label: 'Grupos', path: '/admin/careers/groups' },
      { key: 'curriculum', label: 'Plan de estudios', path: '/admin/careers/curriculums' },
    ],
    []
  );

  const activeKey = path.includes('/curriculums') ? 'curriculum' : 'groups';


  const containerRef = useRef(null);
  const tabRefs = useRef({});
  const [slider, setSlider] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const btn = tabRefs.current[activeKey];
    const cont = containerRef.current;
    if (!btn || !cont) return;

    const { left: cLeft } = cont.getBoundingClientRect();
    const { left, width } = btn.getBoundingClientRect();
    setSlider({ left: left - cLeft, width });
  }, [activeKey]);

  const go = (t) => navigate(t.path, { state: { career } });

  const baseBtn = 'bg-transparent border-0 px-3 py-2 fw-medium text-muted position-relative';
  const activeColor = '#276ba5';

  return (
    <div ref={containerRef} className="d-inline-flex position-relative">
      {tabs.map((t) => (
        <button key={t.key} ref={(el) => (tabRefs.current[t.key] = el)} className={baseBtn} style={{ color: activeKey === t.key ? activeColor : '#276ba5' }} role="tab" aria-selected={activeKey === t.key} onClick={() => go(t)}>
          {t.label}
        </button>
      ))}

      {/* slider */}
      <motion.div
        layout
        animate={{ left: slider.left, width: slider.width }}
        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        style={{
          position: 'absolute',
          bottom: 0,
          height: 3,
          borderRadius: 9999,
          background: 'linear-gradient(90deg, #0ea5e9 0%, #0ea5e9 100%)',
          color: '#0ea5e9 !important'
        }}
      />
    </div>
  );
}
