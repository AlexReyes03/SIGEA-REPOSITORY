import React from 'react'

export default function CampusSelector() {
  return (
    <>
        <div className="bg-white rounded-top p-2">
            <h3 className="text-blue-500 fw-semibold mx-3 my-1">Seleccione un Plantel</h3>
        </div>

        <div className="row mt-3">
            <div className="col-3">
                <div className="card rounded hovereable border-0">
                    <img src="https://placehold.co/600x400?text=Cuernavaca" alt="Portada" className='rounded rounded-bottom-0' height={150} style={{objectFit: 'cover',}} />
                    <div className="card-body">
                        <h5 className='fs-5 fw-semibold'>Plantel Cuernavaca</h5>
                        <span className='fw-semibold text-muted'>Carreras 2</span>
                    </div>
                </div>
            </div>
            <div className="col-3">
                <div className="card rounded hovereable border-0">
                    <img src="https://placehold.co/600x400?text=Temixco" alt="Portada" className='rounded rounded-bottom-0' height={150} style={{objectFit: 'cover',}} />
                    <div className="card-body">
                        <h5 className='fs-5 fw-semibold'>Plantel Temixco</h5>
                        <span className='fw-semibold text-muted'>Carreras 2</span>
                    </div>
                </div>
            </div>
            <div className="col-3">
                <div className="card rounded hovereable border-0">
                    <img src="https://placehold.co/600x400?text=Cuautla" alt="Portada" className='rounded rounded-bottom-0' height={150} style={{objectFit: 'cover',}} />
                    <div className="card-body">
                        <h5 className='fs-5 fw-semibold'>Plantel Cuautla</h5>
                        <span className='fw-semibold text-muted'>Carreras 3</span>
                    </div>
                </div>
            </div>
            <div className="col-3">
                <div className="card rounded hovereable border-0">
                    <img src="https://placehold.co/600x400?text=Jiutepec" alt="Portada" className='rounded rounded-bottom-0' height={150} style={{objectFit: 'cover',}} />
                    <div className="card-body">
                        <h5 className='fs-5 fw-semibold'>Plantel Jiutepec</h5>
                        <span className='fw-semibold text-muted'>Carreras 4</span>
                    </div>
                </div>
            </div>
        </div>
    </>
  )
}
