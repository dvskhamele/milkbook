"""
MilkRecord POS - Vercel Serverless Entry Point
Serves static files and API endpoints
"""

import json
import os
from urllib.parse import urlparse

# ============================================
# VERCEL SERVERLESS HANDLER
# ============================================

def handler(request, response):
    """Vercel serverless handler - serves static files and API"""
    try:
        # Get request details from Vercel
        path = request.get('path', '/')
        method = request.get('method', 'GET')
        
        # Health check endpoint
        if path == '/api/health':
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'status': 'healthy',
                    'platform': 'vercel',
                    'runtime': 'serverless',
                    'supabase': 'connected' if os.getenv('SUPABASE_URL') else 'not configured',
                    'timestamp': __import__('datetime').datetime.now().isoformat()
                })
            }
        
        # API routes
        if path.startswith('/api/'):
            return {
                'statusCode': 501,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'API endpoints require Flask server',
                    'message': 'This is a static deployment. Use Supabase client directly.'
                })
            }
        
        # Static file routes - determine file path
        file_path = None
        
        # Route: /js/* -> js folder
        if path.startswith('/js/'):
            file_path = path[1:]  # Remove leading /
        
        # Route: /apps/* -> apps folder
        elif path.startswith('/apps/'):
            file_path = path[1:]  # Remove leading /
        
        # Route: /*.html -> apps folder
        elif path.endswith('.html'):
            file_path = f'apps{path}'
        
        # Route: /*.css -> try root first, then apps folder
        elif path.endswith('.css'):
            root_css = path[1:]  # Remove leading /
            apps_css = f'apps{path}'
            if os.path.exists(root_css):
                file_path = root_css
            elif os.path.exists(apps_css):
                file_path = apps_css
            else:
                file_path = root_css  # Will trigger 404
        
        # Route: /*.js -> try root first, then js folder
        elif path.endswith('.js'):
            root_js = path[1:]
            js_folder = f'js{path}'
            if os.path.exists(root_js):
                file_path = root_js
            elif os.path.exists(js_folder):
                file_path = js_folder
            else:
                file_path = root_js
        
        # Route: /pos, /collection, etc. -> specific HTML files
        elif path == '/':
            file_path = 'apps/index.html'
        elif path == '/pos':
            file_path = 'apps/dairy-pos-billing-software-india.html'
        elif path == '/collection':
            file_path = 'apps/collection.html'
        elif path == '/farmers':
            file_path = 'apps/farmer-management-milk-collection-centers.html'
        elif path == '/customers':
            file_path = 'apps/customer-ledger-udhar-tracking-dairy.html'
        elif path == '/inventory':
            file_path = 'apps/inventory.html'
        elif path == '/reports':
            file_path = 'apps/reports-dashboard.html'
        elif path == '/settings':
            file_path = 'apps/settings.html'
        
        # Route: images and other assets
        elif path.endswith(('.png', '.jpg', '.jpeg', '.svg', '.ico', '.gif', '.webp')):
            root_asset = path[1:]
            apps_asset = f'apps{path}'
            if os.path.exists(root_asset):
                file_path = root_asset
            elif os.path.exists(apps_asset):
                file_path = apps_asset
            else:
                file_path = root_asset
        
        # Route: fonts
        elif path.endswith(('.woff', '.woff2', '.ttf', '.eot')):
            root_font = path[1:]
            apps_font = f'apps{path}'
            if os.path.exists(root_font):
                file_path = root_font
            elif os.path.exists(apps_font):
                file_path = apps_font
            else:
                file_path = root_font
        
        # Default: try apps folder
        else:
            file_path = f'apps{path}'
        
        # Try to read and serve the file
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Determine content type based on file extension
            content_type = 'text/html'
            if file_path.endswith('.css'):
                content_type = 'text/css'
            elif file_path.endswith('.js'):
                content_type = 'application/javascript'
            elif file_path.endswith('.json'):
                content_type = 'application/json'
            elif file_path.endswith('.png'):
                content_type = 'image/png'
            elif file_path.endswith('.jpg') or file_path.endswith('.jpeg'):
                content_type = 'image/jpeg'
            elif file_path.endswith('.svg'):
                content_type = 'image/svg+xml'
            elif file_path.endswith('.ico'):
                content_type = 'image/x-icon'
            elif file_path.endswith('.gif'):
                content_type = 'image/gif'
            elif file_path.endswith('.webp'):
                content_type = 'image/webp'
            elif file_path.endswith('.woff'):
                content_type = 'font/woff'
            elif file_path.endswith('.woff2'):
                content_type = 'font/woff2'
            elif file_path.endswith('.ttf'):
                content_type = 'font/ttf'
            elif file_path.endswith('.eot'):
                content_type = 'application/vnd.ms-fontobject'
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': content_type,
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'public, max-age=3600'
                },
                'body': content
            }
        
        except FileNotFoundError:
            # Try fallback: if path doesn't start with /, try apps folder
            if not path.startswith('/'):
                fallback = f'apps/{path}'
            else:
                fallback = f'apps{path}'
            
            try:
                with open(fallback, 'r', encoding='utf-8') as f:
                    content = f.read()
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'text/html',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': content
                }
            except:
                pass
            
            # File not found
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'text/html',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': '<h1>404 - File Not Found</h1><p>The requested file could not be found.</p>'
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }
