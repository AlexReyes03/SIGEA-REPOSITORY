import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdOutlineEmojiEvents, MdOutlinePerson, MdOutlineCoPresent, MdOutlineGroup, MdOutlineRadioButtonChecked, MdArrowDropUp } from 'react-icons/md';
import { Rating } from "primereact/rating";

export default function Dashboard() {

  return (
    <>
      <div className='bg-white rounded-top p-2'>
        <h3 className='text-blue-500 fw-semibold mx-3 my-1'>Inicio</h3>
      </div>

      <div className="row mt-3">
        <div className="col-6">
          <div className="row">
            <div className="col-6">
              <div className="card border-0">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className='title-icon p-1 rounded-circle'>
                      <MdOutlineRadioButtonChecked size={40} className="p-1" />
                    </div>
                    <h6 className="text-secondary ms-2 mb-0">Usuarios activos</h6>
                  </div>

                  <div className="d-flex flex-column align-items-center">
                    <p className="fs-1 fw-bold text-blue-500 mb-0">2</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-6">
              <div className="card border-0">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className='title-icon p-1 rounded-circle'>
                      <MdOutlineGroup size={40} className="p-1" />
                    </div>
                    <h6 className="text-secondary ms-2 mb-0">Nuevos inicios</h6>
                  </div>

                  <div className="d-flex flex-column align-items-center">
                    <p className="fs-1 fw-bold text-blue-500 mb-0">125</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="row mt-3">
            <div className="col-6">
              <div className="card border-0">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className='title-icon p-1 rounded-circle'>
                      <MdOutlineCoPresent size={40} className="p-1" />
                    </div>
                    <h6 className="text-secondary ms-2 mb-0">Total de docentes</h6>
                  </div>

                  <div className="d-flex flex-column align-items-center">
                    <p className="fs-1 fw-bold text-blue-500 mb-0">62</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-6">
              <div className="card border-0">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className='title-icon p-1 rounded-circle'>
                      <MdOutlinePerson size={40} className="p-1" />
                    </div>
                    <h6 className="text-secondary ms-2 mb-0">Total de estudiantes</h6>
                  </div>

                  <div className="d-flex flex-column align-items-center">
                    <p className="fs-1 fw-bold text-blue-500 mb-0">1442</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-6">
          <div className="card border-0">
            <div className="card-body">
              <div className="d-flex align-items-center mb-3">
                <div className='title-icon p-1 rounded-circle'>
                  <MdOutlineEmojiEvents size={40} className="p-1" />
                </div>
                <h6 className="text-secondary ms-2 mb-0">Desempeño docente</h6>
              </div>

              <div className="d-flex flex-column align-items-center my-5">
                <Rating value={5} readOnly cancel={false} />
                <div className='d-flex flex-row align-items-center'>
                  <p className="fs-1 fw-bold text-blue-500 mt-2 mb-0">4.6</p>
                  <div className='icon-average-up ms-3 rounded-circle'>
                    <MdArrowDropUp size={40} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
