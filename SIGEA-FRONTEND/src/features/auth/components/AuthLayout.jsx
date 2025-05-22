import React from 'react';
import Logo from '../../../assets/img/logo_cetec.png';

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <main className="container-fluid">
      <div className="row vh-100">
        {/* Panel izquierdo */}
        <div className="col-12 col-md-6 d-flex flex-column justify-content-between p-4">

          <div className="d-flex justify-content-between align-items-center mb-4 user-select-none">
            <img src={Logo} alt="CETEC Logo" height={50} />
            <span className="fw-bold fs-3 text-blue-800">SIGEA</span>
          </div>

          <div className="flex-grow-1 d-flex flex-column justify-content-center">
            <h1 className="text-center text-blue-500 fw-semibold mb-0">{title}</h1>
            <p className="text-center text-muted mb-5">{subtitle}</p>
            <div className="row justify-content-center mt-2">
              <div className="col-12 col-lg-8">{children}</div>
            </div>
          </div>

          <footer className="text-center text-muted small">Copyright © {new Date().getFullYear()} Corporativo CETEC.</footer>
        </div>

        {/* Panel derecho: color sólido + inner shadow */}
        <div className="col-md-6 d-none d-sm-block auth-panel-right bg-blue-500"></div>
      </div>
    </main>
  );
}
