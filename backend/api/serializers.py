from .models import Payment, Customer, Transaction
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.models import User
from django.db import transaction
from helpers.fraud_check import run_fraud_check
from helpers.validation_check import (
    validate_customer_exists,
    validate_amount_positive,
    validate_age,
    validate_email_unique,
    validate_username_unique,
)


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
    username = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = Customer
        fields = ['username', 'password', 'first_name', 'last_name', 'email', 'age']

    def validate_username(self, value):
        return validate_username_unique(value)

    def validate_email(self, value):
        return validate_email_unique(value)

    def validate_age(self, value):
        return validate_age(value)

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

    def validate_customer_id(self, value):
        return validate_customer_exists(value)

    def validate_amount(self, value):
        return validate_amount_positive(value)

    def validate(self, attrs):
        customer, fraud_score = run_fraud_check(
            attrs['customer_id'], attrs['amount'], attrs['payment_method']
        )
        attrs['_customer'] = customer
        attrs['_fraud_score'] = fraud_score
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        customer = validated_data.pop('_customer')
        fraud_score = validated_data.pop('_fraud_score')
        validated_data.pop('customer_id')

        payment = Payment.objects.create(
            customer=customer,
            payment_status=Payment.PaymentStatus.PENDING,
            fraud_score=fraud_score,
            **validated_data
        )
        Transaction.objects.create(payment=payment)
        return payment
