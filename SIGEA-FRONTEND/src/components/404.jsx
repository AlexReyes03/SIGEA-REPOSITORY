import React from 'react';
import { useNavigate } from 'react-router-dom';

import NotFoundPNG from '../assets/img/not_found.png';

const NotFound = () => {
  const navigate = useNavigate();

  const goHome = () => {
    navigate('/');
  };

  return (
    <div className="container text-center my-5">
      <img src={NotFoundPNG} alt="" height={300} />
      <p className="lead">Lo sentimos, la página que buscas no existe.</p>
      <button className="btn btn-primary" onClick={goHome}>
        Ir a Inicio
      </button>
    </div>
  );
};

export default NotFound;
