import os

# SEO renaming plan for all remaining files
rename_plan = {
    # Auth files
    'auth/login.html': 'auth/dairy-shop-login-india.html',
    'auth/login-pos.html': 'auth/pos-billing-login-dairy.html',
    'auth/login-bmc.html': 'auth/bmc-login-milk-collection-center.html',
    'auth/logout.html': 'auth/dairy-shop-logout.html',
    'auth/onboarding.html': 'auth/dairy-shop-onboarding-setup-india.html',
    'auth/setup.html': 'auth/dairy-shop-initial-setup-guide.html',
    
    # BMC files (already good)
    
    # Compliance files (already good)
    
    # Info files
    'info/dairy-shops.html': 'info/dairy-shop-solutions-india.html',
    'info/homepage.html': 'info/milkrecord-app-directory-india.html',
    'info/partners.html': 'info/dairy-partner-program-india.html',
    'info/inventory-guide.html': 'info/dairy-inventory-management-guide.html',
    
    # Deprecated (keep as is - not for SEO)
    
    # Legacy (keep as is - historical)
    
    # Distribution
    'dist/Invoice-INV-113395.html': 'dist/sample-dairy-invoice-example.html',
    'dist/landing_page_1.html': 'dist/dairy-pos-landing-page-v1.html',
    'dist/landing_page_2.html': 'dist/dairy-pos-landing-page-v2.html',
    'dist/landing_page_4.html': 'dist/dairy-pos-landing-page-v4.html',
    
    # Backend
    'backend/backend-status.html': 'backend/dairy-software-backend-status.html',
    'backend/check-db-status.html': 'backend/dairy-database-status-check.html',
}

# Execute renames
renamed = 0
for old_path, new_path in rename_plan.items():
    if os.path.exists(old_path):
        os.rename(old_path, new_path)
        print(f'✅ {old_path} → {new_path}')
        renamed += 1
    else:
        print(f'⚠️  Not found: {old_path}')

print(f'\n✅ Renamed {renamed} files with SEO-optimized names!')
