import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { HiMiniStar, HiCalendar, HiChevronRight  } from "react-icons/hi2";

import { BiSolidBookBookmark } from "react-icons/bi";
import { useAuth } from '../../../contexts/AuthContext';
import { getEnrollmentsByUser } from '../../../api/academics/enrollmentService';
import { getCurriculumByCareerId } from '../../../api/academics/curriculumService';

export default function Dashboard() {
  
  return (
    <>
      <div className="bg-white rounded-top p-2">
        <h3 className="text-blue-500 fw-semibold mx-3 my-1">Inicio</h3>
      </div>

      <div className="row mt-3">
        <div className="col-4">
          Grupos actios Contador
        </div>
        <div className="col-4">
          Carreras completadas Contador
        </div>
        <div className="col-4">
          Pendientes por evaluar Contador
        </div>
      </div>

      <div className="row mt-3">
        <div className="col-6">
          Card con datos de mis grupos (nombre del grupo, nombre completo del docente, carrera)
        </div>
        <div className="col-6">
          Card con horario de mis grupos, similar al del Dashboard de Docente (Nombre del grupo, weekDay, startTime y endTime, ciclo simplificado mm/yy - mm/yy)
        </div>
      </div>
    </>
  );
}
