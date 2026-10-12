# ---------- Etapa 1: compilar ----------
FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /workspace

COPY pom.xml .
RUN mvn -B -q dependency:go-offline

COPY src ./src
RUN mvn -B -q -DskipTests package \
  && cp target/*.jar app.jar

FROM eclipse-temurin:25-jre

WORKDIR /app

RUN groupadd --system --gid 1001 spring \
  && useradd --system --uid 1001 --gid spring spring

COPY --from=build /workspace/app.jar /app/app.jar

USER 1001

ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError -Djava.security.egd=file:/dev/./urandom"

EXPOSE 8080 8081

ENTRYPOINT ["java", "-jar", "/app/app.jar"]