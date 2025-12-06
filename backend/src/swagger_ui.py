DARK_SWAGGER_HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>Fitness Management System API - Docs</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
    <style>
        body { background-color: #1a1a1a !important; }
        .swagger-ui { background-color: #1a1a1a; }
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info .title, .swagger-ui .info p, .swagger-ui .info li, .swagger-ui .info a { color: #e0e0e0; }
        .swagger-ui .opblock-tag { color: #e0e0e0 !important; border-bottom-color: #333; }
        .swagger-ui .opblock .opblock-summary-description { color: #bbb; }
        .swagger-ui .opblock .opblock-section-header { background: #2a2a2a; }
        .swagger-ui .opblock .opblock-section-header h4 { color: #e0e0e0; }
        .swagger-ui .opblock-body pre.microlight { background: #0a0a0a !important; color: #e0e0e0 !important; }
        .swagger-ui .scheme-container { background: #1a1a1a; box-shadow: none; }
        .swagger-ui section.models { border-color: #333; }
        .swagger-ui section.models h4 { color: #e0e0e0; }
        .swagger-ui .model-title { color: #e0e0e0; }
        .swagger-ui .model { color: #bbb; }
        .swagger-ui table thead tr th { color: #e0e0e0; border-bottom-color: #333; }
        .swagger-ui .parameter__name, .swagger-ui .parameter__type { color: #e0e0e0; }
        .swagger-ui .response-col_status { color: #e0e0e0; }
        .swagger-ui .response-col_description { color: #bbb; }
        .swagger-ui .btn { border-color: #555; color: #e0e0e0; background: transparent; }
        .swagger-ui select { background: #2a2a2a; color: #e0e0e0; border-color: #555; }
        .swagger-ui input { background: #2a2a2a; color: #e0e0e0; border-color: #555; }
        .swagger-ui textarea { background: #2a2a2a; color: #e0e0e0; border-color: #555; }
        .swagger-ui .opblock-summary { border-color: #333; }
        .swagger-ui .opblock-summary-path { color: #86efac !important; }
        .swagger-ui .parameter__name.required span { color: #fb923c !important; }
        .swagger-ui .parameter__name.required::after { color: #fb923c !important; }
        .swagger-ui .tab li { color: #c0c0c0 !important; }
        .swagger-ui .tab li.active { color: #e0e0e0 !important; }
        .swagger-ui .opblock-description-wrapper p { color: #c0c0c0; }
        .swagger-ui .opblock-external-docs-wrapper p { color: #c0c0c0; }
        .swagger-ui .responses-inner h4, .swagger-ui .responses-inner h5 { color: #c0c0c0 !important; }
        .swagger-ui .response-col_links { color: #c0c0c0; }
        .swagger-ui .model-box { background: #2a2a2a; }
        .swagger-ui .prop-type { color: #93c5fd !important; }
        .swagger-ui .prop-format { color: #a0a0a0 !important; }
        .swagger-ui .loading-container .loading::after { color: #e0e0e0; }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
        SwaggerUIBundle({
            url: "/openapi.json",
            dom_id: '#swagger-ui',
            presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
            layout: "BaseLayout",
            syntaxHighlight: { theme: "monokai" },
            docExpansion: "list"
        });
    </script>
</body>
</html>
"""

