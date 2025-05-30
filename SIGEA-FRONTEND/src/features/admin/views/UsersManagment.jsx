import React, {useRef} from 'react'
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Button } from 'primereact/button';
import { Tag } from "primereact/tag";
import { Menu } from "primereact/menu";
import { Toast } from 'primereact/toast';
import { useState } from 'react';
import { MdOutlineGroup } from "react-icons/md";



const mockData = [
    { id: 1, matricula: "2023001", nombre: "Juan Pérez", carrera: "Ing. Sistemas", grupo: "A", estado: "Activo", fechaIngreso: "2023-01-10" },
    { id: 2, matricula: "2023002", nombre: "María López", carrera: "Derecho", grupo: "B", estado: "Inactivo", fechaIngreso: "2022-09-05" },
    { id: 3, matricula: "2023003", nombre: "Carlos García", carrera: "Medicina", grupo: "C", estado: "Activo", fechaIngreso: "2023-02-15" },
    { id: 4, matricula: "2023004", nombre: "Ana Torres", carrera: "Arquitectura", grupo: "D", estado: "Inactivo", fechaIngreso: "2021-11-20" },
    { id: 5, matricula: "2023005", nombre: "Luis Martínez", carrera: "Ing. Sistemas", grupo: "A", estado: "Activo", fechaIngreso: "2023-03-01" },
    { id: 6, matricula: "2023006", nombre: "Laura Sánchez", carrera: "Derecho", grupo: "B", estado: "Inactivo", fechaIngreso: "2022-10-10" },
];

const tiposUsuario = [
    { label: "Estudiante", value: "estudiante" },
    { label: "Docente", value: "docente" },
    { label: "Administrador", value: "admin" },
];

const carreras = [
    { label: "Ing. Sistemas", value: "sistemas" },
    { label: "Derecho", value: "derecho" },
    { label: "Medicina", value: "medicina" },
    { label: "Arquitectura", value: "arquitectura" },
];


export default function UsersManagment() {
    const [users, setUsers] = useState(mockData);
    const [globalFilter, setGlobalFilter] = useState("");
    const [selectedTipoUsuario, setSelectedTipoUsuario] = useState(tiposUsuario[0]);
    const [selectedCarrera, setSelectedCarrera] = useState(carreras[0]);
    const menuRight = useRef(null);
    const toast = useRef(null);

    const items = [
        {
            label: 'Opciones',
            items: [
                {
                    label: 'Ver Detalles',
                    icon: 'pi pi-eye'
                },
                {
                    label: 'Editar',
                    icon: 'pi pi-pencil'
                },
                {
                    label: 'Deshabilitar',
                    icon: 'pi pi-trash',
                    command: () => {
                        toast.current.show({ severity: 'error', summary: 'Confirmación', detail: '¿Estás seguro de archivar este usuario?', life: 3000 });
                    }
                }
            ]
        }
    ];
    return (
        <div>
            <div className="shadow-sm p-3 bg-white rounded-top">
                <h3>Gestión de Usuarios</h3>
            </div>
            <div className="shadow-sm p-3 bg-white rounded mt-3">
                <div className="mb-3">
                    <div className='mb-3 d-flex align-items-center'>
                        <div className="flex-grow-1" >
                            <div className='d-flex align-items-center'>
                                <div className='title-icon p-1 rounded-circle'>
                                    <MdOutlineGroup className='p-1' size={38} />
                                </div>
                                <h5 className="title-text ms-2 me-2">Estudiantes</h5>
                                <span className="badge pill bg-blue-500 p-2 me-3">{users.length}</span>
                                <Dropdown value={selectedTipoUsuario} options={tiposUsuario} onChange={(e) => setSelectedTipoUsuario(e.value)} placeholder="Tipo de Usuario" className="me-2" />
                                <Dropdown value={selectedCarrera} options={carreras} onChange={(e) => setSelectedCarrera(e.value)} placeholder="Carrera" className="me-2" />
                            </div>
                        </div>
                        <div className="flex-shrink-0">
                            <Button icon="pi pi-user-plus" className="p-button btn-rounded-circle bg-blue-500 me-2" />
                            <InputText value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Buscar..." className="me-2" />

                        </div>
                    </div>

                    <DataTable value={users} paginator rows={10} globalFilter={globalFilter} responsiveLayout="scroll">
                        <Column field="matricula" header="Matrícula" sortable />
                        <Column field="nombre" header="Nombre" sortable />
                        <Column field="carrera" header="Carrera" sortable />
                        <Column field="grupo" header="Grupo" sortable />
                        <Column field="estado" header="Estado" body={(rowData) => (
                            <Tag value={rowData.estado} severity={rowData.estado === "Activo" ? "success" : "warning"} />
                        )} />
                        <Column field="fechaIngreso" header="Fecha de Ingreso" sortable />
                        <Column field="acciones" header="Acciones" body={(rowData) => (
                            <div className='flex justify-content-center'>
                                <Toast ref={toast}></Toast>
                                <Menu model={items} popup ref={menuRight} id="popup_menu_right" popupAlignment="right" />
                                <Button icon="pi pi-align-right"  className="bg-gray-800 rounded" onClick={(event) => menuRight.current.toggle(event)} aria-controls="popup_menu_right" aria-haspopup />
                            </div>
                        )} />
                    </DataTable>
                </div>
            </div>
        </div>
    )
}