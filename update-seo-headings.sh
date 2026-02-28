#!/bin/bash

echo "🔄 Updating SEO titles, headings, and meta tags for all pages..."

# Function to update HTML file with SEO content
update_page() {
    local file=$1
    local title=$2
    local description=$3
    local keywords=$4
    local h1=$5
    
    if [ -f "$file" ]; then
        echo "✅ Updating: $file"
        # Update title
        sed -i '' "s|<title>.*</title>|<title>$title</title>|g" "$file"
        # Add/update meta description if exists
        if grep -q "meta.*description" "$file"; then
            sed -i '' "s|<meta name=\"description\" content=\".*\">|<meta name=\"description\" content=\"$description\">|g" "$file"
        fi
        # Add/update keywords
        if grep -q "meta.*keywords" "$file"; then
            sed -i '' "s|<meta name=\"keywords\" content=\".*\">|<meta name=\"keywords\" content=\"$keywords\">|g" "$file"
        fi
        # Update H1 if exists
        if grep -q "<h1>" "$file"; then
            sed -i '' "s|<h1>.*</h1>|<h1>$h1</h1>|g" "$file"
        fi
    else
        echo "⚠️  File not found: $file"
    fi
}

# Update POS Billing page
update_page "dairy-pos-billing-software-india.html" \
    "Dairy POS Billing Software India - Free POS System for Milk Shops | MilkRecord" \
    "Free dairy POS billing software for India. Customer billing, udhar tracking, GST invoices, WhatsApp integration. 30-day free trial for milk shops." \
    "dairy pos software India, milk shop billing system, dairy shop POS, customer billing software, udhar tracking system, GST billing dairy" \
    "🛒 Dairy POS Billing Software for Indian Milk Shops"

# Update Milk Collection page
update_page "automated-milk-collection-system-village.html" \
    "Automated Milk Collection System Village - Dairy Software with Fat/SNF Testing" \
    "Automated milk collection system for village dairy shops. Fat/SNF testing, farmer management, auto rate calculation. Free trial available." \
    "automated milk collection system, village dairy software, milk collection machine, fat SNF testing, farmer management dairy" \
    "📊 Automated Milk Collection System for Village Dairy Shops"

# Update Customer Ledger page
update_page "customer-ledger-udhar-tracking-dairy.html" \
    "Customer Ledger Udhar Tracking Dairy - Digital Khata for Milk Shops" \
    "Digital customer ledger and udhar tracking for dairy shops. Track credit, send WhatsApp reminders, monthly statements. Free software." \
    "customer ledger software, udhar tracking system, dairy credit management, digital khata dairy, milk shop udhar software" \
    "📒 Customer Ledger & Udhar Tracking for Dairy Shops"

# Update Farmer Management page
update_page "farmer-management-milk-collection-centers.html" \
    "Farmer Management Milk Collection Centers - Dairy Farmer Software India" \
    "Farmer management system for milk collection centers. Track milk collection, payments, settlements. BMC software for dairy centers." \
    "farmer management system, milk collection center software, dairy farmer database, BMC software India, milk collection tracking" \
    "👨‍🌾 Farmer Management System for Milk Collection Centers"

# Update Milk Analyser page
update_page "milk-analyser-automatic-fat-snf-testing.html" \
    "Milk Analyser Automatic Fat SNF Testing India - Dairy Testing Equipment" \
    "Automatic milk analyser for fat/SNF testing in India. Digital weighing scale, thermal printer integration. Dairy testing equipment." \
    "milk analyser India, automatic fat SNF tester, dairy testing equipment, digital milk tester, milk quality testing machine" \
    "🧪 Milk Analyser & Automatic Fat/SNF Testing Equipment"

# Update Daily Report page
update_page "daily-milk-collection-sales-report-dairy.html" \
    "Daily Milk Collection Sales Report Dairy - Dairy Shop Reports India" \
    "Daily milk collection and sales reports for dairy shops. Track collection, billing, payments. Export to Excel. Free dairy software." \
    "daily milk collection report, dairy sales report, milk shop daily summary, dairy collection tracking, milk sales India" \
    "📈 Daily Milk Collection & Sales Reports for Dairy Shops"

# Update Monthly Report page
update_page "monthly-dairy-shop-profit-loss-report.html" \
    "Monthly Dairy Shop Profit Loss Report - Dairy Business Reports India" \
    "Monthly profit/loss reports for dairy shops. Track sales, expenses, customer summaries. Business analytics for milk shops." \
    "monthly dairy report, profit loss dairy shop, dairy business analytics, milk shop monthly summary, dairy financial reports" \
    "📊 Monthly Dairy Shop Profit & Loss Reports"

