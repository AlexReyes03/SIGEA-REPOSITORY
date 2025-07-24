import React, { useState, useEffect } from 'react';
import { MdOutlineEmojiEvents, MdOutlinePerson, MdOutlineCoPresent, MdOutlineGroup, MdOutlineRadioButtonChecked, MdArrowDropUp, MdArrowDropDown } from 'react-icons/md';
import { Rating } from 'primereact/rating';

import { getActiveUsers, getAllUsers } from '../../../api/userService';

export default function Dashboard() {
  const [ratingValue, setRatingValue] = useState(4.6);
  const [isUp, setIsUp] = useState(true);
  const [usersActive, setUsersActive] = useState(0);

  const [studentsCount, setStudentsCount] = useState(0);
  const [adminCount, setAdminCount] = useState(0);
  const [teachersCount, setTeachersCount] = useState(0);

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
    let mounted = true;

    const fetchCount = async () => {
      try {
        const active = await getActiveUsers();
        if (mounted) setUsersActive(active);
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

  useEffect(() => {
    let mounted = true;

    const fetchUsersCount = async () => {
      try {
        const users = await getAllUsers();
        if (mounted) {
          setStudentsCount(users.filter((user) => user.roleName === 'STUDENT').length);
          setTeachersCount(users.filter((user) => user.roleName === 'TEACHER').length);
          setAdminCount(users.filter((user) => user.roleName === 'ADMIN').length);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchUsersCount();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <div className="bg-white rounded-top p-2">
        <h3 className="text-blue-500 fw-semibold mx-3 my-1">Inicio</h3>
      </div>

      <div className="row mt-3">
        <div className="col-12 col-lg-6">
          <div className="row">
            <div className="col-12 col-md-6 mb-3 mb-lg-0">
              <div className="card border-0">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="title-icon p-1 rounded-circle">
                      <MdOutlineRadioButtonChecked size={40} className="p-1" />
                    </div>
                    <h6 className="text-secondary ms-2 mb-0">Usuarios activos</h6>
                  </div>
                  <div className="d-flex flex-column align-items-center">
                    <p className="fs-1 fw-bold text-blue-500 mb-0">{usersActive}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6 mb-3 mb-lg-0">
              <div className="card border-0">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="title-icon p-1 rounded-circle">
                      <MdOutlinePerson size={40} className="p-1" />
                    </div>
                    <h6 className="text-secondary ms-2 mb-0">Administrativos</h6>
                  </div>
                  <div className="d-flex flex-column align-items-center">
                    <p className="fs-1 fw-bold text-blue-500 mb-0">{adminCount}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row mt-0 mt-lg-3">
            <div className="col-12 col-md-6 mb-3 mb-lg-0">
              <div className="card border-0">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="title-icon p-1 rounded-circle">
                      <MdOutlineCoPresent size={40} className="p-1" />
                    </div>
                    <h6 className="text-secondary ms-2 mb-0">Total de docentes</h6>
                  </div>
                  <div className="d-flex flex-column align-items-center">
                    <p className="fs-1 fw-bold text-blue-500 mb-0">{teachersCount}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6 mb-3 mb-lg-0">
              <div className="card border-0">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="title-icon p-1 rounded-circle">
                      <MdOutlineGroup size={40} className="p-1" />
                    </div>
                    <h6 className="text-secondary ms-2 mb-0">Total de estudiantes</h6>
                  </div>
                  <div className="d-flex flex-column align-items-center">
                    <p className="fs-1 fw-bold text-blue-500 mb-0">{studentsCount}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6 mb-3 mb-lg-0">
          <div className="card h-100 border-0">
            <div className="card-body d-flex flex-column">
              <div className="d-flex align-items-center mb-3">
                <div className="title-icon p-1 rounded-circle">
                  <MdOutlineEmojiEvents size={40} className="p-1 text-blue-500" />
                </div>
                <h6 className="text-secondary ms-2 mb-0">Desempeño docente</h6>
              </div>
              <div className="d-flex flex-column align-items-center flex-grow-1 justify-content-center">
                <div>
                  <Rating value={Math.round(ratingValue)} readOnly cancel={false} />
                </div>

                <div className="d-flex flex-row align-items-center mt-3">
                  <p className="fs-1 fw-bold text-blue-500 me-3 mb-0">{ratingValue.toFixed(1)}</p>
                  <div className={`${isUp ? 'icon-average-up' : 'icon-average-down'} rounded-circle`}>
                    {isUp ? <MdArrowDropUp size={40} /> : <MdArrowDropDown size={40} />}
                  </div>
                </div>
                <small className="text-muted mt-2 text-center">Evaluación promedio de todos los docentes.</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
