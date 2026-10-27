# Workspace Guide

- Backend: Java 21 (LTS) or newer, Spring Boot 3, Spring Data MongoDB with in-memory fallback. Run from `backend/` with `.\mvnw.cmd spring-boot:run`.
- Frontend: React JavaScript with Vite. Run from `frontend/` with `npm run dev`.
- MongoDB is provided locally through the root `docker-compose.yml`.
- Keep API resources under `/api`; configure API origins in `WebConfig`.
- Validate changes with `mvn test` in `backend/` and `npm run build` in `frontend/`.
- Do not commit credentials, tokens, or production connection strings.
