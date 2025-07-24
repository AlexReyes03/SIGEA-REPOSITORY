import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Image } from '@react-pdf/renderer';
import ImagenCetec from '../../../assets/img/logo_cetec_square.png';
//import { NumberToWords } from 'n2words';

const numberToWords = (num) => {
    const ones = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
    
    if (num === 10) return 'diez';
    if (num < 10) return ones[num];
    if (num < 20) return teens[num - 10];
    
    return num.toString(); 
};

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 0,
        fontFamily: 'Helvetica',
    },
    
    // Header azul superior
    header: {
        backgroundColor: '#002e5d',
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    
    logoCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    
    logoImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    
    headerText: {
        flex: 1,
    },
    
    campusName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    
    campusAddress: {
        fontSize: 11,
        color: '#FFFFFF',
        marginBottom: 1,
    },
    
    campusContact: {
        fontSize: 10,
        color: '#FFFFFF',
    },
    
    // Contenido principal
    content: {
        padding: 20,
        backgroundColor: 'white',
        flex: 1,
    },
    
    // Sección del estudiante (gris)
    studentSection: {
        backgroundColor: '#f1f5f9',
        padding: 15,
        marginBottom: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    
    studentInfo: {
        flex: 1,
    },
    
    studentName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#002e5d',
        marginBottom: 3,
    },
    
    studentCredential: {
        fontSize: 10,
        color: '#000000',
    },
    
    gradeSection: {
        alignItems: 'center',
    },
    
    gradeNumber: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#002e5d',
        lineHeight: 1,
    },
    
    gradeWords: {
        fontSize: 8,
        color: '#000000',
        textAlign: 'center',
        marginTop: 2,
    },
    
    // Secciones de información
    infoSection: {
        backgroundColor: '#FFFFFF',
        padding: 15,
        marginBottom: 15,
        borderRadius: 20,
        borderColor: '#e8e8e8',
        borderWidth: 1,
    },
    
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    
    bulletPoint: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#002e5d',
        marginRight: 10,
    },
    
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#002e5d',
        textTransform: 'uppercase',
    },
    
    // Grid de campos
    fieldRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    
    fieldColumn: {
        flex: 1,
        marginRight: 15,
    },
    
    fieldLabel: {
        fontSize: 10,
        color: '#000000',
        fontWeight: 'bold',
        marginBottom: 5,
        textTransform: 'uppercase',
    },
    
    fieldValue: {
        fontSize: 11,
        color: '#000000',
        backgroundColor: '#f1f5f9',
        padding: 8,
        borderRadius: 3,
    },
    
    // Sección de firmas
    signatureSection: {
        marginTop: 30,
        alignItems: 'center',
    },
    
    signatureTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 30,
        textTransform: 'uppercase',
    },
    
    signatureRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 20,
    },
    
    signatureBox: {
        alignItems: 'center',
        width: '30%',
    },
    
    signatureLine: {
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
        width: '100%',
        height: 40,
        marginBottom: 5,
    },
    
    signatureLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#000000',
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    
    signatureSubtext: {
        fontSize: 8,
        color: '#666666',
        textAlign: 'center',
        marginTop: 2,
    },
    
    // Footer azul
    footer: {
        backgroundColor: '#002e5d',
        padding: 15,
        alignItems: 'center',
    },
    
    footerText: {
        fontSize: 10,
        color: '#FFFFFF',
        textAlign: 'center',
    },
});

