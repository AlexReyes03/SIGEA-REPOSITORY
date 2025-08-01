import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MdOutlinePerson, MdOutlineGroup } from 'react-icons/md';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Rating } from 'primereact/rating';
import { Button } from 'primereact/button';

import { useToast } from '../../../components/providers/ToastProvider';
import avatarFallback from '../../../assets/img/profile.png';
import { getUserById } from '../../../api/userService';
import { getCareerById } from '../../../api/academics/careerService';
import { getGroupStudents } from '../../../api/academics/groupService';
import { BACKEND_BASE_URL } from '../../../api/common-url';
import GroupModulesTable from '../../teacher/components/GroupModulesTable';

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

// Función helper para formatear fechas a "MES - AÑO"
const formatDateToMonthYear = (dateString) => {
  if (!dateString) return 'No definida';

  const date = new Date(dateString);
  const monthNames = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];

  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  return `${month} - ${year}`;
};

// Función helper para calcular el estado del grupo
const getGroupStatus = (startDate, endDate) => {
  if (!startDate || !endDate) return 'Sin fecha';

  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (now < start) {
    return 'Programado';
  } else if (now >= start && now <= end) {
    return 'Activo';
  } else {
    return 'Finalizado';
  }
};

export default function GroupDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const { group, user } = location.state || {};

  const [career, setCareer] = useState(null);
  const [teacher, setTeacher] = useState(null);
  const [studentCount, setStudentCount] = useState(0);

  function getAvatarUrl(url) {
    if (!url) return avatarFallback;
    if (/^https?:\/\//.test(url)) return url;
    return `${BACKEND_BASE_URL}${url}`;
  }

  useEffect(() => {
    if (!group) {
      navigate('/teacher/groups');
      return;
    }

    let isMounted = true;
    setLoading(true);

    (async () => {
      try {
        const careerPromise = group.careerId ? getCareerById(group.careerId) : Promise.resolve(null);
        const teacherPromise = group.teacherId ? getUserById(group.teacherId) : Promise.resolve(null);
        const studentsPromise = group.groupId ? getGroupStudents(group.groupId) : Promise.resolve(null);

        const [careerData, teacherData, studentsData] = await Promise.all([careerPromise, teacherPromise, studentsPromise]);

        if (!isMounted) return;

        setCareer(careerData);
        setTeacher(teacherData);
        setStudentCount(studentsData ? studentsData.length : 0);
      } catch (err) {
        showError('Error', 'Error al cargar los detalles del grupo');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [group, navigate]);

  const infoLeft = [
    { label: 'Plan de estudios', value: group?.curriculumName || 'No asignado' },
    { label: 'Horario', value: `${weekLabel(group?.weekDay)} ${group?.startTime} - ${group?.endTime}` },
    { label: 'Estado', value: getGroupStatus(group?.startDate, group?.endDate) },
  ];

  const infoRight = [
    { label: 'Total de alumnos', value: studentCount === 0 ? 'Sin alumnos' : studentCount },
    { label: 'Fecha de inicio', value: formatDateToMonthYear(group?.startDate) },
    { label: 'Fecha de fin', value: formatDateToMonthYear(group?.endDate) },
  ];

  return (
    <>
      <div className="bg-white rounded-top p-2">
        <h3 className="text-blue-500 fw-semibold mx-3 my-1">Detalles del grupo</h3>
      </div>

      <BreadCrumb model={[{ label: 'Grupos', command: () => navigate('/teacher/groups') }, { label: `Grupo ${group.name}` || '--' }]} home={{ icon: 'pi pi-home', command: () => navigate('/') }} className="mt-2 pb-0 ps-0 text-nowrap" />

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
                  <img alt="Avatar docente" src={getAvatarUrl(teacher?.avatarUrl)} className="rounded-circle shadow-sm mb-3" width={140} height={140} style={{ objectFit: 'cover' }} />
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
                    <span>{career?.name}</span>
                  </div>
                  <div className="col-6">
                    <span>Grupo {group?.name} </span>
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

      <div className="mb-5">
        <GroupModulesTable group={group} />
      </div>
    </>
  );
}
