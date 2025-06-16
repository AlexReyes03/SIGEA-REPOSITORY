import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MdOutlinePerson, MdOutlineGroup, MdOutlineAssignment } from 'react-icons/md';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Rating } from 'primereact/rating';
import { Button } from 'primereact/button';

import avatarFallback from '../../../assets/img/profile.png';
import { getUserById } from '../../../api/userService';
import GroupModulesTable from '../components/GroupModulesTable';
import { BACKEND_BASE_URL } from '../../../api/common-url';

const weekDayOptions = [
  { label: 'Lunes', value: 'LUN' },
  { label: 'Martes', value: 'MAR' },
  { label: 'Miércoles', value: 'MIE' },
  { label: 'Jueves', value: 'JUE' },
  { label: 'Viernes', value: 'VIE' },
  { label: 'Sábado', value: 'SAB' },
  { label: 'Domingo', value: 'DOM' },
];
const weekLabel = (code) => weekDayOptions.find((o) => o.value === code)?.label || code;

export default function GroupDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { group, career } = location.state || {};
  const [teacher, setTeacher] = useState(null);

  if (!group) {
    navigate('/admin/careers/groups');
    return null;
  }

  function getAvatarUrl(url) {
    if (!url) return avatarFallback;
    if (/^https?:\/\//.test(url)) return url;
    return `${BACKEND_BASE_URL}${url}`;
  }

  useEffect(() => {
    if (group.teacherId) {
      (async () => {
        try {
          const user = await getUserById(group.teacherId);
          setTeacher(user);
        } catch (err) {
          console.error('Error al cargar docente:', err);
        }
      })();
    }
  }, [group.teacherId]);

  const infoLeft = [
    { label: 'Plan de estudios', value: group.curriculumName || 'No asignado' },
    { label: 'Fecha de inicio', value: 'MAYO - 2025' },
    { label: 'Estado', value: 'Activo' },
  ];

  const infoRight = [
    { label: 'Horario', value: `${weekLabel(group.weekDay)} ${group.startTime} - ${group.endTime}` },
    { label: 'Fecha de fin', value: 'MAYO - 2026' },
    { label: 'Alumnos', value: '20' },
  ];

  return (
    <>
      <div className="bg-white rounded-top p-2">
        <h3 className="text-blue-500 fw-semibold mx-3 my-1">Detalles del grupo</h3>
      </div>

      <BreadCrumb
        model={[
          { label: 'Carreras', command: () => navigate('/admin/careers') },
          { label: career?.name || '--', command: () => navigate('/admin/careers') },
          { label: 'Grupos', command: () => navigate('/admin/careers/groups', { state: { career } }) },
          { label: `Grupo ${group.name}` || '--' },
        ]}
        home={{ icon: 'pi pi-home', command: () => navigate('/') }}
        className="mt-2 pb-0 ps-0 text-nowrap"
      />

      <div className="row my-2">
        <div className="col-12 col-lg-4 mb-2 mb-lg-0">
          <div className="card border-0" style={{ minHeight: '20rem' }}>
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="title-icon p-1 rounded-circle">
                  <MdOutlinePerson size={40} className="p-1" />
                </div>
                <h6 className="text-blue-500 fs-5 fw-semibold ms-2 mb-0">Docente</h6>
              </div>
              <div className="d-flex align-items-center justify-content-center fw-medium">
                <div className="d-flex flex-column align-items-center text-center">
                  <img alt="Avatar docente" src={getAvatarUrl(teacher?.avatarUrl)} className="rounded-circle shadow-sm mb-3" width={140} height={140} />
                  <span className="text-muted text-uppercase">{teacher ? `${teacher.name} ${teacher.paternalSurname} ${teacher.maternalSurname}` : 'No asignado'}</span>
                  <span className="text-muted mb-2">{teacher?.email || 'No asignado'}</span>
                  <Rating value={5} readOnly cancel={false} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-8">
          <div className="card border-0" style={{ minHeight: '20rem' }}>
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="title-icon p-1 rounded-circle">
                  <MdOutlineGroup size={40} className="p-1" />
                </div>
                <h6 className="text-blue-500 fs-5 fw-semibold ms-2 mb-0">Información del grupo</h6>
              </div>
              <div className="d-flex align-items-center fw-medium">
                <div className="row text-muted text-start text-uppercase ms-5 gx-4 gy-3">
                  <div className="col-6">
                    <span>{career.name}</span>
                  </div>
                  <div className="col-6">
                    <span>Grupo {group.name}</span>
                  </div>

                  {infoLeft.map(({ label, value }) => (
                    <div className="col-6 d-flex flex-column" key={label}>
                      <span>{label}</span>
                      <span>{value}</span>
                    </div>
                  ))}

                  {infoRight.map(({ label, value }) => (
                    <div className="col-6 d-flex flex-column" key={label}>
                      <span>{label}</span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-12">
        <GroupModulesTable group={group} />
      </div>
    </>
  );
}
