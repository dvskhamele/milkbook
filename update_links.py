import os
import re

# Files to update
files_to_update = [
    'apps/index.html',
    'info/homepage.html'
]

# Link mapping - old paths to new categorized paths
link_map = {
    'href="dairy-pos-billing-software-india.html"': 'href="dairy-pos-billing-software-india.html"',
    'href="automated-milk-collection-system-village.html"': 'href="automated-milk-collection-system-village.html"',
    'href="customer-ledger-udhar-tracking-dairy.html"': 'href="customer-ledger-udhar-tracking-dairy.html"',
    'href="farmer-management-milk-collection-centers.html"': 'href="farmer-management-milk-collection-centers.html"',
    'href="single-dairy-shop-automation-software.html"': 'href="single-dairy-shop-automation-software.html"',
    'href="../hardware/milk-analyser-automatic-fat-snf-testing.html"': 'href="../hardware/milk-analyser-automatic-fat-snf-testing.html"',
    'href="../reports/daily-milk-collection-sales-report-dairy.html"': 'href="../reports/daily-milk-collection-sales-report-dairy.html"',
    'href="../reports/monthly-dairy-shop-profit-loss-report.html"': 'href="../reports/monthly-dairy-shop-profit-loss-report.html"',
    'href="../bmc/bulk-milk-collection-center-bmc-software.html"': 'href="../bmc/bulk-milk-collection-center-bmc-software.html"',
    'href="../bmc/milk-collection-center-management-software.html"': 'href="../bmc/milk-collection-center-management-software.html"',
    'href="../pricing/free-dairy-pos-software-trial-india.html"': 'href="../pricing/free-dairy-pos-software-trial-india.html"',
    'href="../pricing/dairy-shop-software-pricing-2000-year.html"': 'href="../pricing/dairy-shop-software-pricing-2000-year.html"',
    'href="../pricing/multi-dairy-enterprise-software-pricing.html"': 'href="../pricing/multi-dairy-enterprise-software-pricing.html"',
    'href="../compliance/gst-compliance-dairy-shop-billing-india.html"': 'href="../compliance/gst-compliance-dairy-shop-billing-india.html"',
    'href="../compliance/dairy-shop-data-backup-recovery-software.html"': 'href="../compliance/dairy-shop-data-backup-recovery-software.html"',
    'href="../demo/free-dairy-pos-software-demo-online.html"': 'href="../demo/free-dairy-pos-software-demo-online.html"',
    'href="../demo/bulk-milk-collection-center-demo-software.html"': 'href="../demo/bulk-milk-collection-center-demo-software.html"',
    'href="../info/homepage.html"': 'href="../info/homepage.html"',
    'href="../info/dairy-shops.html"': 'href="../info/dairy-shops.html"',
    'href="../info/partners.html"': 'href="../info/partners.html"',
    'href="../info/inventory-guide.html"': 'href="../info/inventory-guide.html"',
}

for filepath in files_to_update:
    if os.path.exists(filepath):
        print(f'Updating {filepath}...')
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Apply all link updates
        for old, new in link_map.items():
            content = content.replace(old, new)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f'  Updated {filepath}')
    else:
        print(f'File not found: {filepath}')

print('\nDone!')
