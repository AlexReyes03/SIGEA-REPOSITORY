import React, { useRef, useState, useEffect } from 'react';
import { FileUpload } from 'primereact/fileupload';
import { ProgressBar } from 'primereact/progressbar';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Modal } from 'bootstrap';

import avatarFallback from '../../../assets/img/profile.png';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../components/providers/ToastProvider';
import { uploadAvatar } from '../../../api/mediaService';
import { BACKEND_BASE_URL } from '../../../api/common-url';

export default function ProfileAvatarUpload() {
  const { user, updateUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [file, setFile] = useState(null);
  const [totalSize, setTotalSize] = useState(0);
  const [uploading, setUploading] = useState(false);

  const fileUploadRef = useRef(null);
  const modalRef = useRef(null);

  function getAvatarUrl(url) {
    if (!url) return avatarFallback;
    if (/^https?:\/\//.test(url)) return url;
    return `${BACKEND_BASE_URL}${url}`;
  }

  // Limpia el file y el peso al cerrar el modal
  useEffect(() => {
    const modalEl = modalRef.current;
    if (!modalEl) return;

    const handleHidden = () => {
      setFile(null);
      setTotalSize(0);
      if (fileUploadRef.current) fileUploadRef.current.clear();
    };

    modalEl.addEventListener('hidden.bs.modal', handleHidden);
    return () => modalEl.removeEventListener('hidden.bs.modal', handleHidden);
  }, []);

  const onTemplateSelect = (e) => {
    const _file = e.files[0];
    if (!_file) return;

    if (!_file.type.startsWith('image/')) {
      showError('Archivo inválido', 'Solo se permiten imágenes JPG o PNG');
      setFile(null);
      setTotalSize(0);
      if (fileUploadRef.current) fileUploadRef.current.clear();
      return;
    }
    setFile(_file);
    setTotalSize(_file.size);
  };

  const onTemplateUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const dto = await uploadAvatar(user.id, file);
      updateUser({ avatarUrl: dto.url }); // <-- Usa updateUser aquí
      showSuccess('Hecho', 'Tu foto de perfil ha sido actualizada');
      setFile(null);
      setTotalSize(0);
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
  };

  const openModal = () => {
    setFile(null);
    setTotalSize(0);
    if (fileUploadRef.current) fileUploadRef.current.clear();
    new Modal(modalRef.current).show();
  };

  const headerTemplate = (options) => {
    const { className, chooseButton, uploadButton, cancelButton } = options;
    const value = totalSize / 2000000;
    const formatedValue = fileUploadRef && fileUploadRef.current ? fileUploadRef.current.formatSize(totalSize) : '0 B';
    return (
      <div className={className + ' justify-content-between align-items-center py-2'} style={{ backgroundColor: 'transparent', display: 'flex', flexWrap: 'wrap' }}>
        <div className="d-flex gap-2 align-items-center">
          {!file && chooseButton}
          {file && uploadButton}
          {file && cancelButton}
        </div>
        <div className="d-flex align-items-center gap-2 ms-auto mt-2 mt-md-0" style={{ minWidth: 160 }}>
          <span style={{ fontSize: 13 }}>{formatedValue} / 2 MB</span>
          <ProgressBar value={value * 100} showValue={false} style={{ width: 90, height: 8, background: '#e9ecef' }} />
        </div>
      </div>
    );
  };

  const itemTemplate = () =>
    file && (
      <div className="d-flex align-items-center justify-content-center text-center justify-content-lg-start text-lg-start flex-wrap my-3 w-100">
        <img alt={file.name} src={file.objectURL || URL.createObjectURL(file)} className="rounded-circle me-3 shadow-sm" width={80} height={80} />
        <div className="me-auto text-truncate">
          <div className="fw-semibold">{file.name}</div>
          <small className="text-muted">{new Date().toLocaleDateString()}</small>
        </div>
        <Tag value={fileUploadRef.current?.formatSize(file.size)} severity="warning" className="px-3 py-2 me-2" />
      </div>
    );

  const emptyTemplate = () => (
    <div className="w-100 d-flex flex-column align-items-center justify-content-center p-4">
      {/* Avatar arriba centrado */}
      <div className="position-relative mb-2" style={{ width: 130, height: 130 }}>
        <img
          src={getAvatarUrl(user.avatarUrl) ?? avatarFallback}
          className="rounded-circle shadow-sm"
          alt="avatar"
          style={{
            width: 130,
            height: 130,
            objectFit: 'cover',
            boxShadow: '0 0 0 4px #fff, 0 2px 12px 0 rgba(0,0,0,0.12)',
          }}
        />
        {/* Overlay: spinner si está subiendo */}
        {uploading && (
          <div
            className="position-absolute d-flex align-items-center justify-content-center rounded-circle"
            style={{
              top: 0,
              left: 0,
              width: 130,
              height: 130,
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
      <div className="my-2 text-center w-100" style={{ maxWidth: 420 }}>
        <span className="d-block mb-1 fw-semibold" style={{ fontSize: '1.13em', color: '#5f6368' }}>
          Arrastra una imagen aquí o haz clic en el botón <i className='pi pi-fw pi-images'></i> <span className='d-none d-lg-inline'>Seleccionar</span>
        </span>
        <p>
          <small className="text-muted">para cambiar tu foto de perfil</small>
        </p>
        <small>
          Formatos permitidos: <b>JPG, PNG</b>. Tamaño máximo: <b>2MB</b>
        </small>
      </div>
    </div>
  );

  const chooseOptions = {
    icon: 'pi pi-fw pi-images',
    label: 'Seleccionar',
    className: 'custom-choose-btn',
  };
  const uploadOptions = {
    icon: 'pi pi-fw pi-cloud-upload',
    label: 'Subir',
    className: 'p-button-success custom-upload-btn',
  };
  const cancelOptions = {
    icon: 'pi pi-fw pi-times',
    label: 'Eliminar',
    className: 'p-button-secondary p-button-outlined custom-cancel-btn',
    onClick: onTemplateClear,
  };

  return (
    <>
      {/* Avatar con botón para abrir modal */}
      <div className="d-flex flex-column align-items-center position-relative">
        <img src={getAvatarUrl(user.avatarUrl) ?? avatarFallback} alt="avatar" className="rounded-circle border border-3 p-1" style={{ width: 150, height: 150, objectFit: 'cover' }} />
        {/* Botón lápiz flotante */}
        <Button
          icon="pi pi-pencil"
          className="rounded-circle shadow-sm position-absolute d-flex align-items-center justify-content-center"
          severity="info"
          style={{ bottom: 0, right: 'calc(50% - 70px)', zIndex: 2 }}
          title="Cambiar foto"
          onClick={openModal}
          disabled={uploading}
        />
      </div>

      {/* Modal Bootstrap con FileUpload */}
      <div className="modal fade" ref={modalRef} tabIndex={-1} data-bs-backdrop="static" data-bs-keyboard="false">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content p-0">
            <div className="modal-header">
              <h5 className="modal-title">Cambiar foto de perfil</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" disabled={uploading} />
            </div>
            <div className="modal-body px-4 pt-3 pb-4">
              <FileUpload
                ref={fileUploadRef}
                name="avatar"
                customUpload
                accept="image/*"
                maxFileSize={2_000_000}
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
    </>
  );
}
