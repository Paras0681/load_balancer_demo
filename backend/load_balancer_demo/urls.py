from django.contrib import admin
from django.urls import path, include
from api.views import CustomerRegistrationView, CustomerTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView
from monitoring.monitoring import health_check
# from api.views import health_check, metrics

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('api/register/', CustomerRegistrationView.as_view(), name='register'),
    path('api/token/', CustomerTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('health/', health_check, name='health_check'),
    path('', include('django_prometheus.urls'))
]
