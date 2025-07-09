import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdOutlineGroup, MdOutlineBook, MdOutlineCalendarMonth, MdOutlinePendingActions } from 'react-icons/md';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';

import { getGroupByTeacher } from '../../../api/academics/groupService';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../components/providers/ToastProvider';

export default function Groups() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const data = await getGroupByTeacher(user.id);
      setGroups(data);
    } catch (err) {
      showError('Error', 'Error al cargar los grupos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  return (
    <>
      <div className="bg-white rounded-top p-2">
        <h3 className="text-blue-500 fw-semibold mx-3 my-1">Mis grupos</h3>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
          <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="8" fill="#ededed" animationDuration=".5s" />
        </div>
      ) : (
        <div className="row mt-3">
          {groups.length === 0 ? (
            <div className="col-12 text-center mt-2">
              <Message severity="info" text="Aún no tienes grupos asignados." />
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.groupId} className="col-12 col-sm-6 col-lg-4 col-xl-3 mb-3" style={{ maxWidth: '25rem' }}>
                <div className="card border-0 h-100 hovereable up" onClick={() => navigate('/teacher/groups/details', { state: { group, user } })}>
                  <div className="card-body">
                    <div className="d-flex align-items-center bg-light rounded p-2">
                      <div className="title-icon p-1 rounded-circle ">
                        <MdOutlineGroup size={40} className="p-1" />
                      </div>
                      <h6 className="text-secondary ms-2 mb-0">Grupo {group.name}</h6>
                    </div>
                    <div className="d-flex flex-column p-2">
                      <span className="fw-semibold">{group.careerName}</span>
                      <span className="text-muted fw-medium mb-2 text-uppercase">
                        <MdOutlineBook size={24} className="me-2" />
                        {group.curriculumName}
                      </span>
                      <span className="text-muted fw-medium mb-2 text-uppercase">
                        <MdOutlineCalendarMonth size={24} className="me-2" />
                        {group.weekDay} {group.startTime} - {group.endTime}
                      </span>
                      <span className="text-muted fw-medium mb-2 text-uppercase">
                        <MdOutlinePendingActions size={24} className="me-2" />
                        Cierre en una semana
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
}
