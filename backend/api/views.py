from django.shortcuts import render
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomerTokenPairSerializer, CustomerRegistrationSerializer, PaymentListSerializer, PaymentDetailSerializer, PaymentCreateSerializer
from .models import Payment
from rest_framework.generics import CreateAPIView

class CustomerTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomerTokenPairSerializer

class CustomerRegistrationView(CreateAPIView):
    serializer_class = CustomerRegistrationSerializer
    permission_classes = [AllowAny]

# PaymentViewSet has all the logic for creating, fetching list wise or detailed Payments related data
class PaymentViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    filterset_fields = ['customer_id', 'payment_method', 'status']
    search_fields = ['customer_id', 'transaction_id']
    ordering_fields = ['created_at', 'amount']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return PaymentListSerializer
        if self.action == 'create':
            return PaymentCreateSerializer
        else:
            return PaymentDetailSerializer

    def get_queryset(self):
        queryset = Payment.objects.all().order_by('-created_at')
        if self.action == 'list':
            queryset = queryset.only(
                'payment_id', 'amount', 'payment_status', 'created_at'
            )
        elif self.action == 'retrieve':
            queryset = queryset.all()

        return queryset