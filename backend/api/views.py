from django.shortcuts import render
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomerTokenPairSerializer, CustomerRegistrationSerializer, PaymentListSerializer, PaymentDetailSerializer, PaymentCreateSerializer
from .models import Payment
from rest_framework.generics import CreateAPIView
from rest_framework.response import Response
from rest_framework import status

# CustomerTokenObtainPairView is basic access token refresh token view.
class CustomerTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomerTokenPairSerializer

# CustomerRegistrationView is basic Register view. 
class CustomerRegistrationView(CreateAPIView):
    serializer_class = CustomerRegistrationSerializer
    permission_classes = [AllowAny]

# PaymentViewSet has all the logic for creating, fetching list wise or detailed Payment entities.
class PaymentViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    lookup_field = 'payment_id'
    # lookup_value_regex = '[0-9a-f-]{36}'
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
        return queryset
    
    def create(self, request, *args, **kwargs):
        write_serializer = self.get_serializer(data=request.data)
        write_serializer.is_valid(raise_exception=True)
        payment = write_serializer.save()
        read_serializer = PaymentDetailSerializer(payment)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)
