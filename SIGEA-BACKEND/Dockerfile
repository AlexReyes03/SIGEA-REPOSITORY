# Usar OpenJDK 21
FROM openjdk:21-jdk-slim

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos Maven
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .

# Copiar código fuente
COPY src ./src

# Dar permisos de ejecución al mvnw
RUN chmod +x ./mvnw

# Compilar la aplicación
RUN ./mvnw clean package -DskipTests

# Exponer puerto
EXPOSE 8080

# Comando para ejecutar la aplicación
CMD ["java", "-jar", "target/SIGEA-BACKEND-0.0.1-SNAPSHOT.jar"]