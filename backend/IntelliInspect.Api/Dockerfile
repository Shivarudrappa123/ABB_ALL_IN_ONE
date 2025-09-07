# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY backend/IntelliInspect.Api/IntelliInspect.Api.csproj IntelliInspect.Api/
RUN dotnet restore IntelliInspect.Api/IntelliInspect.Api.csproj
COPY backend/IntelliInspect.Api/ IntelliInspect.Api/
WORKDIR /src/IntelliInspect.Api
RUN dotnet publish -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:5072
EXPOSE 5072
ENTRYPOINT ["dotnet", "IntelliInspect.Api.dll"]
