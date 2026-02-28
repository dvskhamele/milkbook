import os
import re

seo_data = {
    'dairy-pos-billing-software-india.html': {
        'title': 'Dairy POS Billing Software India - Free POS System for Milk Shops | MilkRecord',
        'description': 'Free dairy POS billing software for India. Customer billing, udhar tracking, GST invoices, WhatsApp integration. 30-day free trial for milk shops.',
        'keywords': 'dairy pos software India, milk shop billing system, dairy shop POS, customer billing software, udhar tracking system, GST billing dairy',
        'h1': 'Dairy POS Billing Software for Indian Milk Shops'
    },
    'automated-milk-collection-system-village.html': {
        'title': 'Automated Milk Collection System Village - Dairy Software with Fat/SNF Testing',
        'description': 'Automated milk collection system for village dairy shops. Fat/SNF testing, farmer management, auto rate calculation. Free trial available.',
        'keywords': 'automated milk collection system, village dairy software, milk collection machine, fat SNF testing, farmer management dairy',
        'h1': 'Automated Milk Collection System for Village Dairy Shops'
    },
    'customer-ledger-udhar-tracking-dairy.html': {
        'title': 'Customer Ledger Udhar Tracking Dairy - Digital Khata for Milk Shops',
        'description': 'Digital customer ledger and udhar tracking for dairy shops. Track credit, send WhatsApp reminders, monthly statements. Free software.',
        'keywords': 'customer ledger software, udhar tracking system, dairy credit management, digital khata dairy, milk shop udhar software',
        'h1': 'Customer Ledger and Udhar Tracking for Dairy Shops'
    },
    'farmer-management-milk-collection-centers.html': {
        'title': 'Farmer Management Milk Collection Centers - Dairy Farmer Software India',
        'description': 'Farmer management system for milk collection centers. Track milk collection, payments, settlements. BMC software for dairy centers.',
        'keywords': 'farmer management system, milk collection center software, dairy farmer database, BMC software India, milk collection tracking',
        'h1': 'Farmer Management System for Milk Collection Centers'
    },
    'milk-analyser-automatic-fat-snf-testing.html': {
        'title': 'Milk Analyser Automatic Fat SNF Testing India - Dairy Testing Equipment',
        'description': 'Automatic milk analyser for fat/SNF testing in India. Digital weighing scale, thermal printer integration. Dairy testing equipment.',
        'keywords': 'milk analyser India, automatic fat SNF tester, dairy testing equipment, digital milk tester, milk quality testing machine',
        'h1': 'Milk Analyser and Automatic Fat/SNF Testing Equipment'
    },
    'daily-milk-collection-sales-report-dairy.html': {
        'title': 'Daily Milk Collection Sales Report Dairy - Dairy Shop Reports India',
        'description': 'Daily milk collection and sales reports for dairy shops. Track collection, billing, payments. Export to Excel. Free dairy software.',
        'keywords': 'daily milk collection report, dairy sales report, milk shop daily summary, dairy collection tracking, milk sales India',
        'h1': 'Daily Milk Collection and Sales Reports for Dairy Shops'
    },
    'monthly-dairy-shop-profit-loss-report.html': {
        'title': 'Monthly Dairy Shop Profit Loss Report - Dairy Business Reports India',
        'description': 'Monthly profit/loss reports for dairy shops. Track sales, expenses, customer summaries. Business analytics for milk shops.',
        'keywords': 'monthly dairy report, profit loss dairy shop, dairy business analytics, milk shop monthly summary, dairy financial reports',
        'h1': 'Monthly Dairy Shop Profit and Loss Reports'
    },
    'bulk-milk-collection-center-bmc-software.html': {
        'title': 'Bulk Milk Collection Center BMC Software India - Dairy Center Management',
        'description': 'Bulk milk collection center (BMC) software for India. Farmer settlement, quality testing, payment tracking. Complete BMC solution.',
        'keywords': 'bulk milk collection center, BMC software India, milk collection center management, dairy BMC system, farmer settlement software',
        'h1': 'Bulk Milk Collection Center (BMC) Software for India'
    },
    'milk-collection-center-management-software.html': {
        'title': 'Milk Collection Center Management Software - Dairy Collection Point System',
        'description': 'Milk collection center management software. Track farmer milk, quality testing, payments. Complete dairy collection point solution.',
        'keywords': 'milk collection center software, dairy collection point, milk collection management, farmer milk tracking, dairy center software',
        'h1': 'Milk Collection Center Management Software'
    },
    'free-dairy-pos-software-trial-india.html': {
        'title': 'Free Dairy POS Software Trial India - 30 Day Free Trial Milk Shop POS',
        'description': 'Free 30-day dairy POS software trial for India. Full features, no credit card. Try dairy billing software free.',
        'keywords': 'free dairy POS trial, dairy software free, milk shop POS free trial, dairy billing software free, POS trial India',
        'h1': 'Free Dairy POS Software Trial - 30 Days Full Access'
    },
    'dairy-shop-software-pricing-2000-year.html': {
        'title': 'Dairy Shop Software Pricing Rs.2000/Year - Milk Shop POS Cost India',
        'description': 'Dairy shop software pricing Rs.2000/year. Unlimited features, GST billing, customer ledger. Best price for milk shop POS in India.',
        'keywords': 'dairy software price, dairy POS cost India, milk shop software Rs.2000, dairy billing software price, POS pricing India',
        'h1': 'Dairy Shop Software Pricing - Rs.2000/Year Unlimited'
    },
    'multi-dairy-enterprise-software-pricing.html': {
        'title': 'Multi Dairy Enterprise Software Pricing - Branch Management Dairy India',
        'description': 'Multi-dairy enterprise software pricing. Branch management, centralized reporting, custom features. Contact for dairy chain pricing.',
        'keywords': 'enterprise dairy software, multi-branch dairy pricing, dairy chain software, multi-dairy management, dairy enterprise solution',
        'h1': 'Multi-Dairy Enterprise Software - Custom Pricing'
    },
    'gst-compliance-dairy-shop-billing-india.html': {
        'title': 'GST Compliance Dairy Shop Billing India - GST Invoice Software Milk Shops',
        'description': 'GST-compliant dairy shop billing software. GST invoices, tax reports, compliance tracking. Made for Indian milk shops.',
        'keywords': 'GST dairy shop, dairy billing GST India, GST invoice dairy, milk shop GST software, dairy tax compliance',
        'h1': 'GST Compliance for Dairy Shop Billing in India'
    },
    'dairy-shop-data-backup-recovery-software.html': {
        'title': 'Dairy Shop Data Backup Recovery Software - Milk Shop Data Protection',
        'description': 'Dairy shop data backup and recovery software. Automatic backups, cloud sync, data protection. Never lose your milk shop data.',
        'keywords': 'dairy data backup, milk shop data recovery, dairy software backup, data protection dairy, cloud backup milk shop',
        'h1': 'Dairy Shop Data Backup and Recovery Software'
    },
    'free-dairy-pos-software-demo-online.html': {
        'title': 'Free Dairy POS Software Demo Online - Watch Dairy POS Demo Video India',
        'description': 'Free online dairy POS software demo. Watch demo video, try features free. See how dairy billing software works.',
        'keywords': 'free dairy POS demo, online dairy software demo, dairy POS video, milk shop software demo, POS demo India',
        'h1': 'Free Dairy POS Software Demo - Watch Online'
    },
    'bulk-milk-collection-center-demo-software.html': {
        'title': 'Bulk Milk Collection Center Demo Software - BMC Demo Online India',
        'description': 'Bulk milk collection center demo software. Try BMC software free online. See farmer management, quality testing features.',
        'keywords': 'BMC demo software, bulk milk collection demo, milk collection center demo, dairy BMC trial, BMC software demo India',
        'h1': 'Bulk Milk Collection Center (BMC) Demo Software'
    }
}

for filename, data in seo_data.items():
    if os.path.exists(filename):
        print(f'Updating: {filename}')
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
        content = re.sub(r'<title>.*?</title>', f'<title>{data["title"]}</title>', content, flags=re.IGNORECASE)
        content = re.sub(r'<meta name="description" content=".*?"', f'<meta name="description" content="{data["description"]}"', content, flags=re.IGNORECASE)
        content = re.sub(r'<meta name="keywords" content=".*?"', f'<meta name="keywords" content="{data["keywords"]}"', content, flags=re.IGNORECASE)
        content = re.sub(r'<h1>.*?</h1>', f'<h1>{data["h1"]}</h1>', content, flags=re.IGNORECASE)
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)
    else:
        print(f'File not found: {filename}')

print('All pages updated!')
