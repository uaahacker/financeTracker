from django.db import models
from django.utils import timezone
from core.models import BaseModel
import json


class Notification(BaseModel):
    """Notification model for in-app, email, and push notifications."""
    
    NOTIFICATION_TYPES = [
        ('PAYMENT_DUE', 'Payment Due'),
        ('PAYMENT_OVERDUE', 'Payment Overdue'),
        ('BUDGET_ALERT', 'Budget Alert'),
        ('BUDGET_EXCEEDED', 'Budget Exceeded'),
        ('INCOME_RECEIVED', 'Income Received'),
        ('INCOME_OVERDUE', 'Income Overdue'),
        ('LOAN_EMI_DUE', 'Loan EMI Due'),
        ('LOAN_EMI_OVERDUE', 'Loan EMI Overdue'),
        ('STATEMENT_READY', 'Statement Ready'),
        ('ACCOUNT_LOW_BALANCE', 'Account Low Balance'),
        ('GOAL_ACHIEVED', 'Goal Achieved'),
        ('TRANSACTION_LARGE', 'Large Transaction'),
        ('SYSTEM_MAINTENANCE', 'System Maintenance'),
        ('SECURITY_ALERT', 'Security Alert'),
        ('GENERAL', 'General'),
    ]
    
    NOTIFICATION_CHANNELS = [
        ('IN_APP', 'In-App'),
        ('EMAIL', 'Email'),
        ('PUSH', 'Push Notification'),
        ('SMS', 'SMS'),
    ]
    
    NOTIFICATION_STATUS = [
        ('PENDING', 'Pending'),
        ('SENT', 'Sent'),
        ('DELIVERED', 'Delivered'),
        ('READ', 'Read'),
        ('FAILED', 'Failed'),
    ]
    
    PRIORITY_LEVELS = [
        ('LOW', 'Low'),
        ('NORMAL', 'Normal'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    ]
    
    # Basic information
    type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    
    # Delivery settings
    channel = models.CharField(max_length=20, choices=NOTIFICATION_CHANNELS, default='IN_APP')
    priority = models.CharField(max_length=10, choices=PRIORITY_LEVELS, default='NORMAL')
    
    # Scheduling
    scheduled_at = models.DateTimeField(default=timezone.now, help_text="When to send the notification")
    expires_at = models.DateTimeField(null=True, blank=True, help_text="When the notification expires")
    
    # Status tracking
    status = models.CharField(max_length=20, choices=NOTIFICATION_STATUS, default='PENDING')
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Delivery attempts
    delivery_attempts = models.PositiveSmallIntegerField(default=0)
    max_attempts = models.PositiveSmallIntegerField(default=3)
    last_attempt_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True, null=True)
    
    # Related data (generic reference)
    related_object_type = models.CharField(max_length=50, blank=True, null=True)
    related_object_id = models.PositiveIntegerField(blank=True, null=True)
    
    # Additional data
    data = models.JSONField(default=dict, help_text="Additional notification data")
    
    # Action buttons (for rich notifications)
    action_buttons = models.JSONField(default=list, help_text="List of action buttons for the notification")
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['user', 'type']),
            models.Index(fields=['user', 'channel']),
            models.Index(fields=['user', 'read_at']),
            models.Index(fields=['scheduled_at', 'status']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.get_type_display()}) - {self.user.username}"
    
    @property
    def is_read(self):
        """Check if notification has been read."""
        return self.read_at is not None
    
    @property
    def is_expired(self):
        """Check if notification has expired."""
        return self.expires_at and self.expires_at < timezone.now()
    
    @property
    def can_retry(self):
        """Check if notification can be retried."""
        return (self.status == 'FAILED' and 
                self.delivery_attempts < self.max_attempts and 
                not self.is_expired)
    
    def mark_as_sent(self):
        """Mark notification as sent."""
        self.status = 'SENT'
        self.sent_at = timezone.now()
        self.save(update_fields=['status', 'sent_at'])
    
    def mark_as_delivered(self):
        """Mark notification as delivered."""
        self.status = 'DELIVERED'
        self.delivered_at = timezone.now()
        self.save(update_fields=['status', 'delivered_at'])
    
    def mark_as_read(self):
        """Mark notification as read."""
        if not self.is_read:
            self.status = 'READ'
            self.read_at = timezone.now()
            self.save(update_fields=['status', 'read_at'])
    
    def mark_as_failed(self, error_message):
        """Mark notification as failed."""
        self.status = 'FAILED'
        self.error_message = error_message
        self.last_attempt_at = timezone.now()
        self.delivery_attempts += 1
        self.save(update_fields=['status', 'error_message', 'last_attempt_at', 'delivery_attempts'])
    
    def retry(self):
        """Retry sending the notification."""
        if self.can_retry:
            self.status = 'PENDING'
            self.error_message = None
            self.save(update_fields=['status', 'error_message'])
            return True
        return False


