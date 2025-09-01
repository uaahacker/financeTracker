from django.shortcuts import render
from django.http import HttpResponse
from django.views.generic import TemplateView
from django.conf import settings
import os

def frontend_view(request):
    """Serve the frontend HTML file"""
    frontend_path = os.path.join(settings.BASE_DIR, 'frontend', 'index.html')
    
    try:
        with open(frontend_path, 'r', encoding='utf-8') as file:
            content = file.read()
        return HttpResponse(content, content_type='text/html')
    except FileNotFoundError:
        return HttpResponse('Frontend not found', status=404)

class FrontendView(TemplateView):
    """Alternative class-based view for frontend"""
    def get(self, request, *args, **kwargs):
        return frontend_view(request)
