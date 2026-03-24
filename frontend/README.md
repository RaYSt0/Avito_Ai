# Frontend (Vite + React + TypeScript)

Это клиентская часть проекта. Полная инструкция по запуску backend, Ollama и браузера — в **[корневом README.md](../README.md)**.

Кратко:

```bash
npm install
npm run dev
```

Откройте http://localhost:5173/ads (корень `/` редиректит на список объявлений).

Убедитесь, что backend слушает порт **8080** (см. `src/api.ts`), а Ollama — **localhost:11434** для AI-кнопок на странице редактирования.
