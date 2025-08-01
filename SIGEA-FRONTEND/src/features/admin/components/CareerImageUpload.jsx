import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FileUpload } from 'primereact/fileupload';
import { ProgressBar } from 'primereact/progressbar';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { Modal } from 'bootstrap';
import { MdOutlineSchool } from 'react-icons/md';

import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../components/providers/ToastProvider';
import { getCareerByPlantelId } from '../../../api/academics/careerService';
import { uploadCareerImage } from '../../../api/mediaService';
import { BACKEND_BASE_URL } from '../../../api/common-url';

export default function CareerImageUpload({ onImagesUpdated }) {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [careers, setCareers] = useState([]);
  const [selectedCareer, setSelectedCareer] = useState(null);
  const [file, setFile] = useState(null);
  const [totalSize, setTotalSize] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [loadingCareers, setLoadingCareers] = useState(false);
  const [wasOptimized, setWasOptimized] = useState(false);

  const fileUploadRef = useRef(null);
  const modalRef = useRef(null);

  const resizeImage = useCallback((file, maxWidth = 2400, maxHeight = 1800, targetQuality = 1) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = async () => {
        let { width, height } = img;
        const targetSize = 3 * 1024 * 1024; // Target 3MB

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = Math.round(width);
        canvas.height = Math.round(height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const tryCompress = (quality) => {
          return new Promise((resolveCompress) => {
            canvas.toBlob(
              (blob) => {
                resolveCompress(blob);
              },
              'image/jpeg',
              quality
            );
          });
        };

        let finalBlob = await tryCompress(targetQuality);

        if (finalBlob.size > targetSize) {
          finalBlob = await tryCompress(0.95);
        }

        resolve(finalBlob);
      };

      img.src = URL.createObjectURL(file);
    });
  }, []);

  function getImageUrl(url) {
    if (!url) return null;
    if (/^https?:\/\//.test(url)) return url;
    return `${BACKEND_BASE_URL}${url}`;
  }

  // Cargar carreras del plantel
  const loadCareers = useCallback(async () => {
    if (!user?.campus?.id) return;

    try {
      setLoadingCareers(true);
      const careersList = await getCareerByPlantelId(user.campus.id);
      setCareers(Array.isArray(careersList) ? careersList : []);
    } catch (err) {
      showError('Error', 'Error al cargar las carreras del plantel');
      setCareers([]);
    } finally {
      setLoadingCareers(false);
    }
  }, [user?.campus?.id, showError]);

  // Limpia el file y el peso al cerrar el modal
  useEffect(() => {
    const modalEl = modalRef.current;
    if (!modalEl) return;

    const handleHidden = () => {
      setFile(null);
      setTotalSize(0);
      setSelectedCareer(null);
      setWasOptimized(false);
      if (fileUploadRef.current) fileUploadRef.current.clear();
    };

    modalEl.addEventListener('hidden.bs.modal', handleHidden);
    return () => modalEl.removeEventListener('hidden.bs.modal', handleHidden);
  }, []);

  const onTemplateSelect = async (e) => {
    const _file = e.files[0];
    if (!_file) return;

    if (!_file.type.startsWith('image/')) {
      showError('Archivo inválido', 'Solo se permiten imágenes JPG o PNG');
      setFile(null);
      setTotalSize(0);
      setWasOptimized(false);
      if (fileUploadRef.current) fileUploadRef.current.clear();
      return;
    }

    try {
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (_file.size <= maxSize) {
        setFile(_file);
        setTotalSize(_file.size);
        setWasOptimized(false);
        return;
      }
      const resizedBlob = await resizeImage(_file);
      const resizedFile = new File([resizedBlob], _file.name, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });

      setFile(resizedFile);
      setTotalSize(resizedFile.size);
      setWasOptimized(true);

      const originalSizeMB = Math.round((_file.size / 1024 / 1024) * 100) / 100;
      const finalSizeMB = Math.round((resizedFile.size / 1024 / 1024) * 100) / 100;
      showSuccess('Optimizada', `${originalSizeMB}MB → ${finalSizeMB}MB`);
    } catch (err) {
      showError('Error', 'Error al procesar la imagen');
      setFile(null);
      setTotalSize(0);
      setWasOptimized(false);
      if (fileUploadRef.current) fileUploadRef.current.clear();
    }
  };

  const onTemplateUpload = async () => {
    if (!file || !selectedCareer) return;

    setUploading(true);
    try {
      await uploadCareerImage(selectedCareer.id, file);
      showSuccess('Éxito', `Imagen actualizada para ${selectedCareer.name}`);

      // Actualizar la lista de carreras
      await loadCareers();

      // Notificar al componente padre
      if (onImagesUpdated) {
        onImagesUpdated();
      }

      setFile(null);
      setTotalSize(0);
      setSelectedCareer(null);
      setWasOptimized(false);
      Modal.getInstance(modalRef.current)?.hide();
      if (fileUploadRef.current) fileUploadRef.current.clear();
    } catch (err) {
      showError('Error', 'La imagen no se pudo subir');
    } finally {
      setUploading(false);
    }
  };

  const onTemplateClear = () => {
    setFile(null);
    setTotalSize(0);
    setWasOptimized(false);
  };

  const openModal = async () => {
    setFile(null);
    setTotalSize(0);
    setSelectedCareer(null);
    setWasOptimized(false);
    if (fileUploadRef.current) fileUploadRef.current.clear();

    await loadCareers();
    new Modal(modalRef.current).show();
  };

  // CAMBIO: No limpiar imagen si es la misma carrera
  const selectCareer = (career) => {
    // Solo limpiar si es una carrera diferente
    if (selectedCareer?.id !== career.id) {
      setFile(null);
      setTotalSize(0);
      setWasOptimized(false);
      if (fileUploadRef.current) fileUploadRef.current.clear();
    }
    setSelectedCareer(career);
  };

  const headerTemplate = (options) => {
    const { className, chooseButton, uploadButton, cancelButton } = options;

    // Calcular progreso basado en si la imagen fue optimizada o no
    const maxDisplaySize = 5 * 1024 * 1024; // 5MB para display
    const value = Math.min((totalSize / maxDisplaySize) * 100, 100);
    const formatedValue = fileUploadRef && fileUploadRef.current ? fileUploadRef.current.formatSize(totalSize) : '0 B';

    return (
      <div className={className + ' justify-content-between align-items-center py-2'} style={{ backgroundColor: 'transparent', display: 'flex', flexWrap: 'wrap' }}>
        <div className="d-flex gap-2 align-items-center">
          {/* CAMBIO: Solo mostrar botón si hay carrera seleccionada */}
          {!file && selectedCareer && chooseButton}
          {file && uploadButton}
          {file && cancelButton}
        </div>
        <div className="d-flex align-items-center gap-2 ms-auto mt-2 mt-md-0" style={{ minWidth: 160 }}>
          <span style={{ fontSize: 13 }}>
            {formatedValue} {totalSize <= maxDisplaySize ? '/ 5 MB' : '(optimizada)'}
          </span>
          <ProgressBar value={value} showValue={false} style={{ width: 90, height: 8, background: '#e9ecef' }} />
        </div>
      </div>
    );
  };

  const itemTemplate = () =>
    file && (
      <div className="d-flex align-items-center my-3 w-100" style={{ gap: '12px' }}>
        {/* Imagen fija */}
        <div className="flex-shrink-0">
          <img alt={file.name} src={file.objectURL || URL.createObjectURL(file)} className="rounded shadow-sm" width={120} height={80} style={{ objectFit: 'cover' }} />
        </div>

        {/* Información del archivo - flex para ocupar espacio disponible */}
        <div className="flex-grow-1" style={{ minWidth: 0 }}>
          <div className="fw-semibold text-truncate" style={{ maxWidth: '100%' }}>
            {file.name}
          </div>
          <small className="text-muted d-block">{wasOptimized ? 'Optimizada' : 'Imagen original'}</small>
        </div>

        {/* Tag fijo a la derecha */}
        <div className="flex-shrink-0">
          <Tag value={fileUploadRef.current?.formatSize(file.size)} severity="success" className="px-3 py-2" />
        </div>
      </div>
    );

  const emptyTemplate = () => (
    <div className="w-100 d-flex flex-column align-items-center justify-content-center p-4">
      {selectedCareer ? (
        <>
          {/* Imagen actual de la carrera */}
          <div className="position-relative mb-3 d-flex align-items-center justify-content-center" style={{ width: 200, height: 150, overflow: 'hidden', borderRadius: '8px', backgroundColor: '#f8f9fa' }}>
            <img src={getImageUrl(selectedCareer.imageUrl) || `https://placehold.co/600x400?text=${selectedCareer.differentiator}`} className="shadow-sm w-100 h-100" alt={selectedCareer.name} style={{ objectFit: 'cover', objectPosition: 'center' }} />
            {uploading && (
              <div
                className="position-absolute d-flex align-items-center justify-content-center rounded"
                style={{
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'rgba(0,0,0,0.35)',
                  zIndex: 3,
                }}
              >
                <div className="spinner-border text-light" role="status" style={{ width: 32, height: 32 }}>
                  <span className="visually-hidden">Subiendo...</span>
                </div>
              </div>
            )}
          </div>

          <h6 className="text-center mb-3">{selectedCareer.name}</h6>

          <div className="my-2 text-center w-100" style={{ maxWidth: 420 }}>
            <span className="d-block mb-1 fw-semibold" style={{ fontSize: '1.13em', color: '#5f6368' }}>
              Arrastra una imagen aquí o haz clic en el botón <i className="pi pi-fw pi-images"></i> <span className="d-none d-lg-inline">Seleccionar</span>
            </span>
            <p>
              <small className="text-muted">para cambiar la imagen de esta carrera</small>
            </p>
            <small>
              Formatos permitidos: <b>JPG, PNG</b>. Si la imagen pesa más de <b>5MB</b> se optimizará.
            </small>
          </div>
        </>
      ) : (
        <div className="text-center">
          <MdOutlineSchool size={48} className="text-muted mb-3" />
          <h6 className="text-muted">Selecciona una carrera</h6>
          <p className="text-muted">Elige la carrera para la cual deseas subir o cambiar la imagen</p>
          <small className="text-muted">
            Se recomienda usar imágenes de al menos <b>900x1150 píxeles</b> en formato vertical.
          </small>
        </div>
      )}
    </div>
  );

  const chooseOptions = {
    icon: 'pi pi-fw pi-images',
    label: 'Seleccionar',
    className: 'custom-choose-btn',
    disabled: !selectedCareer,
  };

  const uploadOptions = {
    icon: 'pi pi-fw pi-cloud-upload',
    label: 'Subir',
    className: 'p-button-success custom-upload-btn',
    disabled: !selectedCareer,
  };

  const cancelOptions = {
    icon: 'pi pi-fw pi-times',
    label: 'Limpiar',
    className: 'p-button-secondary p-button-outlined custom-cancel-btn',
    onClick: onTemplateClear,
  };

  return ( 
    <>
      {/* Botón para abrir modal */}
      <Button icon="pi pi-images" size="small" className="p-button-info" onClick={openModal} disabled={uploading} title="Gestionar imágenes de carreras">
        <span className="ms-2">Gestionar imágenes</span>
      </Button>

      {/* Modal Bootstrap con FileUpload */}
      <div className="modal fade" ref={modalRef} tabIndex={-1} data-bs-backdrop="static" data-bs-keyboard="false">
        <div className="modal-dialog modal-xl modal-dialog-centered">
          <div className="modal-content p-0">
            <div className="modal-header">
              <h5 className="modal-title">Subir una imagen</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" disabled={uploading} />
            </div>

            <div className="modal-body p-0">
              <div className="row h-100 px-3">
                {/* Panel izquierdo - Lista de carreras */}
                <div className="col-12 col-lg-4 border-end bg-light px-0 mx-0">
                  <div className="p-3">
                    <h6 className="fw-semibold mb-3">Carreras en {user?.campus?.name}</h6>

                    {loadingCareers ? (
                      <div className="text-center py-4">
                        <ProgressSpinner style={{ width: '30px', height: '30px' }} strokeWidth="8" />
                        <p className="mt-2 text-muted small">Cargando carreras...</p>
                      </div>
                    ) : careers.length === 0 ? (
                      <Message severity="info" text="No hay carreras disponibles en este plantel" />
                    ) : (
                      <div className="career-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {careers.map((career) => (
                          <div key={career.id} className={`career-item p-3 mb-2 rounded cursor-pointer border ${selectedCareer?.id === career.id ? 'bg-primary text-white' : 'bg-white'}`} onClick={() => selectCareer(career)} style={{ cursor: 'pointer' }}>
                            <div className="d-flex align-items-center">
                              <div className="me-3 d-flex align-items-center justify-content-center" style={{ width: 50, height: 50, overflow: 'hidden', borderRadius: '8px', backgroundColor: '#f8f9fa', flexShrink: 0 }}>
                                <img src={getImageUrl(career?.imageUrl) || `https://placehold.co/600x400?text=${career?.differentiator}`} className="w-100 h-100" alt={career?.name} style={{ objectFit: 'cover', objectPosition: 'center' }} />
                              </div>
                              <div className="flex-grow-1 text-truncate">
                                <div className="fw-semibold ">{career.name}</div>
                                <small className={selectedCareer?.id === career.id ? 'text-light' : 'text-muted'}>
                                  {career.differentiator} • {career.studentsCount} estudiantes
                                </small>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Panel derecho - Subida de imagen */}
                <div className="col-12 col-lg-8">
                  <div className="p-4">
                    <FileUpload
                      ref={fileUploadRef}
                      name="careerImage"
                      customUpload
                      accept="image/*"
                      maxFileSize={100_000_000} // 100MB para permitir cualquier imagen inicial
                      uploadHandler={onTemplateUpload}
                      onSelect={onTemplateSelect}
                      onError={onTemplateClear}
                      onClear={onTemplateClear}
                      headerTemplate={headerTemplate}
                      itemTemplate={itemTemplate}
                      emptyTemplate={emptyTemplate}
                      chooseOptions={chooseOptions}
                      uploadOptions={uploadOptions}
                      cancelOptions={cancelOptions}
                      multiple={false}
                      mode="advanced"
                      style={{ width: '100%' }}
                      disabled={uploading}
                      className="border-0"
                    />
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
