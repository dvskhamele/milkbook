import os

# Update links in main files
files_to_update = [
    'apps/index.html',
    'info/milkrecord-app-directory-india.html'
]

# All link updates for newly renamed files
link_updates = [
    # Auth links
    ('href="../auth/login.html"', 'href="../auth/dairy-shop-login-india.html"'),
    ('href="../auth/login-pos.html"', 'href="../auth/pos-billing-login-dairy.html"'),
    ('href="../auth/login-bmc.html"', 'href="../auth/bmc-login-milk-collection-center.html"'),
    ('href="../auth/logout.html"', 'href="../auth/dairy-shop-logout.html"'),
    ('href="../auth/onboarding.html"', 'href="../auth/dairy-shop-onboarding-setup-india.html"'),
    ('href="../auth/setup.html"', 'href="../auth/dairy-shop-initial-setup-guide.html"'),
    
    # Info links
    ('href="../info/dairy-shops.html"', 'href="../info/dairy-shop-solutions-india.html"'),
    ('href="../info/homepage.html"', 'href="../info/milkrecord-app-directory-india.html"'),
    ('href="../info/partners.html"', 'href="../info/dairy-partner-program-india.html"'),
    ('href="../info/inventory-guide.html"', 'href="../info/dairy-inventory-management-guide.html"'),
    
    # Backend links
    ('href="../backend/backend-status.html"', 'href="../backend/dairy-software-backend-status.html"'),
    ('href="../backend/check-db-status.html"', 'href="../backend/dairy-database-status-check.html"'),
    
    # Distribution links
    ('href="../dist/Invoice-INV-113395.html"', 'href="../dist/sample-dairy-invoice-example.html"'),
    ('href="../dist/landing_page_1.html"', 'href="../dist/dairy-pos-landing-page-v1.html"'),
    ('href="../dist/landing_page_2.html"', 'href="../dist/dairy-pos-landing-page-v2.html"'),
    ('href="../dist/landing_page_4.html"', 'href="../dist/dairy-pos-landing-page-v4.html"'),
]

for filepath in files_to_update:
    if os.path.exists(filepath):
        print(f'Updating {filepath}...')
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        for old, new in link_updates:
            content = content.replace(old, new)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f'  ✅ Updated {filepath}')
    else:
        print(f'  ⚠️  Not found: {filepath}')

print('\n✅ All links updated to SEO-optimized filenames!')
