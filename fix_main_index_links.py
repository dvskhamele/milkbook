import re

# Read the main index file
filepath = 'apps/index.html'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Update any remaining incorrect links
link_updates = [
    # Ensure all links use proper relative paths
    ('href="dairy-pos-billing-software-india.html"', 'href="dairy-pos-billing-software-india.html"'),
    ('href="automated-milk-collection-system-village.html"', 'href="automated-milk-collection-system-village.html"'),
    ('href="customer-ledger-udhar-tracking-dairy.html"', 'href="customer-ledger-udhar-tracking-dairy.html"'),
    ('href="farmer-management-milk-collection-centers.html"', 'href="farmer-management-milk-collection-centers.html"'),
    ('href="../hardware/milk-analyser-automatic-fat-snf-testing.html"', 'href="../hardware/milk-analyser-automatic-fat-snf-testing.html"'),
    ('href="../reports/daily-milk-collection-sales-report-dairy.html"', 'href="../reports/daily-milk-collection-sales-report-dairy.html"'),
    ('href="../reports/monthly-dairy-shop-profit-loss-report.html"', 'href="../reports/monthly-dairy-shop-profit-loss-report.html"'),
    ('href="../bmc/bulk-milk-collection-center-bmc-software.html"', 'href="../bmc/bulk-milk-collection-center-bmc-software.html"'),
    ('href="../bmc/milk-collection-center-management-software.html"', 'href="../bmc/milk-collection-center-management-software.html"'),
    ('href="../pricing/free-dairy-pos-software-trial-india.html"', 'href="../pricing/free-dairy-pos-software-trial-india.html"'),
    ('href="../pricing/dairy-shop-software-pricing-2000-year.html"', 'href="../pricing/dairy-shop-software-pricing-2000-year.html"'),
    ('href="../pricing/multi-dairy-enterprise-software-pricing.html"', 'href="../pricing/multi-dairy-enterprise-software-pricing.html"'),
    ('href="../compliance/gst-compliance-dairy-shop-billing-india.html"', 'href="../compliance/gst-compliance-dairy-shop-billing-india.html"'),
    ('href="../compliance/dairy-shop-data-backup-recovery-software.html"', 'href="../compliance/dairy-shop-data-backup-recovery-software.html"'),
    ('href="../demo/free-dairy-pos-software-demo-online.html"', 'href="../demo/free-dairy-pos-software-demo-online.html"'),
    ('href="../demo/bulk-milk-collection-center-demo-software.html"', 'href="../demo/bulk-milk-collection-center-demo-software.html"'),
    ('href="../info/homepage.html"', 'href="../info/milkrecord-app-directory-india.html"'),
    ('href="../info/dairy-shops.html"', 'href="../info/dairy-shop-solutions-india.html"'),
    ('href="../info/partners.html"', 'href="../info/dairy-partner-program-india.html"'),
    ('href="../info/inventory-guide.html"', 'href="../info/dairy-inventory-management-guide.html"'),
]

# Apply all updates
for old, new in link_updates:
    content = content.replace(old, new)

# Write back
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print(f'✅ Updated all links in {filepath}')
