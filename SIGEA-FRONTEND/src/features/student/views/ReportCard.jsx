import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import ImagenCetec from '../../../assets/img/logo_cetec.png';

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column', backgroundColor: '#FFFFFF', padding: 0,
        fontFamily: 'Helvetica', position: 'relative'
    },
    header: {
        backgroundColor: '#FFFFFF', padding: 18,
        alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between',
    },
    logoCircle: { width: 80, height: 'auto', alignItems: 'flex-end', justifyContent: 'flex-end' },
    logoImage: { width: 80, height: 'auto' },
    headerText: { textAlign: 'flex-start' },
    campusName: { fontSize: 20, fontWeight: 'bold', color: '#002e5d', marginBottom: 2 },
    campusAddress: { fontSize: 11, color: '#1a365d', marginBottom: 1 },
    campusContact: { fontSize: 10, color: '#2d3748' },
    content: { padding: 20, paddingTop: 0, backgroundColor: 'white', flex: 1, paddingBottom: 100 },
    documentTitle: {
        fontSize: 16, fontWeight: 'bold', color: '#002e5d', textAlign: 'flex-start',
        marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', textTransform: 'uppercase'
    },
    studentSection: {
        backgroundColor: '#f1f5f9', padding: 8, marginBottom: 6,
        flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center'
    },
    studentInfo: { flex: 1 },
    studentName: { fontSize: 14, fontWeight: 'bold', color: '#000000', marginBottom: 3 },
    studentCredential: { fontSize: 10, color: '#000000' },
    fieldRow: { flexDirection: 'row', marginBottom: 12 },
    fieldColumnLeft: { flex: 1, marginRight: 20 },
    fieldColumnRight: { flex: 1, paddingLeft: 8 },
    fieldLabel: {
        fontSize: 10, color: '#000000', fontWeight: 'bold', marginBottom: 5, textTransform: 'uppercase'
    },
    fieldValue: {
        fontSize: 11, color: '#000000', backgroundColor: '#f1f5f9', padding: 8, borderRadius: 3
    },
    subjectsTable: { marginBottom: 8, width: '100%' },
    tableHeader: {
        flexDirection: 'row', backgroundColor: '#f8fafc', padding: 8, marginBottom: 5,
        borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#cbd5e1'
    },
    tableHeaderText: { color: '#000000', fontSize: 10, fontWeight: 'bold' },
    tableRow: {
        flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 8,
        borderBottomWidth: 1, borderBottomColor: '#f1f5f9'
    },
    tableRowEven: { backgroundColor: '#f8fafc' },
    tableCellSubject: { flex: 3, fontSize: 9, color: '#000000', paddingRight: 5 },
    tableCellGrade: { flex: 1, fontSize: 9, color: '#000000', textAlign: 'center' },
    gradeText: { fontWeight: 'bold' },
    noGradeText: { color: '#666666', fontStyle: 'italic' },
    signatureSection: {
        position: 'absolute', bottom: 60, width: '100%', alignItems: 'center', paddingHorizontal: 20
    },
    signatureRow: {
        flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15
    },
    signatureBox: { alignItems: 'center', width: '30%' },
    signatureLine: { borderBottomWidth: 1, borderBottomColor: '#000000', width: '100%', height: 40, marginBottom: 5 },
    signatureLabel: {
        fontSize: 10, fontWeight: 'bold', color: '#000000', textAlign: 'center', textTransform: 'uppercase'
    },
    signatureSubtext: {
        fontSize: 8, color: '#666666', textAlign: 'center', marginTop: 2
    },
    signatureTitle: {
        fontSize: 12, fontWeight: 'bold', color: '#000000', textTransform: 'uppercase'
    },
    footer: {
        backgroundColor: '#002e5d', padding: 15, alignItems: 'center',
        position: 'absolute', bottom: 0, width: '100%'
    },
    footerText: { fontSize: 10, color: '#FFFFFF', textAlign: 'center' },
});

