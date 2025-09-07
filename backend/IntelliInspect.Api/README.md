# IntelliInspect .NET 8 API (Proxy)

An ASP.NET Core 8 Web API that proxies the Python FastAPI training service, exposing the same endpoints for the Angular frontend.

## Endpoints

- GET `/api/health`
- POST `/api/upload/dataset` (multipart/form-data `file`)
- GET `/api/upload/metadata`
- POST `/api/dateranges/validate`
- POST `/api/train`

## Configuration

Set the FastAPI base URL in `appsettings.json`:

```json
{
  "PythonApi": { "BaseUrl": "http://localhost:7000" }
}
```

## Run

```bash
cd backend/IntelliInspect.Api
# build
dotnet build
# run
dotnet run
```

The API will listen on `http://localhost:5072` (or another Kestrel port). Update the frontend proxy (`frontend/proxy.config.json`) to point to this port if you want the Angular app to use the .NET API:

```json
{
  "/api": { "target": "http://localhost:5072", "secure": false, "changeOrigin": true }
}
```
