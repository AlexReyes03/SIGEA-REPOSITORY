import React, { useRef, useState, useMemo } from 'react';
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Button } from 'primereact/button';
import { Tag } from "primereact/tag";
import { Toolbar } from 'primereact/toolbar';
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
    const dt = useRef(null);
    const [users, setUsers] = useState(mockData);
    const [globalFilter, setGlobalFilter] = useState("");
    const [selectedTipoUsuario, setSelectedTipoUsuario] = useState(null);
    const [selectedCarrera, setSelectedCarrera] = useState(null);
    const [selected, setSelected] = useState(null);

    const header = useMemo(
        () => (
            <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between w-100">

                <div className="col-12 col-md d-flex align-items-center flex-wrap gap-2">
                    <div className='title-icon p-1 rounded-circle'>
                        <MdOutlineGroup className='p-1' size={38} />
                    </div>
                    <h5 className="title-text ms-2 me-2 mb-0">Estudiantes</h5>
                    <span className="badge bg-blue-500 p-2 me-2">{users.length}</span>

                </div>
                <span className="p-input-icon-left">
                    <InputText placeholder="Buscar..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} />
                </span>
            </div>
        ),
        [globalFilter]
    );

    const toolbarLeft = () => (
        <div className="flex flex-wrap">
            <Button icon="pi pi-user-plus" severity="primary" className="p-button  me-2"
                onClick={() => alert('Agregar usuario')}>
                <span className="d-none d-sm-inline ms-1">Agregar Usuario</span>
            </Button>
            <Button icon="pi pi-trash" severity="primary" className="me-2" >
                <span className="d-none d-sm-inline ms-1">Eliminar</span>
            </Button>
            <Dropdown
                value={selectedTipoUsuario}
                options={tiposUsuario}
                onChange={(e) => setSelectedTipoUsuario(e.value)}
                placeholder="Tipo de Usuario"
                className="me-2 mb-2 mb-md-0"
                style={{ minWidth: 160 }}
                optionLabel="label"
            />
        </div>
    );


    const toolbarRight = () => (
        <div className="d-flex align-items-center gap-2">

            <Button icon="pi pi-upload" className="p-button-help">
                <span className="d-none d-sm-inline ms-1">Exportar</span>
            </Button>
        </div>
    );


    const actions = (row) => (
        <>
            <Button icon="pi pi-pencil" rounded outlined className="me-2" onClick={() => alert(`Editar ${row.nombre}`)} />
            <Button icon="pi pi-trash" rounded outlined severity="danger" onClick={() => alert(`Eliminar ${row.nombre}`)} />
        </>
    );

    return (
        <>
            <div className="bg-white rounded-top p-2">
                <h3 className="text-blue-500 fw-semibold mx-3 my-1">Usuarios</h3>
            </div>

            <div className="shadow-sm my-2 p-3 bg-white rounded">
                <Toolbar className="p-0 bg-white border-0" start={toolbarLeft} end={toolbarRight} />
            </div>

            <div>
                <DataTable
                    ref={dt}
                    value={users}
                    selection={selected}
                    onSelectionChange={(e) => setSelected(e.value)}
                    dataKey="id"
                    paginator
                    rows={5}
                    rowsPerPageOptions={[5, 10, 25]}
                    globalFilter={globalFilter}
                    header={header}
                    emptyMessage={<p className="text-center my-5">Aún no hay registros</p>}
                >
                    <Column selectionMode="multiple" headerStyle={{ width: '3em' }} />
                    <Column field="matricula" header="Matrícula" sortable />
                    <Column field="nombre" header="Nombre" sortable />
                    <Column field="carrera" header="Carrera" sortable />
                    <Column field="grupo" header="Grupo" sortable />
                    <Column field="estado" header="Estado" body={(rowData) => (
                        <Tag value={rowData.estado} severity={rowData.estado === "Activo" ? "success" : "warning"} />
                    )} />
                    <Column field="fechaIngreso" header="Fecha de Ingreso" sortable />
                    <Column body={actions} header="Acciones" exportable={false} />
                </DataTable>

            </div>
        </>
    )
}