// Componente del documento PDF
const BoletaPDF = ({ studentData, groupData, moduleData, qualificationDetails }) => {
    const formatDate = (date) => {
        return new Intl.DateTimeFormat('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(date);
    };

    // Calcular promedio del módulo
    const moduleGrades = moduleData.subjects
        .map(subject => subject.grade)
        .filter(grade => grade != null && grade >= 6 && grade <= 10);

    const moduleAverage = moduleGrades.length > 0
        ? (moduleGrades.reduce((a, b) => a + b, 0) / moduleGrades.length).toFixed(1)
        : 'S/C';

    // Convertir calificación a palabras
    const gradeInWords = moduleAverage !== 'S/C' ? 
        `${numberToWords(Math.floor(parseFloat(moduleAverage)))} punto ${numberToWords(Math.round((parseFloat(moduleAverage) % 1) * 10))}` : 
        'Sin calificar';

    // Formatear período académico
    const currentDate = new Date();
    const startDate = new Date(currentDate.getFullYear(), 0, 1);
    const endDate = new Date(currentDate.getFullYear(), 11, 31);
    const period = `${formatDate(startDate)} - ${formatDate(endDate)}`;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header azul */}
                <View style={styles.header}>
                    <View style={styles.logoCircle}>
                        <Image
                            style={styles.logoImage}
                            src={ImagenCetec}
                        />
                    </View>
                    
                    <View style={styles.headerText}>
                        <Text style={styles.campusName}>CETEC CUERNAVACA</Text>
                        <Text style={styles.campusAddress}>FCO. LEYVA #35 CENTRO</Text>
                        <Text style={styles.campusContact}>Tel. 312-35-92 • R.F.C. CCU-970521-7QB</Text>
                    </View>
                </View>

                {/* Contenido principal */}
                <View style={styles.content}>
                    {/* Sección del estudiante */}
                    <View style={styles.studentSection}>
                        <View style={styles.studentInfo}>
                            <Text style={styles.studentName}>
                                {`${studentData.name} ${studentData.paternalSurname} ${studentData.maternalSurname || ''}`.toUpperCase()}
                            </Text>
                            <Text style={styles.studentCredential}>
                                NO. CREDENCIAL: {studentData.primaryRegistrationNumber}
                            </Text>
                        </View>
                        
                        <View style={styles.gradeSection}>
                            <Text style={styles.gradeNumber}>{moduleAverage}</Text>
                            <Text style={styles.gradeWords}>PROMEDIO</Text>
                        </View>
                    </View>

                    {/* Información académica */}
                    <View style={styles.infoSection}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.bulletPoint} />
                            <Text style={styles.sectionTitle}>Información Académica</Text>
                        </View>
                        
                        <View style={styles.fieldRow}>
                            <View style={styles.fieldColumn}>
                                <Text style={styles.fieldLabel}>Módulo</Text>
                                <Text style={styles.fieldValue}>{moduleData.name}</Text>
                            </View>
                            
                            <View style={styles.fieldColumn}>
                                <Text style={styles.fieldLabel}>Profesor</Text>
                                <Text style={styles.fieldValue}>{groupData.teacherName}</Text>
                            </View>
                        </View>
                        
                        <View style={styles.fieldRow}>
                            <View style={styles.fieldColumn}>
                                <Text style={styles.fieldLabel}>Horario</Text>
                                <Text style={styles.fieldValue}>{groupData.schedule}</Text>
                            </View>
                            <View style={styles.fieldColumn}>
                                {/* Columna vacía para mantener el layout */}
                            </View>
                        </View>
                    </View>

                    {/* Detalles del período */}
                    <View style={styles.infoSection}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.bulletPoint} />
                            <Text style={styles.sectionTitle}>Detalles del Período</Text>
                        </View>
                        
                        <View style={styles.fieldRow}>
                            <View style={styles.fieldColumn}>
                                <Text style={styles.fieldLabel}>Fecha de Emisión</Text>
                                <Text style={styles.fieldValue}>{formatDate(new Date())}</Text>
                            </View>
                            
                            <View style={styles.fieldColumn}>
                                <Text style={styles.fieldLabel}>Período Académico</Text>
                                <Text style={styles.fieldValue}>{period}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Sección de firmas */}
                    <View style={styles.signatureSection}>
                        <Text style={styles.signatureTitle}>Firmas</Text>
                        
                        <View style={styles.signatureRow}>
                            <View style={styles.signatureBox}>
                                <View style={styles.signatureLine} />
                                <Text style={styles.signatureLabel}>Maestro</Text>
                                <Text style={styles.signatureSubtext}>teacher.name</Text>
                            </View>
                            
                            <View style={styles.signatureBox}>
                                <View style={styles.signatureLine} />
                                <Text style={styles.signatureLabel}>Maestro</Text>
                                <Text style={styles.signatureSubtext}>teacher.name</Text>
                            </View>
                            
                            <View style={styles.signatureBox}>
                                <View style={styles.signatureLine} />
                                <Text style={styles.signatureLabel}>Padre o Tutor</Text>
                                <Text style={styles.signatureSubtext}>Responsable legal</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Footer azul */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Documento oficial generado digitalmente - CETEC Cuernavaca S.C. - {new Date().getFullYear()}
                    </Text>
                </View>
            </Page>
        </Document>
    );
};

// Componente de descarga
export const ReportCard = ({ studentData, groupData, moduleData, qualificationDetails, moduleId }) => {
    const fileName = `Boleta_${moduleData.name.replace(/\s+/g, '_')}_${studentData.primaryRegistrationNumber}_${new Date().getFullYear()}.pdf`;

    return (
        <PDFDownloadLink
            document={
                <BoletaPDF
                    studentData={studentData}
                    groupData={groupData}
                    moduleData={moduleData}
                    qualificationDetails={qualificationDetails}
                />
            }
            fileName={fileName}
        >
            {({ blob, url, loading, error }) => (
                <button
                    className="btn btn-primary d-flex align-items-center gap-2"
                    disabled={loading}
                    title={`Descargar boleta de ${moduleData.name}`}
                    style={{
                        padding: '10px 16px',
                        fontSize: '0.875rem',
                        backgroundColor: '#002e5d',
                        borderColor: '#002e5d',
                        borderRadius: '6px',
                        fontWeight: '600',
                    }}
                >
                    {loading ? (
                        <>
                            <i className="pi pi-spin pi-spinner" style={{ fontSize: '0.9rem' }} />
                            <span className="d-none d-md-inline">Generando...</span>
                        </>
                    ) : (
                        <>
                            <i className="pi pi-download" style={{ fontSize: '0.9rem' }} />
                            <span className="d-none d-md-inline">Descargar Boleta</span>
                        </>
                    )}
                </button>
            )}
        </PDFDownloadLink>
    );
};