# Update BMC page
update_page "bulk-milk-collection-center-bmc-software.html" \
    "Bulk Milk Collection Center BMC Software India - Dairy Center Management" \
    "Bulk milk collection center (BMC) software for India. Farmer settlement, quality testing, payment tracking. Complete BMC solution." \
    "bulk milk collection center, BMC software India, milk collection center management, dairy BMC system, farmer settlement software" \
    "🏭 Bulk Milk Collection Center (BMC) Software for India"

# Update Collection Center page
update_page "milk-collection-center-management-software.html" \
    "Milk Collection Center Management Software - Dairy Collection Point System" \
    "Milk collection center management software. Track farmer milk, quality testing, payments. Complete dairy collection point solution." \
    "milk collection center software, dairy collection point, milk collection management, farmer milk tracking, dairy center software" \
    "📍 Milk Collection Center Management Software"

# Update Trial Plan page
update_page "free-dairy-pos-software-trial-india.html" \
    "Free Dairy POS Software Trial India - 30 Day Free Trial Milk Shop POS" \
    "Free 30-day dairy POS software trial for India. Full features, no credit card. Try dairy billing software free." \
    "free dairy POS trial, dairy software free, milk shop POS free trial, dairy billing software free, POS trial India" \
    "🟢 Free Dairy POS Software Trial - 30 Days Full Access"

# Update Standard Plan page
update_page "dairy-shop-software-pricing-2000-year.html" \
    "Dairy Shop Software Pricing ₹2000/Year - Milk Shop POS Cost India" \
    "Dairy shop software pricing ₹2000/year. Unlimited features, GST billing, customer ledger. Best price for milk shop POS in India." \
    "dairy software price, dairy POS cost India, milk shop software ₹2000, dairy billing software price, POS pricing India" \
    "🔵 Dairy Shop Software Pricing - ₹2000/Year Unlimited"

# Update Enterprise Plan page
update_page "multi-dairy-enterprise-software-pricing.html" \
    "Multi Dairy Enterprise Software Pricing - Branch Management Dairy India" \
    "Multi-dairy enterprise software pricing. Branch management, centralized reporting, custom features. Contact for dairy chain pricing." \
    "enterprise dairy software, multi-branch dairy pricing, dairy chain software, multi-dairy management, dairy enterprise solution" \
    "🟣 Multi-Dairy Enterprise Software - Custom Pricing"

# Update GST Compliance page
update_page "gst-compliance-dairy-shop-billing-india.html" \
    "GST Compliance Dairy Shop Billing India - GST Invoice Software Milk Shops" \
    "GST-compliant dairy shop billing software. GST invoices, tax reports, compliance tracking. Made for Indian milk shops." \
    "GST dairy shop, dairy billing GST India, GST invoice dairy, milk shop GST software, dairy tax compliance" \
    "📄 GST Compliance for Dairy Shop Billing in India"

# Update Backup page
update_page "dairy-shop-data-backup-recovery-software.html" \
    "Dairy Shop Data Backup Recovery Software - Milk Shop Data Protection" \
    "Dairy shop data backup and recovery software. Automatic backups, cloud sync, data protection. Never lose your milk shop data." \
    "dairy data backup, milk shop data recovery, dairy software backup, data protection dairy, cloud backup milk shop" \
    "💾 Dairy Shop Data Backup & Recovery Software"

# Update Demo page
update_page "free-dairy-pos-software-demo-online.html" \
    "Free Dairy POS Software Demo Online - Watch Dairy POS Demo Video India" \
    "Free online dairy POS software demo. Watch demo video, try features free. See how dairy billing software works." \
    "free dairy POS demo, online dairy software demo, dairy POS video, milk shop software demo, POS demo India" \
    "🎥 Free Dairy POS Software Demo - Watch Online"

# Update BMC Demo page
update_page "bulk-milk-collection-center-demo-software.html" \
    "Bulk Milk Collection Center Demo Software - BMC Demo Online India" \
    "Bulk milk collection center demo software. Try BMC software free online. See farmer management, quality testing features." \
    "BMC demo software, bulk milk collection demo, milk collection center demo, dairy BMC trial, BMC software demo India" \
    "🎥 Bulk Milk Collection Center (BMC) Demo Software"

echo ""
echo "✅ All pages updated with SEO titles, descriptions, and headings!"
