#!/usr/bin/env python3
import re

# Read the file
with open('code.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace old pricing with new pricing
old_text = 'Free Web</h3>'
new_text = 'Basic Plan</h3>'
content = content.replace(old_text, new_text)

old_text = '₹0<span class="text-lg text-gray-400 font-hind font-medium ml-1">/forever</span>'
new_text = '₹2,000<span class="text-lg text-gray-400 font-hind font-medium ml-1">/year</span>'
content = content.replace(old_text, new_text)

old_text = 'Daily Wallet</h3>'
new_text = 'Smart Plan</h3>'
content = content.replace(old_text, new_text)

old_text = '₹3<span class="text-lg text-gray-400 font-hind font-medium ml-1">/day</span>'
new_text = '₹9K-14K<span class="text-lg text-gray-400 font-hind font-medium ml-1">first year</span>'
content = content.replace(old_text, new_text)

old_text = 'Premium Pro</h3>'
new_text = 'Distributor Plan</h3>'
content = content.replace(old_text, new_text)

old_text = '₹499<span class="text-lg text-gray-400 font-hind font-medium ml-1">/month</span>'
new_text = 'Custom<span class="text-lg text-gray-400 font-hind font-medium ml-1">pricing</span>'
content = content.replace(old_text, new_text)

# Write back
with open('code.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Pricing updated!")
