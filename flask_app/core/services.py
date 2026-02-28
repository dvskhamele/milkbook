"""
MilkRecord Core - Pure Business Logic
Shared between Desktop and Cloud deployments
NO hardware, NO database, NO framework dependencies
"""

from dataclasses import dataclass, asdict
from datetime import datetime
from typing import List, Dict, Optional
from enum import Enum
import json


# ============================================
# Domain Models
# ============================================

@dataclass
class Farmer:
    """Farmer domain model"""
    id: str
    name: str
    phone: str
    animal_type: str  # cow, buffalo, both
    balance: float = 0.0
    
    def to_dict(self):
        return asdict(self)


@dataclass
class MilkCollection:
    """Milk collection domain model"""
    id: str
    farmer_id: str
    quantity: float
    fat: float
    snf: float
    rate: float
    amount: float
    shift: str  # morning, evening
    collection_date: str
    
    def to_dict(self):
        return asdict(self)


@dataclass
class Customer:
    """Customer domain model"""
    id: str
    name: str
    phone: str
    email: str = ''
    address: str = ''
    balance: float = 0.0
    
    def to_dict(self):
        return asdict(self)


@dataclass
class SaleItem:
    """Sale item domain model"""
    name: str
    quantity: float
    rate: float
    amount: float


@dataclass
class Sale:
    """Sale domain model"""
    id: str
    customer_id: str
    customer_name: str
    items: List[SaleItem]
    total_amount: float
    paid_amount: float
    payment_mode: str  # cash, upi, credit
    sale_date: str
    
    def to_dict(self):
        data = asdict(self)
        data['items'] = [asdict(item) for item in self.items]
        return data


# ============================================
# Rate Calculation Service
# ============================================

class RateCalculator:
    """
    Milk rate calculation based on Fat and SNF
    Pure function - no side effects
    """
    
    @staticmethod
    def calculate_rate(fat: float, snf: float, base_rate: float = 30.0, 
                      fat_factor: float = 6.0, snf_factor: float = 3.0) -> float:
        """
        Calculate milk rate per liter
        Formula: base_rate + (fat × fat_factor) + (snf × snf_factor)
        """
        rate = base_rate + (fat * fat_factor) + (snf * snf_factor)
        return round(rate, 2)
    
    @staticmethod
    def calculate_amount(quantity: float, rate: float) -> float:
        """Calculate total amount"""
        return round(quantity * rate, 2)
    
    @staticmethod
    def calculate_collection(farmer_id: str, quantity: float, fat: float, 
                           snf: float, shift: str, base_rate: float = 30.0) -> MilkCollection:
        """
        Complete milk collection calculation
        Returns MilkCollection domain object
        """
        rate = RateCalculator.calculate_rate(fat, snf, base_rate)
        amount = RateCalculator.calculate_amount(quantity, rate)
        
        return MilkCollection(
            id=f"C{datetime.now().strftime('%Y%m%d%H%M%S')}",
            farmer_id=farmer_id,
            quantity=quantity,
            fat=fat,
            snf=snf,
            rate=rate,
            amount=amount,
            shift=shift,
            collection_date=datetime.now().strftime('%Y-%m-%d')
        )


# ============================================
# Validation Services
# ============================================

class ValidationService:
    """Input validation - pure functions"""
    
    @staticmethod
    def validate_phone(phone: str) -> bool:
        """Validate Indian phone number"""
        if not phone:
            return False
        # Remove spaces and special chars
        clean = ''.join(c for c in phone if c.isdigit())
        return len(clean) == 10 and clean.startswith(('6', '7', '8', '9'))
    
    @staticmethod
    def validate_fat(fat: float) -> bool:
        """Validate fat percentage (2-10%)"""
        return 2.0 <= fat <= 10.0
    
    @staticmethod
    def validate_snf(snf: float) -> bool:
        """Validate SNF percentage (7-10%)"""
        return 7.0 <= snf <= 10.0
    
    @staticmethod
    def validate_quantity(quantity: float) -> bool:
        """Validate quantity (0.1-1000 liters)"""
        return 0.1 <= quantity <= 1000.0


# ============================================
# ID Generation Service
# ============================================

class IDGenerator:
    """Generate unique IDs - pure functions"""
    
    @staticmethod
    def generate_farmer_id() -> str:
        """Generate farmer ID: F + timestamp"""
        return f"F{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    @staticmethod
    def generate_customer_id() -> str:
        """Generate customer ID: C + timestamp"""
        return f"C{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    @staticmethod
    def generate_sale_id() -> str:
        """Generate sale ID: S + timestamp"""
        return f"S{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    @staticmethod
    def generate_collection_id() -> str:
        """Generate collection ID: COL + timestamp"""
        return f"COL{datetime.now().strftime('%Y%m%d%H%M%S')}"


# ============================================
# Reporting Service
# ============================================

class ReportService:
    """Generate reports from data - pure functions"""
    
    @staticmethod
    def daily_summary(collections: List[MilkCollection]) -> Dict:
        """Generate daily summary report"""
        if not collections:
            return {
                'total_quantity': 0.0,
                'total_amount': 0.0,
                'average_fat': 0.0,
                'average_snf': 0.0,
                'total_collections': 0
            }
        
        total_qty = sum(c.quantity for c in collections)
        total_amt = sum(c.amount for c in collections)
        avg_fat = sum(c.fat for c in collections) / len(collections)
        avg_snf = sum(c.snf for c in collections) / len(collections)
        
        return {
            'total_quantity': round(total_qty, 2),
            'total_amount': round(total_amt, 2),
            'average_fat': round(avg_fat, 2),
            'average_snf': round(avg_snf, 2),
            'total_collections': len(collections)
        }
    
    @staticmethod
    def farmer_statement(collections: List[MilkCollection]) -> Dict:
        """Generate farmer-wise statement"""
        statement = {}
        
        for collection in collections:
            fid = collection.farmer_id
            if fid not in statement:
                statement[fid] = {
                    'farmer_id': fid,
                    'total_quantity': 0.0,
                    'total_amount': 0.0,
                    'collections': []
                }
            
            statement[fid]['total_quantity'] += collection.quantity
            statement[fid]['total_amount'] += collection.amount
            statement[fid]['collections'].append(collection.to_dict())
        
        # Round totals
        for fid in statement:
            statement[fid]['total_quantity'] = round(statement[fid]['total_quantity'], 2)
            statement[fid]['total_amount'] = round(statement[fid]['total_amount'], 2)
        
        return statement
