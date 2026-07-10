from django.urls import include, path
from api.views import PaymentViewSet
from rest_framework.routers import DefaultRouter  

router = DefaultRouter()
router.register(r'payments', PaymentViewSet, basename="payment")

urlpatterns = [
    path("", include(router.urls)),
]