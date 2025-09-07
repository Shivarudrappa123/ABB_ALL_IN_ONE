using System.Net.Http.Headers;
using System.Text;
using Microsoft.AspNetCore.Http.HttpResults;

var builder = WebApplication.CreateBuilder(args);

// Minimal services
var pythonApiBase = builder.Configuration["PythonApi:BaseUrl"] ?? "http://localhost:7000";

builder.Services.AddHttpClient("python", client =>
{
	client.BaseAddress = new Uri(pythonApiBase);
	client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
});

builder.Services.AddCors(options =>
{
	options.AddPolicy("AllowAll", policy =>
	{
		policy.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin();
	});
});

var app = builder.Build();

app.UseCors("AllowAll");

app.MapGet("/api/health", () => Results.Ok(new { status = "ok", backend = "dotnet" }));

// Proxy: Simulation controls
app.MapPost("/api/simulation/start", async (IHttpClientFactory httpFactory) =>
{
	var client = httpFactory.CreateClient("python");
	var resp = await client.PostAsync("/api/simulation/start", null);
	var body = await resp.Content.ReadAsStringAsync();
	return TypedResults.Content(body, contentType: "application/json", statusCode: (int)resp.StatusCode);
});

app.MapPost("/api/simulation/stop", async (IHttpClientFactory httpFactory) =>
{
	var client = httpFactory.CreateClient("python");
	var resp = await client.PostAsync("/api/simulation/stop", null);
	var body = await resp.Content.ReadAsStringAsync();
	return TypedResults.Content(body, contentType: "application/json", statusCode: (int)resp.StatusCode);
});

app.MapPost("/api/simulation/clear", async (IHttpClientFactory httpFactory) =>
{
	var client = httpFactory.CreateClient("python");
	var resp = await client.PostAsync("/api/simulation/clear", null);
	var body = await resp.Content.ReadAsStringAsync();
	return TypedResults.Content(body, contentType: "application/json", statusCode: (int)resp.StatusCode);
});

app.MapGet("/api/simulation/next", async (IHttpClientFactory httpFactory) =>
{
	var client = httpFactory.CreateClient("python");
	var resp = await client.GetAsync("/api/simulation/next");
	var body = await resp.Content.ReadAsStringAsync();
	return TypedResults.Content(body, contentType: "application/json", statusCode: (int)resp.StatusCode);
});

// Proxy: GET /api/upload/metadata
app.MapGet("/api/upload/metadata", async (IHttpClientFactory httpFactory) =>
{
	var client = httpFactory.CreateClient("python");
	var resp = await client.GetAsync("/api/upload/metadata");
	var body = await resp.Content.ReadAsStringAsync();
	var contentType = resp.Content.Headers.ContentType?.ToString() ?? "application/json";
	return TypedResults.Content(body, contentType: contentType, statusCode: (int)resp.StatusCode);
});

// Proxy: POST /api/upload/dataset
app.MapPost("/api/upload/dataset", async (HttpRequest request, IHttpClientFactory httpFactory) =>
{
	if (!request.HasFormContentType)
	{
		return Results.BadRequest(new { detail = "multipart/form-data expected" });
	}
	var form = await request.ReadFormAsync();
	var file = form.Files["file"];
	if (file == null) return Results.BadRequest(new { detail = "file field is required" });

	using var content = new MultipartFormDataContent();
	await using var stream = file.OpenReadStream();
	var fileContent = new StreamContent(stream);
	fileContent.Headers.ContentType = new MediaTypeHeaderValue(file.ContentType);
	content.Add(fileContent, "file", file.FileName);

	var client = httpFactory.CreateClient("python");
	var resp = await client.PostAsync("/api/upload/dataset", content);
	var body = await resp.Content.ReadAsStringAsync();
	var contentType = resp.Content.Headers.ContentType?.ToString() ?? "application/json";
	return TypedResults.Content(body, contentType: contentType, statusCode: (int)resp.StatusCode);
});

