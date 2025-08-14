import React, { createContext, useContext } from 'react';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';

const ConfirmDialogContext = createContext(null);

export const ConfirmDialogProvider = ({ children }) => {
  const confirmAction = ({
    message,
    header = 'Confirmación',
    icon = 'pi pi-exclamation-triangle',
    acceptLabel = 'Sí',
    rejectLabel = 'Cancelar',
    acceptClassName = 'p-button-danger',
    rejectClassName = '',
    onAccept,
    onReject,
    closable = true,
    closeOnEscape = true,
    dismissableMask = true,
  }) => {
    confirmDialog({
      message,
      header,
      icon,
      acceptLabel,
      rejectLabel,
      acceptClassName,
      rejectClassName,
      accept: onAccept,
      reject: onReject,
      closable,
      closeOnEscape,
      dismissableMask,
      style: {
        minWidth: '300px',
        maxWidth: '500px',
      },
      contentStyle: {
        textAlign: 'start',
        wordWrap: 'break-word',
        wordBreak: 'break-word',
        whiteSpace: 'normal',
        lineHeight: '1.5',
      },
    });
  };

  return (
    <>
      <ConfirmDialog
        style={{
          minWidth: '300px',
          maxWidth: '500px',
        }}
        contentStyle={{
          textAlign: 'center',
          wordWrap: 'break-word',
          wordBreak: 'break-word',
          whiteSpace: 'normal',
          lineHeight: '1.5',
        }}
      />
      <ConfirmDialogContext.Provider value={{ confirmAction }}>{children}</ConfirmDialogContext.Provider>
    </>
  );
};

export const useConfirmDialog = () => useContext(ConfirmDialogContext);
