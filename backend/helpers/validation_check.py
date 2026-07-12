from rest_framework import serializers
from django.contrib.auth.models import User
from api.models import Customer

def validate_customer_exists(customer_id):
    if not Customer.objects.filter(customer_id=customer_id).exists():
        raise serializers.ValidationError('No customer found with this ID.')
    return customer_id

def validate_amount_positive(amount):
    if amount <= 0:
        raise serializers.ValidationError('Amount must be greater than zero.')
    return amount

def validate_username_unique(username):
    if User.objects.filter(username=username).exists():
        raise serializers.ValidationError('Username already taken.')
    return username

def validate_email_unique(email):
    if Customer.objects.filter(email=email).exists():
        raise serializers.ValidationError('Email already exists.')
    return email

def validate_age(age):
    if age < 18:
        raise serializers.ValidationError('Customer must be at least 18 years old.')
    if age > 120:
        raise serializers.ValidationError('Enter a valid age.')
    return age