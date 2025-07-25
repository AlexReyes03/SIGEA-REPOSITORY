import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from 'primereact/button';
import { BreadCrumb } from 'primereact/breadcrumb';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Rating } from 'primereact/rating';
import { Badge } from 'primereact/badge';
import { Paginator } from 'primereact/paginator';
import { Dropdown } from 'primereact/dropdown';
import { MdManageSearch, MdOutlineAssessment } from 'react-icons/md';

import { useToast } from '../../../components/providers/ToastProvider';
import { getUserById } from '../../../api/userService';
import { getRankingsByTeacher } from '../../../api/academics/rankingService';
import avatarFallback from '../../../assets/img/profile.png';
import { BACKEND_BASE_URL } from '../../../api/common-url';

export default function TeacherScore() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showError, showSuccess } = useToast();

  const { teacherId, teacherName, campusId, campusName, isPrimary } = location.state || {};

  const [loading, setLoading] = useState(true);
  const [teacher, setTeacher] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [expandedComments, setExpandedComments] = useState({});

  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(5);

  const [sortOption, setSortOption] = useState('recent');

  const [privacyMode, setPrivacyMode] = useState(true);

  const rowsPerPageOptions = [5, 10, 15];

  const sortOptions = [
    { label: 'Más recientes', value: 'recent' },
    { label: 'Mayor puntaje', value: 'highest' },
    { label: 'Menor puntaje', value: 'lowest' },
  ];

  const mapRankingData = useCallback((rankingDto) => {
    return {
      id: rankingDto.id,
      teacherId: rankingDto.teacherId,
      studentId: rankingDto.student.id,
      date: rankingDto.date,
      comment: rankingDto.comment,
      star: rankingDto.star,
      studentName: rankingDto.student.fullName,
      studentAvatar: rankingDto.student.avatarUrl,
      studentEmail: rankingDto.student.email,
      studentCampusName: rankingDto.student.campusName,
      studentCampusId: rankingDto.student.campusId,
    };
  }, []);

  const sortedRankings = useMemo(() => {
    if (!rankings.length) return [];

    const sorted = [...rankings].sort((a, b) => {
      switch (sortOption) {
        case 'recent':
          return new Date(b.date) - new Date(a.date);
        case 'highest':
          return b.star - a.star;
        case 'lowest':
          return a.star - b.star;
        default:
          return 0;
      }
    });

    return sorted;
  }, [rankings, sortOption]);

  const paginatedRankings = useMemo(() => {
    const startIndex = first;
    const endIndex = first + rows;
    return sortedRankings.slice(startIndex, endIndex);
  }, [sortedRankings, first, rows]);

  const getAnonymizedName = useCallback(
    (originalName) => {
      if (!privacyMode) return originalName;
      return 'Estudiante Anónimo';
    },
    [privacyMode]
  );

  const getDisplayAvatar = useCallback(
    (avatarUrl) => {
      if (privacyMode) return avatarFallback;
      return getAvatarUrl(avatarUrl);
    },
    [privacyMode]
  );

  const loadTeacherData = useCallback(async () => {
    if (!teacherId) {
      showError('Error', 'No se pudo identificar al docente');
      navigate('/supervisor/campuses-teachers');
      return;
    }

    try {
      setLoading(true);

      const [teacherData, rankingsResponse] = await Promise.all([getUserById(teacherId), getRankingsByTeacher(teacherId)]);

      setTeacher(teacherData);

      let rankingsData = [];
      if (rankingsResponse && rankingsResponse.data && Array.isArray(rankingsResponse.data)) {
        rankingsData = rankingsResponse.data.map(mapRankingData);
      } else if (Array.isArray(rankingsResponse)) {
        rankingsData = rankingsResponse.map(mapRankingData);
      }

      setRankings(rankingsData);
      setFirst(0);

      if (rankingsData.length === 0) {
        console.info('No rankings found for teacher:', teacherId);
      }
    } catch (err) {
      console.error('Error loading teacher data:', err);

      if (err.status === 404 && err.message.includes('ranking')) {
        try {
          const teacherData = await getUserById(teacherId);
          setTeacher(teacherData);
          setRankings([]);
        } catch (teacherErr) {
          console.error('Error loading teacher:', teacherErr);
          showError('Error', 'Error al cargar los datos del docente');
          setTeacher(null);
        }
      } else {
        showError('Error', 'Error al cargar los datos del docente');
        setTeacher(null);
      }
    } finally {
      setLoading(false);
    }
  }, [teacherId, showError, navigate, mapRankingData]);

  useEffect(() => {
    if (teacherId) {
      loadTeacherData();
    } else {
      navigate('/supervisor/campuses-teachers');
    }
  }, [loadTeacherData, teacherId, navigate]);

  const toggleComment = useCallback((rankingId) => {
    setExpandedComments((prev) => ({
      ...prev,
      [rankingId]: !prev[rankingId],
    }));
  }, []);

  const getAvatarUrl = (avatarUrl) => {
    if (!avatarUrl) return avatarFallback;
    if (/^https?:\/\//.test(avatarUrl)) return avatarUrl;
    return `${BACKEND_BASE_URL}${avatarUrl}`;
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const dateFormatted = date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      const timeFormatted = date.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      return `${dateFormatted} - ${timeFormatted}`;
    } catch (error) {
      console.warn('Error formatting date:', dateString);
      return 'Fecha no disponible';
    }
  };

  const onPageChange = (event) => {
    setFirst(event.first);
    setRows(event.rows);
  };

  const togglePrivacyMode = () => {
    setPrivacyMode(!privacyMode);
  };

  const averageRating = rankings.length > 0 ? rankings.reduce((sum, ranking) => sum + ranking.star, 0) / rankings.length : 0;
  const totalEvaluations = rankings.length;

  const truncateComment = (comment, maxLength = 100) => {
    if (!comment || comment.length <= maxLength) return comment;
    return comment.substring(0, maxLength) + '...';
  };

  // Breadcrumb
  const breadcrumbItems = [
    {
      label: 'Planteles',
      command: () => navigate('/supervisor/campuses-teachers'),
    },
    {
      label: 'Docentes',
      command: () => {
        if (campusId && campusName) {
          navigate('/supervisor/campuses-teachers/teachers', {
            state: { campusId, campusName, isPrimary },
          });
        } else {
          navigate('/supervisor/campuses-teachers');
        }
      },
    },
    {
      label: 'Desempeño',
    },
  ];

  const breadcrumbHome = {
    icon: 'pi pi-home',
    command: () => navigate('/supervisor'),
  };

  return (
    <>
      <div className="d-flex flex-row justify-content-between align-items-center bg-white rounded-top p-2">
        <h3 className="text-blue-500 fw-semibold mx-3 my-1">
          Desempeño <span className="d-none d-md-inline">docente</span>
        </h3>

        {/* Controles de filtro y privacidad */}
        <div className="d-flex align-items-center gap-2">
          <Button
            icon={privacyMode ? 'pi pi-eye' : 'pi pi-eye-slash'}
            severity={privacyMode ? 'help' : 'secondary'}
            outlined={privacyMode ? false : true}
            size="small"
            onClick={togglePrivacyMode}
            tooltip={privacyMode ? 'Mostrar datos reales' : 'Ocultar datos sensibles'}
            tooltipOptions={{ position: 'left' }}
          />
          <Dropdown value={sortOption} options={sortOptions} onChange={(e) => setSortOption(e.value)} placeholder="Ordenar por" className="me-2" style={{ minWidth: '150px' }} />
        </div>
      </div>

      <BreadCrumb model={breadcrumbItems} home={breadcrumbHome} className="mt-2 pb-0 ps-0 text-nowrap" />

      {loading ? (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
          <div className="text-center">
            <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="8" />
            <p className="mt-3 text-600">Cargando datos del docente...</p>
          </div>
        </div>
      ) : !teacher ? (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
          <div className="text-center">
            <MdOutlineAssessment className="text-secondary" size={70} />
            <h5 className="mt-3 text-muted">No se pudieron cargar los datos</h5>
            <p className="text-muted">Intenta recargar la página</p>
            <div className="d-flex gap-2 justify-content-center">
              <Button label="Reintentar" icon="pi pi-refresh" severity="primary" onClick={loadTeacherData} />
              <Button
                label="Volver a docentes"
                icon="pi pi-arrow-left"
                severity="secondary"
                outlined
                onClick={() => {
                  if (campusId && campusName) {
                    navigate('/supervisor/campuses-teachers/teachers', {
                      state: { campusId, campusName, isPrimary },
                    });
                  } else {
                    navigate('/supervisor/campuses-teachers');
                  }
                }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="row mt-3">
          {/* Columna izquierda - Información del docente */}
          <div className="col-12 col-lg-4 mb-3">
            {/* Card 1: Información del docente */}
            <div className="card border-0 p-3 mb-3" style={{ minHeight: '200px' }}>
              <div className="text-center">
                <div className="mb-3">
                  <img src={getAvatarUrl(teacher.avatarUrl) ?? avatarFallback} alt="avatar" className="shadow-sm rounded-circle" style={{ width: '120px', height: '120px', objectFit: 'cover' }} />
                </div>
                <h5 className="text-dark mb-2">{`${teacher.name || ''} ${teacher.paternalSurname || ''} ${teacher.maternalSurname || ''}`.trim()}</h5>
                <p className="text-muted mb-2">{teacher.email}</p>
                <Badge value="Docente" severity="info" className="mb-0" />
                {campusName && <small className="text-muted d-block mt-1">{campusName}</small>}
              </div>
            </div>

            {/* Card 2: Puntuación general */}
            <div className="card border-0 p-3" style={{ minHeight: '200px' }}>
              <div className="text-center">
                <div className="d-flex align-items-center justify-content-center mb-3">
                  <h6 className="text-blue-500 fw-semibold mb-0">Puntuación General</h6>
                </div>

                <div className="mb-3">
                  <div className="fs-1 fw-bold text-blue-500 mb-2">{averageRating.toFixed(1)}</div>
                  <div className="d-flex justify-content-center">
                    <Rating value={Math.round(averageRating)} readOnly cancel={false} className="mb-2" />
                  </div>
                  <p className="text-muted mb-0">{totalEvaluations === 0 ? 'Sin evaluaciones' : `Promedio de ${totalEvaluations} evaluación${totalEvaluations !== 1 ? 'es' : ''}`}</p>
                </div>

                {/* Distribución de estrellas */}
                {totalEvaluations > 0 && (
                  <div className="text-center">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = rankings.filter((r) => r.star === star).length;
                      const percentage = totalEvaluations > 0 ? (count / totalEvaluations) * 100 : 0;
                      return (
                        <div key={star} className="d-flex align-items-center mb-1">
                          <span className="me-2 text-muted" style={{ minWidth: '20px' }}>
                            {star}
                          </span>
                          <div className="flex-grow-1 bg-light rounded me-2" style={{ height: '8px' }}>
                            <div
                              className="bg-warning rounded"
                              style={{
                                height: '8px',
                                width: `${percentage}%`,
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                          <span className="text-muted" style={{ minWidth: '30px', fontSize: '0.875rem' }}>
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Columna derecha - Evaluaciones */}
          <div className="col-12 col-lg-8 mb-3">
            {rankings.length === 0 ? (
              <div className="border-0 card text-center py-5">
                <div className="d-flex justify-content-center mb-3">
                  <MdManageSearch size={70} className="text-secondary" />
                </div>
                <h5 className="mt-3 text-muted">Sin evaluaciones</h5>
                <p className="text-muted">Este docente aún no tiene evaluaciones de estudiantes</p>
              </div>
            ) : (
              <>
                {/* Lista de evaluaciones */}
                <div className="d-flex flex-column gap-3 mb-3">
                  {paginatedRankings.map((ranking) => (
                    <div key={ranking.id} className="card p-4 border-0">
                      <div className="d-flex align-items-start gap-3">
                        <img
                          src={getDisplayAvatar(ranking.studentAvatar)}
                          alt="avatar"
                          className="rounded-circle"
                          style={{
                            width: '60px',
                            height: '60px',
                            flexShrink: 0,
                            objectFit: 'cover',
                          }}
                        />
                        <div className="flex-grow-1 overflow-x-auto">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <h6 className="text-dark mb-1 text-truncate">{getAnonymizedName(ranking.studentName)}</h6>
                              <small className="text-muted">{formatDate(ranking.date)}</small>
                            </div>
                            <Rating value={ranking.star} readOnly cancel={false} className="ms-2" />
                          </div>

                          <div className="text-muted">
                            {expandedComments[ranking.id] || !ranking.comment || ranking.comment.length <= 100 ? <p className="mb-0">{ranking.comment || 'Sin comentarios'}</p> : <p className="mb-0">{truncateComment(ranking.comment)}</p>}

                            {ranking.comment && ranking.comment.length > 100 && <Button label={expandedComments[ranking.id] ? 'Ver menos' : 'Ver más'} link className="p-0 mt-1" style={{ fontSize: '0.875rem' }} onClick={() => toggleComment(ranking.id)} />}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Paginador */}
                {sortedRankings.length > rows && (
                  <Paginator
                    first={first}
                    rows={rows}
                    totalRecords={sortedRankings.length}
                    rowsPerPageOptions={rowsPerPageOptions}
                    onPageChange={onPageChange}
                    template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
                    currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} evaluaciones"
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