const BoletaPDF = ({ studentData, groupData, moduleData, campusData, startDate, endDate }) => {
    if (!studentData || !groupData || !moduleData || !campusData) return null;

    const formatDate = (date) => {
        try {
            return new Intl.DateTimeFormat('es-MX', {
                day: '2-digit', month: '2-digit', year: 'numeric'
            }).format(date);
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'N/A';
        }
    };


    const moduleGrades = (moduleData.subjects || [])
        .map(subject => subject.grade)
        .filter(grade => grade != null && grade >= 6 && grade <= 10);

    //Calcula el promedio por modulo
    const moduleAverage = moduleGrades.length > 0
        ? (moduleGrades.reduce((a, b) => a + b, 0) / moduleGrades.length).toFixed(1)
        : 'S/C';

    const period = groupData.period
        .split(' - ')
        .map(date => date.split('-').reverse().join('/'))
        .join(' - ');
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <View style={styles.headerText}>
                        <Text style={styles.campusName}>{(campusData.name || 'Corporativo CETEC').toUpperCase()}</Text>
                        <Text style={styles.campusAddress}>{(campusData.address || '').toUpperCase()} TELÉFONO: {(campusData.phone || '').toUpperCase()}</Text>
                        <Text style={styles.campusContact}>R.F.C. {(campusData.rfc || '').toUpperCase()}</Text>
                    </View>

                    <View style={styles.logoCircle}>
                        {ImagenCetec && <Image style={styles.logoImage} src={ImagenCetec} />}
                    </View>
                </View>
                <View style={styles.content}>
                    <Text style={styles.documentTitle}>Boleta Académica</Text>
                    <View style={styles.studentSection}>
                        <View style={styles.studentInfo}>
                            <Text style={styles.studentName}>
                                {[studentData.name, studentData.paternalSurname, studentData.maternalSurname].filter(Boolean).join(' ').toUpperCase()}
                            </Text>
                            <Text style={styles.studentCredential}>NO. CREDENCIAL: {studentData.primaryRegistrationNumber || '---'}</Text>
                        </View>
                    </View>
                    <View>
                        <View style={styles.fieldRow}>
                            <View style={styles.fieldColumnLeft}>
                                <Text style={styles.fieldLabel}>Módulo</Text>
                                <Text style={styles.fieldValue}>{moduleData.name || ''}</Text>
                            </View>
                            <View style={styles.fieldColumnRight}>
                                <Text style={styles.fieldLabel}>Periodo Académico</Text>
                                <Text style={styles.fieldValue}>{period || ''}</Text>
                            </View>
                        </View>
                        <View style={styles.fieldRow}>
                            <View style={styles.fieldColumnLeft}>
                                <Text style={styles.fieldLabel}>Horario</Text>
                                <Text style={styles.fieldValue}>{groupData.schedule || 'N/A'}</Text>
                            </View>
                            <View style={styles.fieldColumnRight}>
                                <Text style={styles.fieldLabel}>Fecha de Emisión</Text>
                                <Text style={styles.fieldValue}>{formatDate(new Date())}</Text>
                            </View>
                        </View>
                    </View>
                    {(moduleData.subjects || []).length > 0 && (
                        <View style={styles.subjectsTable}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeaderText, { flex: 3 }]}>LISTA DE MATERIAS</Text>
                                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>CALIFICACIÓN</Text>
                            </View>
                            {moduleData.subjects.map((subject, index) => (
                                <View key={subject.subjectId || index} style={[styles.tableRow, index % 2 === 1 && styles.tableRowEven]}>
                                    <Text style={styles.tableCellSubject}>{subject.subjectName || 'Sin nombre'}</Text>
                                    <Text style={[styles.tableCellGrade, subject.grade != null ? styles.gradeText : styles.noGradeText]}>
                                        {subject.grade != null ? subject.grade : 'S/C'}
                                    </Text>
                                </View>
                            ))}
                            <View style={[styles.tableRow, { marginTop: 5 }]}>
                                <Text style={[styles.tableCellSubject, { fontWeight: 'bold' }]}>Promedio General</Text>
                                <Text style={[styles.tableCellGrade, { fontWeight: 'bold' }]}>{moduleAverage}</Text>
                            </View>
                        </View>
                    )}
                </View>
                <View style={styles.signatureSection}>
                    <View style={styles.signatureRow}>
                        <View style={styles.signatureBox}>
                            <View style={styles.signatureLine} />
                            <Text style={styles.signatureLabel}>{groupData.teacherName || 'PROFESOR TUTELAR'}</Text>
                            <Text style={styles.signatureSubtext}>Profesor</Text>
                        </View>
                        <View style={styles.signatureBox}>
                            <View style={styles.signatureLine} />
                            <Text style={styles.signatureLabel}>{campusData.director?.toUpperCase() || 'DIRECTOR'}</Text>
                            <Text style={styles.signatureSubtext}>Director</Text>
                        </View>
                        <View style={styles.signatureBox}>
                            <View style={styles.signatureLine} />
                            <Text style={styles.signatureLabel}>PADRE O TUTOR</Text>
                            <Text style={styles.signatureSubtext}>Responsable legal</Text>
                        </View>
                    </View>
                    <Text style={styles.signatureTitle}>FIRMAS</Text>
                </View>
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Documento oficial generado digitalmente - {(campusData.name || 'CETEC CUERNAVACA').toUpperCase()} S.C. - {new Date().getFullYear()}
                    </Text>
                </View>
            </Page>
        </Document>
    );
};

export const ReportCard = ({ studentData, groupData, moduleData, campusData, startDate, endDate }) => {
    const handleDownload = async () => {
        try {
            const blob = await pdf(
                <BoletaPDF
                    studentData={studentData}
                    groupData={groupData}
                    moduleData={moduleData}
                    campusData={campusData}
                    startDate={startDate}
                    endDate={endDate}
                />
            ).toBlob();

            const fileName = `Boleta_Detallada_${(moduleData?.name || 'Modulo').replace(/\s+/g, '_')}_${studentData?.primaryRegistrationNumber || 'N-A'}_${new Date().getFullYear()}.pdf`;
            saveAs(blob, fileName);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error al generar el PDF. Intente nuevamente.');
        }
    };

    return (
        <button
            className="btn btn-primary d-flex align-items-center gap-2"
            onClick={handleDownload}
            style={{
                padding: '10px 16px', fontSize: '0.875rem',
                backgroundColor: '#002e5d', borderColor: '#002e5d',
                borderRadius: '6px', fontWeight: '600', textDecoration: 'none',
            }}
        >
            <i className="pi pi-download" style={{ fontSize: '0.9rem' }} />
            <span className="d-none d-md-inline">Descargar</span>
        </button>
    );
};