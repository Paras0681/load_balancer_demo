from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid


class Customer(models.Model):
    """
    A customer is an entity in the database that stores the customer data who makes the payment transactions.
    Each customer has a unique customer_id and email can have multiple payments.

    Relationships:
    - Has many Payment records (payments).
    - Has many Transaction records (transactions).
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='customer')
    customer_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    email = models.EmailField(null=False, unique=True)
    age = models.IntegerField(null=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = "customers"
        verbose_name = "Customer"
        verbose_name_plural = "Customers"
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['customer_id']),
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name}: {self.email}"

class Payment(models.Model):
    """
    A Payment is an entity in the database that stores the payment related data on multiple transactions.
    One payment can have multiple transactions attempts(retries).
    Status flow: pending>success/failed/fraud_blocked

    Relationships:
    - One Payment can have many Transaction records (One to Many).
    """
    class PaymentMethod(models.TextChoices):
        CARD = 'card'
        UPI= 'upi'
        BANK_TRANSFER= 'bank_transfer'
        PAYMENT_LINK = 'payment_link'
    class PaymentStatus(models.TextChoices):
        PENDING = 'pending'
        SUCCESS= 'success'
        FAILED= 'failed'
        FRAUD_BLOCKED = 'fraud_blocked'
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='payments')
    payment_id = models.UUIDField(null=False, default=uuid.uuid4, editable=False, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices)
    payment_status = models.CharField(max_length=20, choices=PaymentStatus.choices)
    fraud_score = models.FloatField(null=True,blank=True)
    error_message = models.TextField(null=True,blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payments'
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'
        indexes = [
            models.Index(fields=['customer', 'payment_status']),
            models.Index(fields=['payment_id']),
            models.Index(fields=['payment_status']),
        ]

    def __str__(self):
        return f"{self.payment_id}: {self.amount} ({self.payment_status})"

class Transaction(models.Model):
    """
    Transaction is a payment attempt for a payment.
    This helps to get the audit trails of all payment attempts i.e(transactions) made for a payment. 
    
    Relationships:
    - Multiple transactions can have one payment records (Many to One).
    """
    class TransactionStatus(models.TextChoices):
        PENDING = 'pending'
        SUCCESS= 'success'
        FAILED= 'failed'
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='transactions')
    transaction_id = models.UUIDField(null=False, default=uuid.uuid4, editable=False, unique=True)
    transaction_date = models.DateTimeField(default=timezone.now, editable=False)
    transaction_status = models.CharField(max_length=20, choices=TransactionStatus.choices, default=TransactionStatus.PENDING)

    class Meta:
        db_table = 'transactions'
        verbose_name = 'Transaction'
        verbose_name_plural = 'Transactions'
        indexes = [
            models.Index(fields=['payment', 'transaction_status']),
            models.Index(fields=['-transaction_date']),
            models.Index(fields=['transaction_id']),
        ]

    def __str__(self):
        return f"{self.transaction_id} {self.transaction_status}: {self.transaction_date}"