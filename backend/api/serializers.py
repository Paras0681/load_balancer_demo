from .models import Payment, Customer, Transaction
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.models import User
from django.db import transaction

# Serializing data required for Token generation
class CustomerTokenPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        customer = getattr(self.user, 'customer', None)
        if customer is None:
            raise serializers.ValidationError(
                'No customer profile linked with this user'
            )
        # data['user'] = {
        #     'id': self.user.id,
        #     'username': self.user.username,
        #     'first_name': customer.first_name,
        #     'last_name': customer.last_name,
        #     'email': customer.email,
        # }
        return data


# Serializer for Register data
class CustomerRegistrationSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only = True)
    password = serializers.CharField(write_only = True, min_length = 8)

    class Meta:
        model = Customer
        fields = ['username', 'password', 'first_name', 'last_name', 'email', 'age']

    def validate_username(self, username):
        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError('Username already taken.')
        return username
    def validate_email(self, email):
        if Customer.objects.filter(email=email).exists():
            raise serializers.ValidationError('Email already exists.')
        return email
    
    @transaction.atomic
    def create(self, validated_data):
        username = validated_data.pop('username')
        password = validated_data.pop('password')

        user = User.objects.create_user(username=username, password=password)
        customer = Customer.objects.create(user=user, **validated_data)
        return customer

# PaymentListSerializer is used for retriving list of Payment objects
class PaymentListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['payment_id', 'amount', 'payment_status', 'created_at']
        read_only_fields = fields

# PaymentDetailSerialzer is used to 
class PaymentDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            'payment_id', 'amount', 'payment_status', 'fraud_score', 
            'payment_method', 'created_at', 'updated_at', 'transactions'
        ]
        read_only_fields = fields


class PaymentCreateSerializer(serializers.ModelSerializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    customer_id = serializers.UUIDField()
    payment_method = serializers.ChoiceField(Payment.PaymentMethod.choices)
    class Meta:
        model = Payment
        fields = ['amount', 'customer_id', 'payment_method']

    @transaction.atomic
    def create(self, validated_data):
        customer_id = validated_data.pop('customer_id')
        customer = Customer.objects.get(customer_id=customer_id)
        payment = Payment.objects.create(
            customer = customer,
            payment_status=Payment.PaymentStatus.PENDING, 
            **validated_data
        )
        Transaction.objects.create(payment=payment)
        return payment