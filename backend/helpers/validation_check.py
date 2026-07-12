from rest_framework.exceptions import ValidationError

def validate_payment(data):
    """
    Validate payment request before fraud checks.
    """
    amount = data.get("amount")
    age = data.get("age")
    if amount is None:
        raise ValidationError("Amount is required.")
    if amount <= 0:
        raise ValidationError("Amount must be greater than 0.")
    if age is None:
        raise ValidationError("Age is required.")
    if age < 18:
        raise ValidationError("Customer must be at least 18 years old.")
    return True