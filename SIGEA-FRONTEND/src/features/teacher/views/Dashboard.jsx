import React, { useState, useEffect } from 'react';
import { MdOutlineEmojiEvents, MdOutlineInventory, MdOutlineGroup, MdArrowDropUp, MdArrowDropDown, MdOutlinePendingActions, MdOutlineCalendarMonth } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { Rating } from 'primereact/rating';
import { ProgressSpinner } from 'primereact/progressspinner';

import { getGroupByTeacher } from '../../../api/academics/groupService';
import { useAuth } from '../../../contexts/AuthContext';
import { Message } from 'primereact/message';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ratingValue, setRatingValue] = useState(4.6);
  const [isUp, setIsUp] = useState(true);
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const adjustRating = () => {
      setRatingValue((prev) => {
        if (!mounted) return prev;

        // Genera un delta aleatorio entre -0.3 y 0.3
        const deltas = [-0.3, -0.2, -0.1, 0.1, 0.2, 0.3];
        const delta = deltas[Math.floor(Math.random() * deltas.length)];
        let next = Math.round((prev + delta) * 10) / 10;
        if (next > 5) next = 5.0;
        if (next < 0) next = 0.0;

        setIsUp(next >= prev);

        return next;
      });
    };

    const interval = setInterval(adjustRating, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchGroupsCount = async () => {
      try {
        const groups = await getGroupByTeacher(user.id);
        if (isMounted) {
          setMyGroups(groups);
        }
      } catch (error) {
        console.error('Error fetching groups:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchGroupsCount();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <div className="bg-white rounded-top p-2">
        <h3 className="text-blue-500 fw-semibold mx-3 my-1">Inicio</h3>
      </div>

      <div className="row mt-3">
        {/* COLUMNA IZQUIERDA (2×2) */}
        <div className="col-12 col-lg-6">
          <div className="row">
            {/* Grupos a cargo */}
            <div className="col-12 col-md-6 mb-3">
              <div className="card border-0">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="title-icon p-1 rounded-circle">
                      <MdOutlineGroup size={40} className="p-1" />
                    </div>
                    <h6 className="text-secondary ms-2 mb-0">Grupos a cargo</h6>
                  </div>
                  {loading ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 220 }}>
                      <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="8" fill="var(--surface-ground)" animationDuration=".5s" />
                    </div>
                  ) : (
                    <div className="d-grid gap-2 px-2 overflow-auto" style={{ maxHeight: '40rem', cursor: 'pointer' }} onClick={() => navigate('/teacher/groups')}>
                      {myGroups.length === 0 ? (
                        <div className="text-center mt-3">
                          <Message severity="info" text="Aún tienes grupos asignados." />
                        </div>
                      ) : (
                        myGroups.map((group) => (
                          <div key={group.groupId} className="d-flex flex-column p-2 border rounded my-2 hovereable">
                            <span className="fw-medium">{group.careerName}</span>
                            <span className="text-muted fw-medium">
                              <MdOutlineGroup size={24} className="me-2" />
                              Grupo {group.name}
                            </span>
                            <span className="text-muted fw-medium">
                              <MdOutlineCalendarMonth size={24} className="me-2" />
                              {group.weekDay} {group.startTime} - {group.endTime}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pendientes de calificar */}
            <div className="col-12 col-md-6 mb-3">
              <div className="card border-0">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="title-icon p-1 rounded-circle">
                      <MdOutlinePendingActions size={40} className="p-1" />
                    </div>
                    <h6 className="text-secondary ms-2 mb-0">Pendientes de calificar</h6>
                  </div>
                  {loading ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 220 }}>
                      <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="8" fill="var(--surface-ground)" animationDuration=".5s" />
                    </div>
                  ) : (
                    <div className="d-grid gap-2 px-2 overflow-auto" style={{ maxHeight: '40rem', cursor: 'pointer' }} onClick={() => navigate('/teacher/groups')}>
                      {myGroups.length === 0 ? (
                        <div className="text-center mt-3">
                          <Message severity="info" text="Aún tienes grupos asignados." />
                        </div>
                      ) : (
                        myGroups.map((group) => (
                          <div key={group.groupId} className="d-flex flex-column p-2 border rounded mt-2">
                            <span className="fw-medium">{group.careerName}</span>
                            <span className="text-muted fw-medium">
                              <MdOutlineGroup size={24} className="me-2" />
                              Grupo {group.name}
                            </span>
                            <span className="text-muted fw-medium">
                              <MdOutlineCalendarMonth size={24} className="me-2" />
                              {group.weekDay} {group.startTime} - {group.endTime}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Espacio en blanco */}
            <div className="d-none d-md-block col-md-6"></div>

            {/* Última calificación registrada */}
            <div className="col-12 col-md-12 col-lg-6 mb-3">
              <div className="card border-0">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="title-icon p-1 rounded-circle">
                      <MdOutlineInventory size={40} className="p-1" />
                    </div>
                    <h6 className="text-secondary ms-2 mb-0">Ultima calificación registrada</h6>
                  </div>
                  {loading ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 220 }}>
                      <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="8" fill="var(--surface-ground)" animationDuration=".5s" />
                    </div>
                  ) : (
                    <div className="d-grid gap-2 px-2 overflow-auto" style={{ maxHeight: '40rem', cursor: 'pointer' }} onClick={() => navigate('/teacher/groups')}>
                      {myGroups.length === 0 ? (
                        <div className="text-center mt-3">
                          <Message severity="info" text="Aún tienes grupos asignados." />
                        </div>
                      ) : (
                        myGroups.map((group) => (
                          <div key={group.groupId} className="d-flex flex-column p-2 border rounded mt-2">
                            <span className="fw-medium">{group.careerName}</span>
                            <span className="text-muted fw-medium">
                              <MdOutlineGroup size={24} className="me-2" />
                              Grupo {group.name}
                            </span>
                            <span className="text-muted fw-medium">
                              <MdOutlineCalendarMonth size={24} className="me-2" />
                              {group.weekDay} {group.startTime} - {group.endTime}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA IZQUIERDA (1x1) */}
        {/* Mi desempeño */}
        <div className="col-12 col-lg-6 mt-lg-0">
          <div className="card border-0 h-100">
            <div className="card-body d-flex flex-column h-100">
              <div className="d-flex align-items-center">
                <div className="title-icon p-1 rounded-circle">
                  <MdOutlineEmojiEvents size={40} className="p-1" />
                </div>
                <h6 className="text-secondary ms-2 mb-0">Mi desempeño</h6>
              </div>
              <div className="d-flex flex-column align-items-center justify-content-center flex-grow-1">
                <div>
                  <Rating value={Math.round(ratingValue)} className="dashboard-rating" readOnly cancel={false} />
                </div>

                <div className="d-flex flex-row align-items-center mt-3">
                  <p className="fw-bold text-blue-500 me-3 mb-0" style={{ fontSize: '4rem' }}>
                    {ratingValue.toFixed(1)}
                  </p>
                  <div className={`${isUp ? 'icon-average-up' : 'icon-average-down'} rounded-circle`}>{isUp ? <MdArrowDropUp size={40} /> : <MdArrowDropDown size={40} />}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
