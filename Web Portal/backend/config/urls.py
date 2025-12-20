from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import index   

urlpatterns = [
    path('', index, name='home'),
    path('admin/', admin.site.urls),

    path('api/v1/', index, name='api_home'),
    path('api/v1/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/v1/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/v1/api-auth/', include('rest_framework.urls')),

    path('api/v1/users/', include('api.accounts.urls')),
    path('api/v1/projects/', include('api.projects.urls')),
    path('api/v1/contacts/', include('api.contacts.urls')),


    
    path('api/v1/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/v1/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]
