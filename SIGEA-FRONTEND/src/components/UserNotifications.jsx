import React from 'react'
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { MdNotifications, MdNotificationsNone, MdNotificationImportant, MdMoreHoriz } from 'react-icons/md';
import avatarFallback from '../assets/img/profile.png';

export default function UserNotifications() {
  return (
    <>
        <div className="bg-white rounded-top p-2">
            <h3 className="text-blue-500 fw-semibold mx-3 my-1">Panel de notificaciones</h3>
        </div>

        <div className="row mt-3">
            <div className="col-12 col-md-3">
                <div className="card border-0 rounded-end-0">
                    <div className="card-body">
                        <div className="d-flex w-100 mb-2">
                            <h5 className='text-blue-500'>Notificaciones</h5>
                            <Tag className='ms-auto px-3' value={1}/>
                        </div>
                        <div className="d-flex flex-md-column justify-content-center justify-content-md-start text-center">
                            <Button text severity="secondary" className="mb-2 px-0">
                                <MdNotifications className='d-none d-md-inline' size={24} />
                                <span className='ms-2'>Todas</span>
                            </Button>
                            <Button text severity="secondary" className="mb-2 px-0">
                                <MdNotificationImportant className='d-none d-md-inline' size={24} />
                                <span className='ms-2'>No leídas</span>
                            </Button>
                            <Button text severity="secondary" className="mb-2 px-0">
                                <MdNotificationsNone className='d-none d-md-inline' size={24} />
                                <span className='ms-2'>Leídas</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="col-12 col-md-9 mt-3 mt-md-0">
                <div className="card p-4 border-0">
                    <div className="d-flex align-items-start gap-3">
                    <img
                        src={avatarFallback}
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
                        <div className='w-100'>
                            <div className='d-flex'>
                                <h6 className="text-dark mb-1 text-truncate">Título de notificación</h6>
                                <MdMoreHoriz size={24} className='ms-auto text-muted'/>
                            </div>
                            <small className="text-muted">25/07/2025, 12:37</small>
                        </div>
                        
                        </div>

                        <div className="text-muted">
                        Holaaaaa
                        </div>
                    </div>
                    </div>
                </div>
            </div>
        </div>
    </>
  )
}
