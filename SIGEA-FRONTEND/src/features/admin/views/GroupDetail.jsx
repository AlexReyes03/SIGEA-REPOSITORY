import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Button } from 'primereact/button';

export default function GroupDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { group, career } = location.state || {};

  if (!group) {
    navigate('/admin/careers/groups');
    return null;
  }

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

      <h3 className="mt-3 mb-2">{group.name}</h3>
      <p>
        Docente: <strong>{group.teacherName}</strong>
      </p>
      <p>
        Día: <strong>{group.weekDay}</strong> | Hora:{' '}
        <strong>
          {group.startTime} - {group.endTime}
        </strong>
      </p>
      {/* Aquí tu diseño: estudiantes, estructura plan, etc. */}

      <Button label="Regresar" icon="pi pi-arrow-left" className="mt-3" onClick={() => navigate(-1)} />
    </>
  );
}