class NotificationPreference(BaseModel):
    """User notification preferences for different types and channels."""
    
    # Notification type preference
    notification_type = models.CharField(max_length=30, choices=Notification.NOTIFICATION_TYPES)
    
    # Channel preferences
    in_app_enabled = models.BooleanField(default=True)
    email_enabled = models.BooleanField(default=True)
    push_enabled = models.BooleanField(default=True)
    sms_enabled = models.BooleanField(default=False)
    
    # Timing preferences
    quiet_hours_start = models.TimeField(null=True, blank=True, help_text="Start of quiet hours (no notifications)")
    quiet_hours_end = models.TimeField(null=True, blank=True, help_text="End of quiet hours")
    
    # Frequency settings
    digest_frequency = models.CharField(max_length=20, choices=[
        ('IMMEDIATE', 'Immediate'),
        ('HOURLY', 'Hourly'),
        ('DAILY', 'Daily'),
        ('WEEKLY', 'Weekly'),
        ('DISABLED', 'Disabled'),
    ], default='IMMEDIATE')
    
    # Advanced settings
    min_priority = models.CharField(max_length=10, choices=Notification.PRIORITY_LEVELS, default='LOW',
                                   help_text="Minimum priority level to receive notifications")
    
    class Meta:
        unique_together = ['user', 'notification_type']
        ordering = ['notification_type']
    
    def __str__(self):
        return f"{self.user.username} - {self.get_notification_type_display()}"
    
    def should_send_notification(self, notification):
        """Check if notification should be sent based on preferences."""
        # Check if notification type is enabled
        if notification.type != self.notification_type:
            return False
        
        # Check priority level
        priority_order = {'LOW': 0, 'NORMAL': 1, 'HIGH': 2, 'URGENT': 3}
        if priority_order.get(notification.priority, 0) < priority_order.get(self.min_priority, 0):
            return False
        
        # Check quiet hours
        if self.quiet_hours_start and self.quiet_hours_end:
            current_time = timezone.now().time()
            if self.quiet_hours_start <= current_time <= self.quiet_hours_end:
                # Allow urgent notifications during quiet hours
                if notification.priority != 'URGENT':
                    return False
        
        # Check channel availability
        channel_enabled = {
            'IN_APP': self.in_app_enabled,
            'EMAIL': self.email_enabled,
            'PUSH': self.push_enabled,
            'SMS': self.sms_enabled,
        }
        
        return channel_enabled.get(notification.channel, False)


class NotificationTemplate(BaseModel):
    """Template for notification content and formatting."""
    
    name = models.CharField(max_length=100)
    notification_type = models.CharField(max_length=30, choices=Notification.NOTIFICATION_TYPES)
    
    # Template content
    title_template = models.CharField(max_length=200, help_text="Title template with placeholders")
    message_template = models.TextField(help_text="Message template with placeholders")
    
    # Channel-specific templates
    email_subject_template = models.CharField(max_length=200, blank=True, null=True)
    email_html_template = models.TextField(blank=True, null=True)
    push_title_template = models.CharField(max_length=100, blank=True, null=True)
    sms_template = models.CharField(max_length=160, blank=True, null=True)
    
    # Styling (for rich notifications)
    icon = models.CharField(max_length=50, blank=True, null=True)
    color = models.CharField(max_length=7, default='#3B82F6', help_text="Hex color code")
    
    # Action buttons template
    action_buttons_template = models.JSONField(default=list, help_text="Template for action buttons")
    
    # Settings
    is_system = models.BooleanField(default=False, help_text="System templates cannot be modified")
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['user', 'name', 'notification_type']
        ordering = ['notification_type', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.get_notification_type_display()})"
    
    def render(self, context):
        """Render the template with given context data."""
        try:
            title = self.title_template.format(**context)
            message = self.message_template.format(**context)
            
            rendered = {
                'title': title,
                'message': message,
                'icon': self.icon,
                'color': self.color,
            }
            
            # Render channel-specific content
            if self.email_subject_template:
                rendered['email_subject'] = self.email_subject_template.format(**context)
            
            if self.email_html_template:
                rendered['email_html'] = self.email_html_template.format(**context)
            
            if self.push_title_template:
                rendered['push_title'] = self.push_title_template.format(**context)
            
            if self.sms_template:
                rendered['sms_message'] = self.sms_template.format(**context)
            
            # Render action buttons
            if self.action_buttons_template:
                rendered['action_buttons'] = []
                for button in self.action_buttons_template:
                    rendered_button = {}
                    for key, value in button.items():
                        if isinstance(value, str):
                            rendered_button[key] = value.format(**context)
                        else:
                            rendered_button[key] = value
                    rendered['action_buttons'].append(rendered_button)
            
            return rendered
            
        except KeyError as e:
            raise ValueError(f"Missing template variable: {e}")
        except Exception as e:
            raise ValueError(f"Template rendering error: {e}")


class NotificationLog(BaseModel):
    """Log of all notification activities for debugging and analytics."""
    
    LOG_ACTIONS = [
        ('CREATED', 'Created'),
        ('SCHEDULED', 'Scheduled'),
        ('SENT', 'Sent'),
        ('DELIVERED', 'Delivered'),
        ('READ', 'Read'),
        ('FAILED', 'Failed'),
        ('RETRIED', 'Retried'),
        ('EXPIRED', 'Expired'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE, related_name='logs')
    action = models.CharField(max_length=20, choices=LOG_ACTIONS)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # Additional context
    details = models.JSONField(default=dict, help_text="Additional details about the action")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['notification', 'action']),
            models.Index(fields=['action', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.notification.title} - {self.get_action_display()} at {self.timestamp}"
