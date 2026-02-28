import re

# Read the homepage file
filepath = 'info/milkrecord-app-directory-india.html'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# All link updates needed
link_updates = [
    # Old generic links to new SEO categorized links
    ('href="pos-billing.html"', 'href="../apps/dairy-pos-billing-software-india.html"'),
    ('href="automated-milk-collection-system-village.html"', 'href="../apps/automated-milk-collection-system-village.html"'),
    ('href="customer-ledger.html"', 'href="../apps/customer-ledger-udhar-tracking-dairy.html"'),
    ('href="farmers.html"', 'href="../apps/farmer-management-milk-collection-centers.html"'),
    ('href="inventory.html"', 'href="../apps/inventory.html"'),
    ('href="reports.html"', 'href="../reports/monthly-dairy-shop-profit-loss-report.html"'),
    ('href="dashboard.html"', 'href="../apps/single-dairy-shop-automation-software.html"'),
    ('href="settings.html"', 'href="../apps/settings.html"'),
    ('href="payments.html"', 'href="../apps/payments.html"'),
    ('href="passbook.html"', 'href="../apps/passbook.html"'),
    ('href="today-earnings.html"', 'href="../apps/stock-profit-report.html"'),
    ('href="profit-report.html"', 'href="../apps/stock-profit-report.html"'),
    ('href="collection.html"', 'href="../apps/collection.html"'),
    ('href="milk-sales.html"', 'href="../apps/milk-sales.html"'),
    ('href="daily-report.html"', 'href="../reports/daily-milk-collection-sales-report-dairy.html"'),
    ('href="reports-dashboard.html"', 'href="../apps/reports-dashboard.html"'),
    ('href="stock-inventory.html"', 'href="../apps/stock-inventory.html"'),
    ('href="product-conversion.html"', 'href="../apps/products-conversion.html"'),
    ('href="backup.html"', 'href="../compliance/dairy-shop-data-backup-recovery-software.html"'),
    ('href="hardware.html"', 'href="../hardware/milk-analyser-automatic-fat-snf-testing.html"'),
    ('href="compliance.html"', 'href="../compliance/gst-compliance-dairy-shop-billing-india.html"'),
    ('href="partners.html"', 'href="dairy-partner-program-india.html"'),
    ('href="dairy-shops.html"', 'href="dairy-shop-solutions-india.html"'),
    ('href="collection-centers.html"', 'href="../bmc/milk-collection-center-management-software.html"'),
    ('href="demo.html"', 'href="../demo/free-dairy-pos-software-demo-online.html"'),
    ('href="bmc-demo.html"', 'href="../demo/bulk-milk-collection-center-demo-software.html"'),
    ('href="test-db.html"', 'href="../backend/dairy-database-status-check.html"'),
    ('href="test-supabase.html"', 'href="../backend/dairy-software-backend-status.html"'),
    ('href="backend-status.html"', 'href="../backend/dairy-software-backend-status.html"'),
    ('href="db-status.html"', 'href="../backend/dairy-database-status-check.html"'),
    ('href="login.html"', 'href="../auth/dairy-shop-login-india.html"'),
    ('href="pos-login.html"', 'href="../auth/pos-billing-login-dairy.html"'),
    ('href="bmc-login.html"', 'href="../auth/bmc-login-milk-collection-center.html"'),
    ('href="logout.html"', 'href="../auth/dairy-shop-logout.html"'),
    ('href="onboarding.html"', 'href="../auth/dairy-shop-onboarding-setup-india.html"'),
    ('href="setup.html"', 'href="../auth/dairy-shop-initial-setup-guide.html"'),
    ('href="bmc-reconciliation.html"', 'href="../bmc/bulk-milk-collection-center-bmc-software.html"'),
    ('href="auto-config.html"', 'href="../hardware/auto-config.html"'),
    ('href="inventory-guide.html"', 'href="dairy-inventory-management-guide.html"'),
    ('href="ledger-evidence.html"', 'href="../reports/milkledger-evidence.html"'),
    ('href="purchase.html"', 'href="../apps/purchase2 copy 2.html"'),
    ('href="traffic-controller.html"', 'href="../apps/stock-inventory.html"'),
    ('href="bmc-demo-login.html"', 'href="../demo/demo-bmc-login.html"'),
    ('href="main-work.html"', 'href="../deprecated/depricated-main-work.html"'),
    ('href="milkrecord-pro.html"', 'href="../legacy/final_complete_milkbook.html"'),
    ('href="milkrecord-plus.html"', 'href="../legacy/extended_milkrecord_final.html"'),
    ('href="complete-system.html"', 'href="../legacy/final_complete_milkbook.html"'),
    ('href="single-file-app.html"', 'href="../legacy/final_single_file_app.html"'),
    ('href="desktop-app.html"', 'href="../legacy/final_standalone_app.html"'),
    ('href="integrated-system.html"', 'href="../legacy/integrated_milkrecord.html"'),
    ('href="verified-system.html"', 'href="../legacy/standalone_milkbook_complete.html"'),
    ('href="invoice-example.html"', 'href="../dist/sample-dairy-invoice-example.html"'),
    ('href="cloud-test.html"', 'href="../dist/dairy-pos-landing-page-v1.html"'),
    ('href="homepage-classic.html"', 'href="milkrecord-app-directory-india.html"'),
    ('href="navigation-template.html"', 'href="../legacy/GLOBAL_NAV_TEMPLATE.html"'),
]

# Apply all updates
for old, new in link_updates:
    content = content.replace(old, new)

# Write back
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print(f'✅ Updated all links in {filepath}')
print('✅ All cards and sections now link to correct SEO-optimized files')
