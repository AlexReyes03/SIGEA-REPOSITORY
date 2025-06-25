import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';

import NotFoundPNG from '../assets/img/not_found.png';

const NotFound = () => {
  const navigate = useNavigate();

  const goHome = () => {
    navigate('/');
  };

  return (
    <div className="container text-center my-5">
      <img src={NotFoundPNG} alt="" height={500} />
      <p className="fs-4 mt-4 text-muted">Lo sentimos, la página que buscas no existe.</p>
      <Button className="bg-blue-800" onClick={goHome}>
        Ir a Inicio
      </Button>
    </div>
  );
};

export default NotFound;
