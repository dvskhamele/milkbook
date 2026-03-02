"""
MilkRecord POS - Vercel Serverless API
Handles authentication and API endpoints with Supabase
"""

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

def handler(request, response):
    """Vercel serverless handler - serves API endpoints"""
    try:
        # Get request details from Vercel
        path = request.get('path', '/')
        method = request.get('method', 'GET')
        body = request.get('body', '{}')
        
        # CORS headers
        cors_headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
        
        # Handle OPTIONS (CORS preflight)
        if method == 'OPTIONS':
            return {'statusCode': 200, 'headers': cors_headers, 'body': ''}
        
        # Health check
        if path == '/api/health':
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({
                    'status': 'healthy',
                    'platform': 'vercel',
                    'runtime': 'serverless',
                    'supabase': 'connected' if os.getenv('SUPABASE_URL') else 'not configured'
                })
            }
        
        # Initialize Supabase
        supabase = get_supabase()
        
        # Login endpoint
        if path == '/api/login' and method == 'POST':
            try:
                data = json.loads(body) if body else {}
                email = data.get('email', '').strip()
                password = data.get('password', '')
                
                if not email or not password:
                    return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'message': 'Email and password required'})}
                
                if not supabase:
                    return {'statusCode': 503, 'headers': cors_headers, 'body': json.dumps({'message': 'Database not configured'})}
                
                auth_response = supabase.auth.sign_in_with_password({'email': email, 'password': password})
                user = auth_response.user
                session = auth_response.session
                
                if not user:
                    return {'statusCode': 401, 'headers': cors_headers, 'body': json.dumps({'message': 'Invalid email or password'})}
                
                shop_name = user.user_metadata.get('shop_name', 'My Dairy Shop') if user.user_metadata else 'My Dairy Shop'
                
                return {
                    'statusCode': 200,
                    'headers': cors_headers,
                    'body': json.dumps({
                        'success': True,
                        'user': {'id': user.id, 'email': user.email, 'shop': shop_name},
                        'session': {'access_token': session.access_token, 'refresh_token': session.refresh_token, 'expires_in': session.expires_in}
                    })
                }
            except Exception as e:
                return {'statusCode': 500, 'headers': cors_headers, 'body': json.dumps({'message': f'Login failed: {str(e)}'})}
        
        # Register endpoint
        if path == '/api/register' and method == 'POST':
            try:
                data = json.loads(body) if body else {}
                shop = data.get('shop', '').strip()
                email = data.get('email', '').strip()
                phone = data.get('phone', '').strip()
                password = data.get('password', '')
                
                if not all([shop, email, password]):
                    return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'message': 'Shop name, email and password required'})}
                
                if len(password) < 6:
                    return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'message': 'Password must be at least 6 characters'})}
                
                if not supabase:
                    return {'statusCode': 503, 'headers': cors_headers, 'body': json.dumps({'message': 'Database not configured'})}
                
                auth_response = supabase.auth.sign_up({
                    'email': email,
                    'password': password,
                    'options': {'data': {'shop_name': shop, 'phone': phone, 'role': 'owner'}}
                })
                
                user = auth_response.user
                session = auth_response.session
                
                if not user:
                    return {'statusCode': 500, 'headers': cors_headers, 'body': json.dumps({'message': 'Registration failed'})}
                
                return {
                    'statusCode': 201,
                    'headers': cors_headers,
                    'body': json.dumps({
                        'success': True,
                        'user': {'id': user.id, 'email': user.email, 'shop': shop, 'phone': phone},
                        'session': {'access_token': session.access_token if session else '', 'refresh_token': session.refresh_token if session else '', 'expires_in': session.expires_in if session else 3600}
                    })
                }
            except Exception as e:
                error_msg = str(e)
                if 'User already registered' in error_msg:
                    return {'statusCode': 409, 'headers': cors_headers, 'body': json.dumps({'message': 'Email already registered. Please login instead.'})}
                return {'statusCode': 500, 'headers': cors_headers, 'body': json.dumps({'message': f'Registration failed: {error_msg}'})}
        
        # Demo login endpoint
        if path == '/api/demo-login' and method == 'POST':
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({
                    'success': True,
                    'user': {'id': 'demo_user', 'email': 'demo@milkrecord.in', 'shop': 'Demo Dairy Shop', 'phone': '9876543210'},
                    'session': {'access_token': 'demo_token', 'refresh_token': 'demo_refresh', 'expires_in': 86400},
                    'is_demo': True
                })
            }
        
        # Default: 404
        return {'statusCode': 404, 'headers': cors_headers, 'body': json.dumps({'error': 'API endpoint not found'})}
        
    except Exception as e:
        return {'statusCode': 500, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': str(e)})}
