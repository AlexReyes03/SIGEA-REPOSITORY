import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  const goHome = () => {
    navigate('/');
  };

  return (
    <div className="container text-center my-5">
      <h1 className="display-4">404</h1>
      <p className="lead">Lo sentimos, la página que buscas no existe.</p>
      <button className="btn btn-primary" onClick={goHome}>
        Ir a Inicio
      </button>
    </div>
  );
};

export default NotFound;
