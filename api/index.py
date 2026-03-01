"""
MilkRecord POS - Vercel Serverless Entry Point
Serves static files and API endpoints
"""

import json
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Import Flask app for API routes
try:
    from vercel_app import app as flask_app
except ImportError:
    flask_app = None

class VercelHandler(SimpleHTTPRequestHandler):
    """Custom handler for serving static files and API"""
    
    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        # API routes - forward to Flask
        if path.startswith('/api/'):
            if flask_app:
                # Forward to Flask app
                environ = dict(os.environ)
                environ['REQUEST_METHOD'] = 'GET'
                environ['PATH_INFO'] = path
                environ['QUERY_STRING'] = parsed_path.query
                
                # Simple response for health check
                if path == '/api/health':
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    response = {
                        'status': 'healthy',
                        'platform': 'vercel',
                        'runtime': 'serverless'
                    }
                    self.wfile.write(json.dumps(response).encode())
                    return
            
            # Fallback health check
            if path == '/api/health':
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                response = {
                    'status': 'healthy',
                    'platform': 'vercel',
                    'runtime': 'serverless'
                }
                self.wfile.write(json.dumps(response).encode())
                return
            
            # Other API endpoints - return error for now
            self.send_response(501)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'API endpoint not implemented in serverless'}).encode())
            return
        
        # Static file routes
        # Map root to apps directory
        if path == '/':
            self.path = '/apps/index.html'
        elif not path.startswith('/apps/') and not path.startswith('/js/'):
            # Check if file exists in apps directory
            apps_path = f'/apps{path}'
            if os.path.exists(os.path.join(os.path.dirname(__file__), '..', apps_path.lstrip('/'))):
                self.path = apps_path
        
        return super().do_GET()
    
    def do_POST(self):
        """Handle POST requests"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        # API routes
        if path.startswith('/api/'):
            self.send_response(501)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'POST not implemented in serverless mode'}).encode())
            return
        
        # Static files don't handle POST
        self.send_response(405)
        self.end_headers()
    
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def end_headers(self):
        """Add CORS headers to all responses"""
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

# Vercel serverless function handler
def handler(request, response):
    """Vercel serverless handler"""
    try:
        # Get request details
        path = request.get('path', '/')
        method = request.get('method', 'GET')
        headers = request.get('headers', {})
        query = request.get('query', {})
        
        # Health check
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
                    'supabase': 'connected' if os.getenv('SUPABASE_URL') else 'not configured'
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
                'body': json.dumps({'error': 'API endpoints require Flask server'})
            }
        
        # Static file routes
        static_path = path
        if static_path == '/':
            static_path = '/index.html'
        
        # Map to apps directory
        file_path = f"apps{static_path}"
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Determine content type
            content_type = 'text/html'
            if static_path.endswith('.css'):
                content_type = 'text/css'
            elif static_path.endswith('.js'):
                content_type = 'application/javascript'
            elif static_path.endswith('.json'):
                content_type = 'application/json'
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': content_type,
                    'Access-Control-Allow-Origin': '*'
                },
                'body': content
            }
        except FileNotFoundError:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'text/html',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': '<h1>404 - File Not Found</h1>'
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }
