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
    </>
  );
}