// Proxy: POST /api/dateranges/validate
app.MapPost("/api/dateranges/validate", async (HttpRequest request, IHttpClientFactory httpFactory) =>
{
	using var sr = new StreamReader(request.Body);
	var json = await sr.ReadToEndAsync();
	var client = httpFactory.CreateClient("python");
	var resp = await client.PostAsync("/api/dateranges/validate", new StringContent(json, Encoding.UTF8, "application/json"));
	var body = await resp.Content.ReadAsStringAsync();
	var contentType = resp.Content.Headers.ContentType?.ToString() ?? "application/json";
	return TypedResults.Content(body, contentType: contentType, statusCode: (int)resp.StatusCode);
});

// Proxy: GET /api/dateranges/summary.png
app.MapGet("/api/dateranges/summary.png", async (IHttpClientFactory httpFactory) =>
{
	var client = httpFactory.CreateClient("python");
	var resp = await client.GetAsync("/api/dateranges/summary.png");
	var bytes = await resp.Content.ReadAsByteArrayAsync();
	var contentType = resp.Content.Headers.ContentType?.ToString() ?? "image/png";
	return Results.File(bytes, contentType: contentType, fileDownloadName: null, enableRangeProcessing: false, lastModified: null, entityTag: null);
});

// Proxy: POST /api/train
app.MapPost("/api/train", async (HttpRequest request, IHttpClientFactory httpFactory) =>
{
	using var sr = new StreamReader(request.Body);
	var json = await sr.ReadToEndAsync();
	var client = httpFactory.CreateClient("python");
	var resp = await client.PostAsync("/api/train", new StringContent(json, Encoding.UTF8, "application/json"));
	var body = await resp.Content.ReadAsStringAsync();
	var contentType = resp.Content.Headers.ContentType?.ToString() ?? "application/json";
	return TypedResults.Content(body, contentType: contentType, statusCode: (int)resp.StatusCode);
});

// Proxy: GET /api/training/metrics
app.MapGet("/api/training/metrics", async (IHttpClientFactory httpFactory) =>
{
	var client = httpFactory.CreateClient("python");
	var resp = await client.GetAsync("/api/training/metrics");
	var body = await resp.Content.ReadAsStringAsync();
	var contentType = resp.Content.Headers.ContentType?.ToString() ?? "application/json";
	return TypedResults.Content(body, contentType: contentType, statusCode: (int)resp.StatusCode);
});

// Proxy: GET /api/training/status
app.MapGet("/api/training/status", async (IHttpClientFactory httpFactory) =>
{
	var client = httpFactory.CreateClient("python");
	var resp = await client.GetAsync("/api/training/status");
	var body = await resp.Content.ReadAsStringAsync();
	var contentType = resp.Content.Headers.ContentType?.ToString() ?? "application/json";
	return TypedResults.Content(body, contentType: contentType, statusCode: (int)resp.StatusCode);
});

// Proxy: GET /api/training/confusion-matrix.png
app.MapGet("/api/training/confusion-matrix.png", async (IHttpClientFactory httpFactory) =>
{
	var client = httpFactory.CreateClient("python");
	var resp = await client.GetAsync("/api/training/confusion-matrix.png");
	var bytes = await resp.Content.ReadAsByteArrayAsync();
	var contentType = resp.Content.Headers.ContentType?.ToString() ?? "image/png";
	return Results.File(bytes, contentType: contentType);
});

// Proxy: GET /api/training/roc.png
app.MapGet("/api/training/roc.png", async (IHttpClientFactory httpFactory) =>
{
	var client = httpFactory.CreateClient("python");
	var resp = await client.GetAsync("/api/training/roc.png");
	var bytes = await resp.Content.ReadAsByteArrayAsync();
	var contentType = resp.Content.Headers.ContentType?.ToString() ?? "image/png";
	return Results.File(bytes, contentType: contentType);
});

app.Run();
