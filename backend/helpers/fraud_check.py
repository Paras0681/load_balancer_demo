from django.utils import timezone
from datetime import timedelta
from rest_framework import serializers
from api.models import Payment, Customer

FRAUD_THRESHOLD = 80  # percent


def calculate_fraud_score(customer, amount, payment_method):
    score = 0
    if amount >= 100000:
        score += 50
    elif amount >= 50000:
        score += 30
    recent_count = Payment.objects.filter(
        customer=customer,
        created_at__gte=timezone.now() - timedelta(minutes=10)
    ).count()
    if recent_count >= 5:
        score += 40
    elif recent_count >= 3:
        score += 20
    if payment_method == Payment.PaymentMethod.PAYMENT_LINK:
        score += 10
    return min(score, 100)


def is_fraudulent(score):
    return score > FRAUD_THRESHOLD


def run_fraud_check(customer_id, amount, payment_method):
    """
    Looks up the customer, scores the transaction, and raises if fraudulent.
    Returns (customer, fraud_score) for reuse in create().
    """
    customer = Customer.objects.get(customer_id=customer_id)
    score = calculate_fraud_score(customer, amount, payment_method)
    if is_fraudulent(score):
        raise serializers.ValidationError('Transaction flagged as high risk and rejected.')
    return customer, score