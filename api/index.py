from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import os
from datetime import datetime

# ============================================
# SUPABASE CLIENT SETUP
# ============================================

def get_supabase():
    """Initialize Supabase client"""
    try:
        from supabase import create_client
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_KEY')
        
        if not supabase_url or not supabase_key:
            return None
        
        return create_client(supabase_url, supabase_key)
    except Exception as e:
        print(f"Supabase init error: {e}")
        return None

# ============================================
# VERCEL SERVERLESS HANDLER
# ============================================

def handler(environ, start_response):
    """Vercel Python serverless handler"""
    try:
        # Get request details
        path = environ.get('PATH_INFO', '/')
        method = environ.get('REQUEST_METHOD', 'GET')
        
        # Read request body
        content_length = int(environ.get('CONTENT_LENGTH', 0))
        body = environ['wsgi.input'].read(content_length).decode('utf-8') if content_length > 0 else '{}'
        
        # CORS headers
        headers = [
            ('Content-Type', 'application/json'),
            ('Access-Control-Allow-Origin', '*'),
            ('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'),
            ('Access-Control-Allow-Headers', 'Content-Type')
        ]
        
        # Handle OPTIONS (CORS preflight)
        if method == 'OPTIONS':
            start_response('200 OK', headers)
            return [b'']
        
        # Health check
        if path == '/api/health':
            response_data = {
                'status': 'healthy',
                'platform': 'vercel',
                'runtime': 'serverless',
                'supabase': 'connected' if os.getenv('SUPABASE_URL') else 'not configured'
            }
            start_response('200 OK', headers)
            return [json.dumps(response_data).encode()]
        
        # Initialize Supabase
        supabase = get_supabase()
        
        # Login endpoint
        if path == '/api/login' and method == 'POST':
            try:
                data = json.loads(body) if body else {}
                email = data.get('email', '').strip()
                password = data.get('password', '')
                
                if not email or not password:
                    start_response('400 Bad Request', headers)
                    return [json.dumps({'message': 'Email and password required'}).encode()]
                
                if not supabase:
                    start_response('503 Service Unavailable', headers)
                    return [json.dumps({'message': 'Database not configured'}).encode()]
                
                auth_response = supabase.auth.sign_in_with_password({'email': email, 'password': password})
                user = auth_response.user
                session = auth_response.session
                
                if not user:
                    start_response('401 Unauthorized', headers)
                    return [json.dumps({'message': 'Invalid email or password'}).encode()]
                
                shop_name = user.user_metadata.get('shop_name', 'My Dairy Shop') if user.user_metadata else 'My Dairy Shop'
                
                response_data = {
                    'success': True,
                    'user': {'id': user.id, 'email': user.email, 'shop': shop_name},
                    'session': {'access_token': session.access_token, 'refresh_token': session.refresh_token, 'expires_in': session.expires_in}
                }
                start_response('200 OK', headers)
                return [json.dumps(response_data).encode()]
            except Exception as e:
                start_response('500 Internal Server Error', headers)
                return [json.dumps({'message': f'Login failed: {str(e)}'}).encode()]
        
        # Register endpoint
        if path == '/api/register' and method == 'POST':
            try:
                data = json.loads(body) if body else {}
                shop = data.get('shop', '').strip()
                email = data.get('email', '').strip()
                phone = data.get('phone', '').strip()
                password = data.get('password', '')
                
                if not all([shop, email, password]):
                    start_response('400 Bad Request', headers)
                    return [json.dumps({'message': 'Shop name, email and password required'}).encode()]
                
                if len(password) < 6:
                    start_response('400 Bad Request', headers)
                    return [json.dumps({'message': 'Password must be at least 6 characters'}).encode()]
                
                if not supabase:
                    start_response('503 Service Unavailable', headers)
                    return [json.dumps({'message': 'Database not configured'}).encode()]
                
                auth_response = supabase.auth.sign_up({
                    'email': email,
                    'password': password,
                    'options': {'data': {'shop_name': shop, 'phone': phone, 'role': 'owner'}}
                })
                
                user = auth_response.user
                session = auth_response.session
                
                if not user:
                    start_response('500 Internal Server Error', headers)
                    return [json.dumps({'message': 'Registration failed'}).encode()]
                
                response_data = {
                    'success': True,
                    'user': {'id': user.id, 'email': user.email, 'shop': shop, 'phone': phone},
                    'session': {'access_token': session.access_token if session else '', 'refresh_token': session.refresh_token if session else '', 'expires_in': session.expires_in if session else 3600}
                }
                start_response('201 Created', headers)
                return [json.dumps(response_data).encode()]
            except Exception as e:
                error_msg = str(e)
                if 'User already registered' in error_msg:
                    start_response('409 Conflict', headers)
                    return [json.dumps({'message': 'Email already registered. Please login instead.'}).encode()]
                start_response('500 Internal Server Error', headers)
                return [json.dumps({'message': f'Registration failed: {error_msg}'}).encode()]
        
        # Demo login endpoint
        if path == '/api/demo-login' and method == 'POST':
            response_data = {
                'success': True,
                'user': {'id': 'demo_user', 'email': 'demo@milkrecord.in', 'shop': 'Demo Dairy Shop', 'phone': '9876543210'},
                'session': {'access_token': 'demo_token', 'refresh_token': 'demo_refresh', 'expires_in': 86400},
                'is_demo': True
            }
            start_response('200 OK', headers)
            return [json.dumps(response_data).encode()]
        
        # Default: 404
        start_response('404 Not Found', headers)
        return [json.dumps({'error': 'API endpoint not found'}).encode()]
        
    except Exception as e:
        start_response('500 Internal Server Error', [('Content-Type', 'application/json'), ('Access-Control-Allow-Origin', '*')])
        return [json.dumps({'error': str(e)}).encode()]
