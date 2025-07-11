import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Image } from '@react-pdf/renderer';

// Estilos con colores institucionales CETEC
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 20,
        fontFamily: 'Helvetica',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 10,
        borderBottomWidth: 2,
        borderBottomColor: '#E31E24',
    },
    logo: {
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    logoImage: {
        width: 60,
        height: 60,
        marginRight: 10,
    },
    institutionText: {
        fontSize: 10,
        color: '#021527',
        marginTop: 2,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#021527',
        textAlign: 'center',
        marginBottom: 20,
    },
    section: {
        marginBottom: 15,
        padding: 10,
        backgroundColor: '#F8F9FA',
        borderRadius: 5,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#075797',
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#CCD7E9',
        paddingBottom: 3,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    infoLabel: {
        fontSize: 9,
        color: '#021527',
        fontWeight: 'bold',
        width: '40%',
    },
    infoValue: {
        fontSize: 9,
        color: '#002E5D',
        width: '60%',
    },
    table: {
        marginTop: 10,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#075797',
        paddingVertical: 8,
        paddingHorizontal: 5,
    },
    tableHeaderText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#CCD7E9',
        paddingVertical: 6,
        paddingHorizontal: 5,
    },
    tableRowAlt: {
        backgroundColor: '#F8F9FA',
    },
    tableCell: {
        fontSize: 9,
        color: '#021527',
        textAlign: 'left',
    },
    tableCellCenter: {
        fontSize: 9,
        color: '#021527',
        textAlign: 'center',
    },
    subjectCol: { width: '50%' },
    teacherCol: { width: '30%' },
    gradeCol: { width: '20%' },
    averageSection: {
        marginTop: 15,
        padding: 12,
        backgroundColor: '#E3F2FD',
        borderRadius: 5,
        borderLeftWidth: 4,
        borderLeftColor: '#075797',
    },
    averageText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#021527',
        textAlign: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        textAlign: 'center',
        fontSize: 8,
        color: '#666666',
        borderTopWidth: 1,
        borderTopColor: '#CCD7E9',
        paddingTop: 10,
    },
    gradeBadge: {
        padding: 3,
        borderRadius: 3,
        textAlign: 'center',
        fontSize: 9,
        fontWeight: 'bold',
        minWidth: 25,
    },
    gradeSuccess: {
        backgroundColor: '#4CAF50',
        color: '#FFFFFF',
    },
    gradeWarning: {
        backgroundColor: '#FF9800',
        color: '#FFFFFF',
    },
    gradeDanger: {
        backgroundColor: '#F44336',
        color: '#FFFFFF',
    },
    gradeSecondary: {
        backgroundColor: '#9E9E9E',
        color: '#FFFFFF',
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

    const getGradeStyle = (grade) => {
        if (grade == null) return [styles.gradeBadge, styles.gradeSecondary];
        if (grade >= 8) return [styles.gradeBadge, styles.gradeSuccess];
        if (grade >= 7) return [styles.gradeBadge, styles.gradeWarning];
        return [styles.gradeBadge, styles.gradeDanger];
    };

    const formatGrade = (grade) => {
        if (grade == null) return 'S/C';
        return grade.toString();
    };

    // Calcular promedio del módulo
    const moduleGrades = moduleData.subjects
        .map(subject => subject.grade)
        .filter(grade => grade != null && grade >= 6 && grade <= 10);

    const moduleAverage = moduleGrades.length > 0
        ? (moduleGrades.reduce((a, b) => a + b, 0) / moduleGrades.length).toFixed(1)
        : 'S/C';

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header con logo CETEC */}
                <View style={styles.header}>
                    {/* Logo y texto institucional */}
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Image
                            style={styles.logoImage}
                            src="/src/assets/img/logo_cetec.png"
                        />
                    </View>

                    {/* Fecha */}
                    <View>
                        <Text style={{ fontSize: 10, color: '#021527' }}>
                            Fecha de expedición: {formatDate(new Date())}
                        </Text>
                    </View>
                </View>


                {/* Título */}
                <Text style={styles.title}>
                    BOLETA DE CALIFICACIONES - {moduleData.name}
                </Text>

                {/* Información del estudiante */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>INFORMACIÓN DEL ESTUDIANTE</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Nombre completo:</Text>
                        <Text style={styles.infoValue}>
                            {studentData.name} {studentData.paternalSurname} {studentData.maternalSurname || ''}
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Matrícula:</Text>
                        <Text style={styles.infoValue}>{studentData.primaryRegistrationNumber}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Carrera:</Text>
                        <Text style={styles.infoValue}>{groupData.careerName}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Estado:</Text>
                        <Text style={styles.infoValue}>{studentData.status}</Text>
                    </View>
                </View>

                {/* Información del grupo */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>INFORMACIÓN ACADÉMICA</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Grupo:</Text>
                        <Text style={styles.infoValue}>{groupData.name}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Docente a cargo:</Text>
                        <Text style={styles.infoValue}>{groupData.teacherName}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Horario:</Text>
                        <Text style={styles.infoValue}>{groupData.schedule}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Período académico:</Text>
                        <Text style={styles.infoValue}>2025-1</Text>
                    </View>
                </View>

                {/* Tabla de calificaciones */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>CALIFICACIONES - {moduleData.name}</Text>

                    <View style={styles.table}>
                        {/* Header de tabla */}
                        <View style={styles.tableHeader}>
                            <Text style={[styles.tableHeaderText, styles.subjectCol]}>Materia</Text>
                            <Text style={[styles.tableHeaderText, styles.teacherCol]}>Docente</Text>
                            <Text style={[styles.tableHeaderText, styles.gradeCol]}>Calificación</Text>
                        </View>

                        {/* Filas de materias */}
                        {moduleData.subjects.map((subject, index) => (
                            <View
                                key={subject.subjectId}
                                style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}
                            >
                                <Text style={[styles.tableCell, styles.subjectCol]}>
                                    {subject.subjectName}
                                </Text>
                                <Text style={[styles.tableCell, styles.teacherCol]}>
                                    {subject.teacherName}
                                </Text>
                                <View style={[styles.tableCellCenter, styles.gradeCol]}>
                                    <Text style={getGradeStyle(subject.grade)}>
                                        {formatGrade(subject.grade)}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Promedio del módulo */}
                <View style={styles.averageSection}>
                    <Text style={styles.averageText}>
                        PROMEDIO DEL MÓDULO: {moduleAverage}
                    </Text>
                </View>

                {/* Footer */}
                <Text style={styles.footer}>
                    Este documento es generado automáticamente por el Sistema Integral de Gestión Educativa y Administrativa (SIGEA)
                    {'\n'}CETEC - Centro de Estudios Tecnológicos - Campus Cuernavaca
                </Text>
            </Page>
        </Document>
    );
};

// Componente de descarga optimizado con estilos CETEC
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
                    className="cetec-btn-primary d-flex align-items-center gap-2"
                    disabled={loading}
                    title={`Descargar boleta de ${moduleData.name}`}
                    style={{
                        padding: '8px 12px',
                        fontSize: '0.875rem',
                        minWidth: 'auto',
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
                            <span className="d-none d-md-inline">Descargar</span>
                        </>
                    )}
                </button>
            )}
        </PDFDownloadLink>
    );
};