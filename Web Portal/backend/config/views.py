# config/views.py
from django.http import HttpResponse

def index(request):
    return HttpResponse("""
    <html>
      <head><title>API Home</title></head>
      <body style="font-family: system-ui; margin: 2rem;">
        <h1>Welcome to PermitParse Public API</h1>
        <p>Quick links:</p>
        <ul>
          <li><a href="/api/v1/docs/">Swagger UI</a></li>
          <li><a href="/api/v1/redoc/">ReDoc</a></li>
          <li><a href="/api/v1/schema/">OpenAPI Schema (JSON)</a></li>
          <li><a href="/api/v1/users/">Users API</a></li>
          <li><a href="/api/v1/projects/">Projects API</a></li>
          <li><a href="/api/v1/contacts/">Contacts API</a></li>
          <li><a href="/api/v1/token/">JWT: Obtain Token</a></li>
          <li><a href="/api/v1/token/refresh/">JWT: Refresh Token</a></li>
          <li><a href="/api/v1/api-auth/login/">DRF Login</a></li>
        </ul>
      </body>
    </html>
    """)
