import os
import shutil

# Category definitions
categories = {
    'apps': [
        'index.html',
        'dairy-pos-billing-software-india.html',
        'automated-milk-collection-system-village.html',
        'customer-ledger-udhar-tracking-dairy.html',
        'farmer-management-milk-collection-centers.html',
        'single-dairy-shop-automation-software.html',
        'inventory.html',
        'payments.html',
        'passbook.html',
        'settings.html',
        'collection.html',
        'milk-sales.html',
        'products-conversion.html',
        'purchase2 copy 2.html',
        'stock-inventory.html',
        'stock-profit-report.html',
        'reports-dashboard.html',
        'pricing.html'
    ],
    'hardware': [
        'milk-analyser-automatic-fat-snf-testing.html',
        'hardware.html',
        'auto-config.html'
    ],
    'reports': [
        'daily-milk-collection-sales-report-dairy.html',
        'monthly-dairy-shop-profit-loss-report.html',
        'reports.html',
        'daily-report.html',
        'milkledger-evidence.html'
    ],
    'pricing': [
        'free-dairy-pos-software-trial-india.html',
        'dairy-shop-software-pricing-2000-year.html',
        'multi-dairy-enterprise-software-pricing.html',
        'plan-basic.html',
        'plan-smart.html',
        'plan-distributor.html'
    ],
    'demo': [
        'free-dairy-pos-software-demo-online.html',
        'bulk-milk-collection-center-demo-software.html',
        'demo.html',
        'demo-bmc.html',
        'demo-bmc-login.html'
    ],
    'auth': [
        'login.html',
        'login-pos.html',
        'login-bmc.html',
        'logout.html',
        'onboarding.html',
        'setup.html'
    ],
    'bmc': [
        'bulk-milk-collection-center-bmc-software.html',
        'milk-collection-center-management-software.html',
        'bmc-reconciliation.html',
        'milk-collection-centers.html'
    ],
    'compliance': [
        'gst-compliance-dairy-shop-billing-india.html',
        'dairy-shop-data-backup-recovery-software.html',
        'backup.html',
        'compliance.html'
    ],
    'info': [
        'homepage.html',
        'dairy-shops.html',
        'partners.html',
        'inventory-guide.html'
    ],
    'deprecated': [
        'depricated-main-work.html',
        'depricated-main-workbak.html'
    ],
    'legacy': [
        'extended_milkrecord_final.html',
        'extended_milkrecord.html',
        'final_complete_milkbook.html',
        'final_single_file_app.html',
        'final_standalone_app.html',
        'integrated_milkrecord.html',
        'standalone_milkbook_complete.html',
        'GLOBAL_NAV_TEMPLATE.html',
        'GLOBAL_NAVIGATION_BAR.html'
    ],
    'dist': [
        'Invoice-INV-113395.html',
        'landing_page_1.html',
        'landing_page_2.html',
        'landing_page_4.html'
    ],
    'backend': [
        'backend-status.html',
        'check-db-status.html'
    ]
}

# Move files to categories
moved_count = 0
for category, files in categories.items():
    if not os.path.exists(category):
        os.makedirs(category)
    
    for filename in files:
        if os.path.exists(filename):
            try:
                shutil.move(filename, os.path.join(category, filename))
                print(f'✅ {filename} → {category}/')
                moved_count += 1
            except Exception as e:
                print(f'⚠️  Error moving {filename}: {e}')
        else:
            print(f'⚠️  File not found: {filename}')

print(f'\n✅ Organized {moved_count} files into {len(categories)} categories!')
