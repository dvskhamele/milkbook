"""
MilkRecord - Authentication API with Supabase
Handles login, register, and session management
"""

from flask import Blueprint, request, jsonify
import os
from supabase import create_client, Client
from datetime import datetime, timedelta

auth_bp = Blueprint('auth', __name__)

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_KEY')
)

@auth_bp.route('/api/login', methods=['POST'])
def login():
    """Handle user login with Supabase Auth"""
    try:
        data = request.json
        email = data.get('email', '').strip()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'message': 'Email and password required'}), 400
        
        # Sign in with Supabase Auth
        response = supabase.auth.sign_in_with_password({
            'email': email,
            'password': password
        })
        
        user = response.user
        session = response.session
        
        if not user:
            return jsonify({'message': 'Invalid email or password'}), 401
        
        # Get user metadata (shop name, etc.)
        user_metadata = user.user_metadata or {}
        shop_name = user_metadata.get('shop_name', 'My Dairy Shop')
        
        # Return user info and session
        return jsonify({
            'success': True,
            'user': {
                'id': user.id,
                'email': user.email,
                'shop': shop_name,
                'phone': user_metadata.get('phone', '')
            },
            'session': {
                'access_token': session.access_token,
                'refresh_token': session.refresh_token,
                'expires_in': session.expires_in,
                'expires_at': session.expires_at
            }
        }), 200
        
    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({'message': f'Login failed: {str(e)}'}), 500

@auth_bp.route('/api/register', methods=['POST'])
def register():
    """Handle user registration with Supabase Auth"""
    try:
        data = request.json
        shop = data.get('shop', '').strip()
        email = data.get('email', '').strip()
        phone = data.get('phone', '').strip()
        password = data.get('password', '')
        
        if not all([shop, email, password]):
            return jsonify({'message': 'Shop name, email and password required'}), 400
        
        if len(password) < 6:
            return jsonify({'message': 'Password must be at least 6 characters'}), 400
        
        # Sign up with Supabase Auth
        response = supabase.auth.sign_up({
            'email': email,
            'password': password,
            'options': {
                'data': {
                    'shop_name': shop,
                    'phone': phone,
                    'role': 'owner',
                    'created_at': datetime.utcnow().isoformat()
                }
            }
        })
        
        user = response.user
        session = response.session
        
        if not user:
            return jsonify({'message': 'Registration failed'}), 500
        
        # Return user info and session
        return jsonify({
            'success': True,
            'user': {
                'id': user.id,
                'email': user.email,
                'shop': shop,
                'phone': phone
            },
            'session': {
                'access_token': session.access_token if session else '',
                'refresh_token': session.refresh_token if session else '',
                'expires_in': session.expires_in if session else 3600,
                'expires_at': session.expires_at if session else ''
            }
        }), 201
        
    except Exception as e:
        print(f"Registration error: {str(e)}")
        error_msg = str(e)
        
        # Handle common errors
        if 'User already registered' in error_msg:
            return jsonify({'message': 'Email already registered. Please login instead.'}), 409
        
        return jsonify({'message': f'Registration failed: {error_msg}'}), 500

@auth_bp.route('/api/logout', methods=['POST'])
def logout():
    """Handle user logout"""
    try:
        # Get token from request
        token = request.json.get('token', '') if request.json else ''
        
        if token:
            # Sign out from Supabase
            supabase.auth.sign_out(token)
        
        return jsonify({'success': True, 'message': 'Logged out successfully'}), 200
        
    except Exception as e:
        print(f"Logout error: {str(e)}")
        return jsonify({'message': 'Logout failed'}), 500

@auth_bp.route('/api/session', methods=['GET'])
def get_session():
    """Get current user session"""
    try:
        # Get token from headers
        auth_header = request.headers.get('Authorization', '')
        
        if not auth_header.startswith('Bearer '):
            return jsonify({'authenticated': False}), 401
        
        token = auth_header.replace('Bearer ', '')
        
        # Get user from token
        user = supabase.auth.get_user(token)
        
        if not user:
            return jsonify({'authenticated': False}), 401
        
        user_metadata = user.user_metadata or {}
        
        return jsonify({
            'authenticated': True,
            'user': {
                'id': user.id,
                'email': user.email,
                'shop': user_metadata.get('shop_name', 'My Dairy Shop'),
                'phone': user_metadata.get('phone', ''),
                'role': user_metadata.get('role', 'owner')
            }
        }), 200
        
    except Exception as e:
        print(f"Session check error: {str(e)}")
        return jsonify({'authenticated': False, 'error': str(e)}), 401

@auth_bp.route('/api/demo-login', methods=['POST'])
def demo_login():
    """Handle demo account login"""
    try:
        # Demo credentials
        demo_email = 'demo@milkrecord.in'
        demo_password = 'demo123'
        
        return jsonify({
            'success': True,
            'user': {
                'id': 'demo_user',
                'email': demo_email,
                'shop': 'Demo Dairy Shop',
                'phone': '9876543210'
            },
            'session': {
                'access_token': 'demo_token',
                'refresh_token': 'demo_refresh',
                'expires_in': 86400,
                'expires_at': (datetime.utcnow() + timedelta(days=1)).isoformat()
            },
            'is_demo': True
        }), 200
        
    except Exception as e:
        print(f"Demo login error: {str(e)}")
        return jsonify({'message': 'Demo login failed'}), 500
