"""
MilkRecord POS - Reconciliation & Shift Management APIs
Anti-theft, minimal entry, maximum insight
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, date
import re

reconciliation_bp = Blueprint('reconciliation', __name__)

# Import Supabase client
try:
    from vercel_app import supabase
except:
    supabase = None

# ============================================
# SHIFT MANAGEMENT APIs
# ============================================

@reconciliation_bp.route('/api/shifts', methods=['POST'])
def create_shift():
    """Start new shift with opening balances"""
    try:
        data = request.json
        
        shift_data = {
            'shop_id': data.get('shop_id'),
            'shift_name': data.get('shift_name', 'Morning'),
            'shift_date': data.get('shift_date', date.today().isoformat()),
            'opening_milk_cow': data.get('opening_milk_cow', 0),
            'opening_milk_buff': data.get('opening_milk_buff', 0),
            'opening_cash': data.get('opening_cash', 0),
            'status': 'open'
        }
        
        result = supabase.table('shifts').insert(shift_data).execute()
        
        if result.data:
            return jsonify({
                'success': True,
                'shift': result.data[0],
                'message': 'Shift started successfully'
            })
        else:
            return jsonify({'success': False, 'error': 'Failed to create shift'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

@reconciliation_bp.route('/api/shifts/<shift_id>/close', methods=['POST'])
def close_shift(shift_id):
    """End shift with reconciliation"""
    try:
        data = request.json
        
        # Calculate variances
        shift = supabase.table('shifts').select('*').eq('id', shift_id).execute()
        if not shift.data:
            return jsonify({'success': False, 'error': 'Shift not found'}), 404
        
        shift_data = shift.data[0]
        
        # Calculate expected milk closing
        expected_milk = (
            shift_data['opening_milk_cow'] + shift_data['opening_milk_buff'] +
            shift_data['total_milk_collected'] -
            shift_data['total_milk_converted'] -
            shift_data['total_milk_sold']
        )
        
        actual_milk = data.get('closing_milk_cow', 0) + data.get('closing_milk_buff', 0)
        milk_variance = actual_milk - expected_milk
        milk_variance_percent = (milk_variance / expected_milk * 100) if expected_milk > 0 else 0
        
        # Calculate cash variance
        expected_cash = (
            shift_data['opening_cash'] +
            shift_data['total_sales_amount']
        )
        actual_cash = data.get('closing_cash', 0)
        cash_variance = actual_cash - expected_cash
        
        # Update shift
        update_data = {
            'closing_milk_cow': data.get('closing_milk_cow', 0),
            'closing_milk_buff': data.get('closing_milk_buff', 0),
            'closing_cash': actual_cash,
            'end_time': datetime.now().isoformat(),
            'status': 'reconciled',
            'milk_variance': milk_variance,
            'milk_variance_percent': milk_variance_percent,
            'cash_variance': cash_variance,
            'reconciled_by': data.get('reconciled_by', 'System'),
            'reconciled_at': datetime.now().isoformat(),
            'notes': data.get('notes', '')
        }
        
        result = supabase.table('shifts').update(update_data).eq('id', shift_id).execute()
        
        # Check if variance exceeds threshold
        variance_alert = abs(milk_variance_percent) > 2.0  # 2% threshold
        
        return jsonify({
            'success': True,
            'shift': result.data[0] if result.data else None,
            'reconciliation': {
                'milk_variance': milk_variance,
                'milk_variance_percent': milk_variance_percent,
                'cash_variance': cash_variance,
                'variance_alert': variance_alert
            },
            'message': 'Shift closed successfully'
        })
        
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

@reconciliation_bp.route('/api/shifts/current', methods=['GET'])
def get_current_shift():
    """Get current open shift"""
    try:
        shop_id = request.args.get('shop_id')
        
        query = supabase.table('shifts').select('*').eq('status', 'open')
        if shop_id:
            query = query.eq('shop_id', shop_id)
        
        result = query.order('start_time', desc=True).limit(1).execute()
        
        if result.data:
            return jsonify({'success': True, 'shift': result.data[0]})
        else:
            return jsonify({'success': True, 'shift': None})
            
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

# ============================================
# CONVERSION BATCH APIs
# ============================================

@reconciliation_bp.route('/api/conversion-batches', methods=['POST'])
def create_conversion_batch():
    """Create milk to product conversion batch"""
    try:
        data = request.json
        
        # Calculate conversion ratio
        milk_total = data.get('milk_quantity_cow', 0) + data.get('milk_quantity_buff', 0)
        product_qty = data.get('product_quantity', 0)
        conversion_ratio = milk_total / product_qty if product_qty > 0 else 0
        
        # Get expected ratio
        expected_ratios = {
            'paneer': 5.0,
            'ghee': 25.0,
            'curd': 1.0,
            'sweets': 8.0
        }
        expected_ratio = expected_ratios.get(data.get('product_type', '').lower(), 5.0)
        
        # Calculate variance
        variance_percent = ((conversion_ratio - expected_ratio) / expected_ratio * 100) if expected_ratio > 0 else 0
        
        # Generate batch number
        batch_number = f"BATCH-{datetime.now().strftime('%Y%m%d')}-{datetime.now().strftime('%H%M%S')}"
        
        batch_data = {
            'shop_id': data.get('shop_id'),
            'shift_id': data.get('shift_id'),
            'batch_number': batch_number,
            'milk_source': data.get('milk_source', 'mixed'),
            'milk_quantity_cow': data.get('milk_quantity_cow', 0),
            'milk_quantity_buff': data.get('milk_quantity_buff', 0),
            'milk_quantity_total': milk_total,
            'product_type': data.get('product_type'),
            'product_quantity': product_qty,
            'product_unit': data.get('product_unit', 'kg'),
            'conversion_ratio': conversion_ratio,
            'expected_ratio': expected_ratio,
            'variance_percent': variance_percent,
            'waste_percent': data.get('waste_percent', 0),
            'operator_name': data.get('operator_name'),
            'notes': data.get('notes', '')
        }
        
        result = supabase.table('conversion_batches').insert(batch_data).execute()
        
        if result.data:
            # Update shift total_milk_converted
            if data.get('shift_id'):
                supabase.table('shifts').rpc('increment_milk_converted', {
                    'shift_id_param': data.get('shift_id'),
                    'quantity_param': milk_total
                }).execute()
            
            return jsonify({
                'success': True,
                'batch': result.data[0],
                'message': 'Conversion batch created'
            })
        else:
            return jsonify({'success': False, 'error': 'Failed to create batch'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

@reconciliation_bp.route('/api/conversion-batches', methods=['GET'])
def get_conversion_batches():
    """Get conversion batches"""
    try:
        shop_id = request.args.get('shop_id')
        shift_id = request.args.get('shift_id')
        limit = request.args.get('limit', 100)
        
        query = supabase.table('conversion_batches').select('*')
        
        if shop_id:
            query = query.eq('shop_id', shop_id)
        if shift_id:
            query = query.eq('shift_id', shift_id)
        
        result = query.order('created_at', desc=True).limit(int(limit)).execute()
        
        return jsonify({'success': True, 'batches': result.data or []})
        
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

# ============================================
# ANALYTICS APIs
# ============================================

@reconciliation_bp.route('/api/analytics/daily-summary', methods=['GET'])
def get_daily_summary():
    """Get daily reconciliation summary"""
    try:
        shop_id = request.args.get('shop_id')
        summary_date = request.args.get('date', date.today().isoformat())
        
        # Get today's shifts
        shifts = supabase.table('shifts').select('*').eq('shift_date', summary_date)
        if shop_id:
            shifts = shifts.eq('shop_id', shop_id)
        shifts = shifts.execute()
        
        # Aggregate data
        total_milk_collected = sum(s.get('total_milk_collected', 0) for s in shifts.data or [])
        total_milk_converted = sum(s.get('total_milk_converted', 0) for s in shifts.data or [])
        total_sales = sum(s.get('total_sales_amount', 0) for s in shifts.data or [])
        
        # Get conversion batches
        batches = supabase.table('conversion_batches').select('*').eq('shift_id', 'in', [s['id'] for s in shifts.data or []])
        batches = batches.execute()
        
        products_produced = sum(b.get('product_quantity', 0) for b in batches.data or [])
        
        summary = {
            'date': summary_date,
            'milkIn': total_milk_collected,
            'milkConverted': total_milk_converted,
            'milkLeft': total_milk_collected - total_milk_converted,
            'productsProduced': products_produced,
            'productsSold': 0,  # Would need to calculate from sales
            'productsLeft': products_produced,
            'revenue': total_sales,
            'cost': total_milk_collected * 64,  # Average milk rate
            'margin': total_sales - (total_milk_collected * 64)
        }
        
        return jsonify({'success': True, 'summary': summary})
        
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

@reconciliation_bp.route('/api/analytics/farmer-rankings', methods=['GET'])
def get_farmer_rankings():
    """Get farmer quality rankings"""
    try:
        shop_id = request.args.get('shop_id')
        limit = request.args.get('limit', 50)
        
        # Get milk collections grouped by farmer
        collections = supabase.table('milk_collections').select('farmer_id, farmer_name, quantity, fat, snf')
        if shop_id:
            collections = collections.eq('shop_id', shop_id)
        collections = collections.execute()
        
        # Calculate averages per farmer
        farmer_data = {}
        for collection in collections.data or []:
            farmer_id = collection.get('farmer_id')
            if farmer_id not in farmer_data:
                farmer_data[farmer_id] = {
                    'farmer_id': farmer_id,
                    'farmer_name': collection.get('farmer_name', ''),
                    'total_quantity': 0,
                    'total_fat': 0,
                    'total_snf': 0,
                    'count': 0
                }
            
            farmer_data[farmer_id]['total_quantity'] += collection.get('quantity', 0) or 0
            farmer_data[farmer_id]['total_fat'] += collection.get('fat', 0) or 0
            farmer_data[farmer_id]['total_snf'] += collection.get('snf', 0) or 0
            farmer_data[farmer_id]['count'] += 1
        
        # Calculate quality scores
        rankings = []
        for farmer_id, data in farmer_data.items():
            if data['count'] > 0:
                avg_fat = data['total_fat'] / data['count']
                avg_snf = data['total_snf'] / data['count']
                
                # Quality score: FAT 60%, SNF 40%
                fat_score = min(100, (avg_fat / 6.0) * 60)
                snf_score = min(100, (avg_snf / 9.0) * 40)
                quality_score = fat_score + snf_score
                
                rankings.append({
                    'farmer_id': farmer_id,
                    'farmer_name': data['farmer_name'],
                    'avg_fat': round(avg_fat, 2),
                    'avg_snf': round(avg_snf, 2),
                    'quality_score': round(quality_score, 2),
                    'total_milk': round(data['total_quantity'], 2)
                })
        
        # Sort by quality score
        rankings.sort(key=lambda x: x['quality_score'], reverse=True)
        
        return jsonify({'success': True, 'rankings': rankings[:int(limit)]})
        
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

# ============================================
# PRODUCT STOCK APIs
# ============================================

@reconciliation_bp.route('/api/product-stock', methods=['GET'])
def get_product_stock():
    """Get current product stock"""
    try:
        shop_id = request.args.get('shop_id')
        stock_date = request.args.get('date', date.today().isoformat())
        
        query = supabase.table('product_stock').select('*').eq('stock_date', stock_date)
        if shop_id:
            query = query.eq('shop_id', shop_id)
        
        result = query.execute()
        
        return jsonify({'success': True, 'stock': result.data or []})
        
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

@reconciliation_bp.route('/api/product-stock', methods=['POST'])
def update_product_stock():
    """Update product stock (from conversion or sale)"""
    try:
        data = request.json
        
        stock_data = {
            'shop_id': data.get('shop_id'),
            'product_name': data.get('product_name'),
            'product_type': data.get('product_type'),
            'opening_stock': data.get('opening_stock', 0),
            'produced_today': data.get('produced_today', 0),
            'sold_today': data.get('sold_today', 0),
            'wasted_today': data.get('wasted_today', 0),
            'closing_stock': data.get('closing_stock', 0),
            'unit': data.get('unit', 'kg'),
            'stock_date': data.get('stock_date', date.today().isoformat()),
            'shift_id': data.get('shift_id')
        }
        
        # Calculate closing stock
        stock_data['closing_stock'] = (
            stock_data['opening_stock'] +
            stock_data['produced_today'] -
            stock_data['sold_today'] -
            stock_data['wasted_today']
        )
        
        # Upsert (update if exists, insert if not)
        result = supabase.table('product_stock').upsert(stock_data).execute()
        
        if result.data:
            return jsonify({'success': True, 'stock': result.data[0]})
        else:
            return jsonify({'success': False, 'error': 'Failed to update stock'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500
