import os
import re

# SEO meta data for all renamed files
seo_meta = {
    # Auth files
    'auth/dairy-shop-login-india.html': {
        'title': 'Dairy Shop Login India - MilkRecord POS Login',
        'description': 'Login to MilkRecord dairy shop management software. Access POS billing, milk collection, farmer management. Secure login for Indian dairy owners.',
        'keywords': 'dairy shop login India, milk record login, dairy POS login, milk collection login, dairy software login',
        'h1': 'Dairy Shop Login - MilkRecord India'
    },
    'auth/pos-billing-login-dairy.html': {
        'title': 'POS Billing Login Dairy - MilkRecord POS System Login',
        'description': 'Login to MilkRecord POS billing system for dairy shops. Customer billing, invoice generation, udhar tracking. Secure POS login.',
        'keywords': 'POS billing login, dairy POS login, milk shop billing login, dairy invoice login, POS system login India',
        'h1': 'POS Billing Login - Dairy Shop'
    },
    'auth/bmc-login-milk-collection-center.html': {
        'title': 'BMC Login Milk Collection Center - Bulk Milk Collection Login',
        'description': 'Login to BMC milk collection center software. Farmer management, milk testing, payment settlement. Bulk milk collection login.',
        'keywords': 'BMC login, milk collection center login, bulk milk login, dairy center login, milk collection software login',
        'h1': 'BMC Milk Collection Center Login'
    },
    'auth/dairy-shop-logout.html': {
        'title': 'Dairy Shop Logout - MilkRecord Secure Logout',
        'description': 'Securely logout from MilkRecord dairy shop software. Your data is saved and protected. Logout from POS, milk collection, or BMC.',
        'keywords': 'dairy shop logout, milk record logout, dairy POS logout, secure logout dairy software',
        'h1': 'Dairy Shop Logout - See You Soon!'
    },
    'auth/dairy-shop-onboarding-setup-india.html': {
        'title': 'Dairy Shop Onboarding Setup India - MilkRecord Setup Guide',
        'description': 'Complete dairy shop onboarding and setup guide. Step-by-step setup for MilkRecord POS, milk collection, farmer management. Easy setup for Indian dairies.',
        'keywords': 'dairy shop onboarding, dairy setup guide, milk record setup, dairy software onboarding India, POS setup guide',
        'h1': 'Dairy Shop Onboarding & Setup Guide'
    },
    'auth/dairy-shop-initial-setup-guide.html': {
        'title': 'Dairy Shop Initial Setup Guide - MilkRecord First Time Setup',
        'description': 'Initial setup guide for dairy shop software. Configure shop details, add farmers, set rates. First-time setup for MilkRecord India.',
        'keywords': 'dairy shop initial setup, dairy software first time setup, milk record configuration, dairy POS initial setup',
        'h1': 'Dairy Shop Initial Setup Guide'
    },
    
    # Info files
    'info/dairy-shop-solutions-india.html': {
        'title': 'Dairy Shop Solutions India - Complete Dairy Management Software',
        'description': 'Complete dairy shop solutions for India. POS billing, milk collection, farmer management, inventory. Trusted by 1000+ dairy shops across India.',
        'keywords': 'dairy shop solutions India, dairy management software, milk shop software India, complete dairy solutions, dairy business software',
        'h1': 'Dairy Shop Solutions for India'
    },
    'info/milkrecord-app-directory-india.html': {
        'title': 'MilkRecord App Directory India - All Dairy Software Apps',
        'description': 'Complete directory of all MilkRecord dairy software apps. POS billing, milk collection, farmer management, reports. Access all 60+ dairy apps.',
        'keywords': 'MilkRecord app directory, dairy software apps, all dairy apps, milk record applications, dairy app list India',
        'h1': 'MilkRecord App Directory - All Dairy Software'
    },
    'info/dairy-partner-program-india.html': {
        'title': 'Dairy Partner Program India - MilkRecord Partnership',
        'description': 'Join MilkRecord dairy partner program. Become a distributor, reseller, or implementation partner. Grow your business with dairy software.',
        'keywords': 'dairy partner program, milk record partnership, dairy software reseller, dairy distributor program, become dairy partner India',
        'h1': 'Dairy Partner Program - Join MilkRecord'
    },
    'info/dairy-inventory-management-guide.html': {
        'title': 'Dairy Inventory Management Guide - Milk Stock Control India',
        'description': 'Complete guide to dairy inventory management. Track milk, products, stock. Inventory control for Indian dairy shops. Best practices and tips.',
        'keywords': 'dairy inventory management, milk stock control, dairy inventory guide, milk shop inventory, dairy stock management India',
        'h1': 'Dairy Inventory Management Guide'
    },
    
    # Backend files
    'backend/dairy-software-backend-status.html': {
        'title': 'Dairy Software Backend Status - MilkRecord System Status',
        'description': 'Check MilkRecord dairy software backend status. System health, uptime, performance monitoring. Real-time status for Indian dairy shops.',
        'keywords': 'dairy software backend status, milk record system status, dairy software health, backend monitoring dairy, system status India',
        'h1': 'Dairy Software Backend Status'
    },
    'backend/dairy-database-status-check.html': {
        'title': 'Dairy Database Status Check - MilkRecord Database Health',
        'description': 'Check dairy database status and health. Database performance, connection status, backup status. Database monitoring for MilkRecord India.',
        'keywords': 'dairy database status, milk record database check, database health dairy, database monitoring, dairy software database',
        'h1': 'Dairy Database Status Check'
    },
    
    # Distribution files
    'dist/sample-dairy-invoice-example.html': {
        'title': 'Sample Dairy Invoice Example - MilkRecord Invoice Template',
        'description': 'Sample dairy shop invoice example. See MilkRecord invoice format, GST billing template. Example invoice for Indian dairy shops.',
        'keywords': 'dairy invoice example, milk shop invoice sample, dairy billing invoice, GST invoice dairy, milk record invoice template',
        'h1': 'Sample Dairy Invoice Example'
    },
    'dist/dairy-pos-landing-page-v1.html': {
        'title': 'Dairy POS Landing Page V1 - MilkRecord POS Design',
        'description': 'Dairy POS landing page version 1. See MilkRecord POS design, features, pricing. Landing page example for Indian dairy software.',
        'keywords': 'dairy POS landing page, milk record design, POS landing page v1, dairy software landing page, milk shop POS design',
        'h1': 'Dairy POS Landing Page - Version 1'
    },
    'dist/dairy-pos-landing-page-v2.html': {
        'title': 'Dairy POS Landing Page V2 - MilkRecord POS Design',
        'description': 'Dairy POS landing page version 2. Improved MilkRecord POS design, features, pricing. Landing page example for Indian dairy software.',
        'keywords': 'dairy POS landing page v2, milk record design v2, POS landing page version 2, dairy software landing, milk shop design',
        'h1': 'Dairy POS Landing Page - Version 2'
    },
    'dist/dairy-pos-landing-page-v4.html': {
        'title': 'Dairy POS Landing Page V4 - MilkRecord POS Design',
        'description': 'Dairy POS landing page version 4. Latest MilkRecord POS design, features, pricing. Landing page example for Indian dairy software.',
        'keywords': 'dairy POS landing page v4, milk record design v4, POS landing page version 4, latest dairy software landing, milk shop design',
        'h1': 'Dairy POS Landing Page - Version 4'
    },
}

# Update each file
for filename, data in seo_meta.items():
    if os.path.exists(filename):
        print(f'Updating {filename}...')
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Update title
        content = re.sub(r'<title>.*?</title>', f'<title>{data["title"]}</title>', content, flags=re.IGNORECASE)
        
        # Update meta description
        content = re.sub(r'<meta name="description" content=".*?"', f'<meta name="description" content="{data["description"]}"', content, flags=re.IGNORECASE)
        
        # Update keywords
        content = re.sub(r'<meta name="keywords" content=".*?"', f'<meta name="keywords" content="{data["keywords"]}"', content, flags=re.IGNORECASE)
        
        # Update H1
        content = re.sub(r'<h1>.*?</h1>', f'<h1>{data["h1"]}</h1>', content, flags=re.IGNORECASE)
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f'  ✅ Updated {filename}')
    else:
        print(f'  ⚠️  Not found: {filename}')

print('\n✅ All SEO meta tags updated!')
