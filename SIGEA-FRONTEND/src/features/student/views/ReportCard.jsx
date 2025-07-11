import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Image } from '@react-pdf/renderer';

// Estilos que replican el formato tradicional de CETEC
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 30,
        fontFamily: 'Helvetica',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 2,
        borderBottomColor: '#000000',
    },
    logoSection: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '30%',
    },
    logoImage: {
        width: 100,
        height: 'auto'
    },
    institutionSection: {
        flexDirection: 'column',
        alignItems: 'center',
        width: '70%',
    },
    institutionName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000000',
        textAlign: 'center',
        marginBottom: 2,
    },
    institutionAddress: {
        fontSize: 10,
        color: '#000000',
        textAlign: 'center',
        marginBottom: 1,
    },
    institutionContact: {
        fontSize: 10,
        color: '#000000',
        textAlign: 'center',
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#000000',
        textAlign: 'center',
        marginBottom: 30,
        marginTop: 10,
    },
    formRow: {
        flexDirection: 'row',
        marginBottom: 15,
        alignItems: 'flex-end',
    },
    fieldContainer: {
        flexDirection: 'column',
        marginRight: 15,
    },
    fieldLabel: {
        fontSize: 9,
        color: '#000000',
        marginBottom: 3,
        fontWeight: 'bold',
    },
    fieldBox: {
        borderWidth: 1,
        borderColor: '#000000',
        padding: 8,
        minHeight: 25,
        justifyContent: 'center',
    },
    fieldValue: {
        fontSize: 11,
        color: '#000000',
    },
    // Tamaños específicos para cada campo
    credentialField: {
        width: 120,
    },
    nameField: {
        width: 300,
    },
    scheduleField: {
        width: 100,
    },
    dateField: {
        width: 100,
    },
    periodField: {
        width: 150,
    },
    gradeField: {
        width: 80,
    },
    moduleField: {
        width: 280,
    },
    teacherField: {
        width: 250,
    },
    signatureSection: {
        marginTop: 60,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    signatureBox: {
        width: '30%',
        alignItems: 'center',
    },
    signatureLine: {
        borderTopWidth: 1,
        borderTopColor: '#000000',
        width: '100%',
        marginBottom: 5,
        height: 40,
    },
    signatureLabel: {
        fontSize: 10,
        color: '#000000',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    directorInfo: {
        fontSize: 9,
        color: '#000000',
        textAlign: 'center',
        marginTop: 2,
    },
    gradeHighlight: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#000000',
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

    // Formatear período académico
    const currentDate = new Date();
    const startDate = new Date(currentDate.getFullYear(), 0, 1); // 1 enero
    const endDate = new Date(currentDate.getFullYear(), 11, 31); // 31 diciembre
    const period = `${formatDate(startDate)} al ${formatDate(endDate)}`;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header institucional */}
                <View style={styles.header}>
                    {/* Logo */}
                    <View style={styles.logoSection}>
                        <Image
                            style={styles.logoImage}
                            src="/src/assets/img/logo_cetec.png"
                        />
                    </View>

                    {/* Información institucional centrada */}
                    <View style={styles.institutionSection}>
                        <Text style={styles.institutionName}>CETEC CUERNAVACA S.C.</Text>
                        <Text style={styles.institutionAddress}>FCO. LEYVA #35 CENTRO</Text>
                        <Text style={styles.institutionContact}>Tel. 312-35-92    R.F.C. CCU-970521-7QB</Text>
                    </View>
                </View>
                
                {/* Título */}
                <Text style={styles.title}>BOLETA DE CALIFICACION</Text>

                {/* Primera fila: NUM. CREDENCIAL + NOMBRE DEL ALUMNO */}
                <View style={styles.formRow}>
                    <View style={[styles.fieldContainer, styles.credentialField]}>
                        <Text style={styles.fieldLabel}>NUM. CREDENCIAL</Text>
                        <View style={styles.fieldBox}>
                            <Text style={styles.fieldValue}>
                                {studentData.primaryRegistrationNumber}
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.fieldContainer, styles.nameField]}>
                        <Text style={styles.fieldLabel}>NOMBRE DEL ALUMNO</Text>
                        <View style={styles.fieldBox}>
                            <Text style={styles.fieldValue}>
                                {`${studentData.name} ${studentData.paternalSurname} ${studentData.maternalSurname || ''}`.toUpperCase()}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Segunda fila: HORARIO + FECHA + PERIODO + CALIFICACION */}
                <View style={styles.formRow}>
                    <View style={[styles.fieldContainer, styles.scheduleField]}>
                        <Text style={styles.fieldLabel}>HORARIO</Text>
                        <View style={styles.fieldBox}>
                            <Text style={styles.fieldValue}>{groupData.schedule}</Text>
                        </View>
                    </View>

                    <View style={[styles.fieldContainer, styles.dateField]}>
                        <Text style={styles.fieldLabel}>FECHA</Text>
                        <View style={styles.fieldBox}>
                            <Text style={styles.fieldValue}>{formatDate(new Date())}</Text>
                        </View>
                    </View>

                    <View style={[styles.fieldContainer, styles.periodField]}>
                        <Text style={styles.fieldLabel}>PERIODO</Text>
                        <View style={styles.fieldBox}>
                            <Text style={styles.fieldValue}>{period}</Text>
                        </View>
                    </View>

                    <View style={[styles.fieldContainer, styles.gradeField]}>
                        <Text style={styles.fieldLabel}>CALIFICACION</Text>
                        <View style={styles.fieldBox}>
                            <Text style={styles.gradeHighlight}>{moduleAverage}</Text>
                        </View>
                    </View>
                </View>

                {/* Tercera fila: MODULO + NOMBRE DEL PROFESOR */}
                <View style={styles.formRow}>
                    <View style={[styles.fieldContainer, styles.moduleField]}>
                        <Text style={styles.fieldLabel}>MODULO</Text>
                        <View style={styles.fieldBox}>
                            <Text style={styles.fieldValue}>{moduleData.name}</Text>
                        </View>
                    </View>

                    <View style={[styles.fieldContainer, styles.teacherField]}>
                        <Text style={styles.fieldLabel}>NOMBRE DEL PROFESOR</Text>
                        <View style={styles.fieldBox}>
                            <Text style={styles.fieldValue}>
                                {groupData.teacherName.toUpperCase()}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Sección de firmas */}
                <View style={styles.signatureSection}>
                    {/* Firma del profesor */}
                    <View style={styles.signatureBox}>
                        <View style={styles.signatureLine}></View>
                        <Text style={styles.signatureLabel}>PROFESOR</Text>
                    </View>

                    {/* Firma del director */}
                    <View style={styles.signatureBox}>
                        <View style={styles.signatureLine}></View>
                        <Text style={styles.signatureLabel}>ING. GIGLIOLA ARLET SÁNCHEZ DÍAZ</Text>
                        <Text style={styles.directorInfo}>Director</Text>
                    </View>

                    {/* Firma del padre o tutor */}
                    <View style={styles.signatureBox}>
                        <View style={styles.signatureLine}></View>
                        <Text style={styles.signatureLabel}>PADRE O TUTOR</Text>
                    </View>
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
                    className="cetec-btn-primary d-flex align-items-center gap-2"
                    disabled={loading}
                    title={`Descargar boleta de ${moduleData.name}`}
                    style={{
                        padding: '8px 12px',
                        fontSize: '0.875rem',
                        minWidth: 'auto',
                        textDecoration: 'none'
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