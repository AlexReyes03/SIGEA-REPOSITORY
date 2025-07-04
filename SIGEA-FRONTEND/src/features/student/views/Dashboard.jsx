import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { HiMiniStar, HiCalendar, HiChevronRight  } from "react-icons/hi2";

import { BiSolidBookBookmark } from "react-icons/bi";
import { useAuth } from '../../../contexts/AuthContext';
import { getCareerByPlantelId, } from '../../../api/academics/careerService';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  //Estados
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCareers = async () => {
    try {
      setLoading(true);
      const list = await getCareerByPlantelId(user.campus.id);
      setCareers(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Error loading careers:", error);
      showError('Error', 'Error al cargar las carreras.')
      setCareers([]);
    } finally {
      setLoading(false);
    }
  }


  return (
    <>
      <div className="bg-white rounded-top p-2">
        <h3 className="text-blue-500 fw-semibold mx-3 my-1">Inicio</h3>
      </div>

      <div className='row mt-3'>
        <div className="col-12 col-md-4 col-lg-4 col-xl-3 mb-3">
          <div className="card border-0 h-100 shadow-sm">
            <div className='card-body'>
              <div className="d-flex justify-content-between align-items-start">
                <div className="flex-grow-1 text-truncate">
                  <h5 className="fw-semibold lh-sm mb-2 text-dark text-truncate">Carrera Técnica en Computación</h5>
                  <div className="d-flex justify-content-start ms-1">
                    <div className="d-flex align-items-center">
                      <HiCalendar className="me-1 text-muted" />
                      <span className="text-muted">Periodo 2024-2027</span>
                    </div>
                  </div>

                  <div className="p-2 rounded bg-light h-100 text-truncate gap-2 mt-5">
                    <BiSolidBookBookmark className="text-secondary mb-1 align-items-center" size={24} />
                    <small className="text-muted"> Calificaciones </small>
                    <HiChevronRight className='text-muted' />
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
