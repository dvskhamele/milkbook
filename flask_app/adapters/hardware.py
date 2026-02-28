"""
Hardware Adapter - Serial Communication
Desktop/EXE only - returns None for cloud/Vercel
"""

import sys
import os
from typing import Optional, Dict, Callable, List
from datetime import datetime

# Check if running as frozen EXE or local Python
IS_DESKTOP = getattr(sys, 'frozen', False) or os.getenv('RUNTIME') == 'desktop'

# Try to import serial only for desktop
if IS_DESKTOP:
    try:
        import serial
        import serial.tools.list_ports
        HAS_SERIAL = True
    except ImportError:
        HAS_SERIAL = False
        print("Warning: pyserial not installed. Hardware disabled.")
else:
    HAS_SERIAL = False


class HardwareAdapter:
    """
    Hardware abstraction layer
    Desktop: Real serial communication
    Cloud: Returns None/simulated data
    """
    
    def __init__(self):
        self.devices = {}
        self.callbacks = {}
        self.running = False
    
    def register_device(self, device_id: str, device_type: str, port: str, baudrate: int = 9600):
        """Register hardware device"""
        if not IS_DESKTOP or not HAS_SERIAL:
            print(f"Hardware registration skipped (cloud mode): {device_id}")
            return
        
        try:
            ser = serial.Serial(port=port, baudrate=baudrate, timeout=1.0)
            self.devices[device_id] = {
                'type': device_type,
                'port': port,
                'connection': ser,
                'last_reading': None,
                'last_seen': None
            }
            print(f"Registered device: {device_id} on {port}")
        except Exception as e:
            print(f"Failed to register device {device_id}: {e}")
    
    def start_reading(self, device_id: str):
        """Start reading from device"""
        if not IS_DESKTOP or not HAS_SERIAL:
            return
        
        if device_id not in self.devices:
            print(f"Device {device_id} not registered")
            return
        
        # Start background thread for reading
        import threading
        thread = threading.Thread(target=self._read_loop, args=(device_id,), daemon=True)
        thread.start()
        print(f"Started reading from {device_id}")
    
    def _read_loop(self, device_id: str):
        """Background reading loop"""
        if device_id not in self.devices:
            return
        
        device = self.devices[device_id]
        ser = device['connection']
        
        while self.running and ser and ser.is_open:
            try:
                if ser.in_waiting > 0:
                    raw_data = ser.readline().decode('utf-8', errors='ignore').strip()
                    
                    if raw_data:
                        # Update last reading
                        device['last_reading'] = raw_data
                        device['last_seen'] = datetime.now()
                        
                        # Parse based on device type
                        if device['type'] == 'scale':
                            parsed = self._parse_scale(raw_data)
                        elif device['type'] == 'analyzer':
                            parsed = self._parse_analyzer(raw_data)
                        else:
                            parsed = {'raw': raw_data}
                        
                        # Call callbacks
                        if device_id in self.callbacks:
                            for callback in self.callbacks[device_id]:
                                try:
                                    callback(parsed)
                                except Exception as e:
                                    print(f"Callback error: {e}")
                
            except Exception as e:
                print(f"Read error for {device_id}: {e}")
    
    def _parse_scale(self, raw_data: str) -> Dict:
        """Parse weighing scale data"""
        try:
            # Remove units and extract number
            clean = raw_data.replace('kg', '').replace('ST', '').replace(',', '').strip()
            weight = float(clean)
            return {
                'type': 'scale',
                'weight': weight,
                'unit': 'kg',
                'timestamp': datetime.now().isoformat(),
                'raw': raw_data
            }
        except:
            return {'type': 'scale', 'error': 'Parse failed', 'raw': raw_data}
    
    def _parse_analyzer(self, raw_data: str) -> Dict:
        """Parse milk analyzer data"""
        try:
            # Expected format: FAT:4.5,SNF:8.5,TEMP:35.0
            parts = raw_data.split(',')
            data = {'type': 'analyzer', 'timestamp': datetime.now().isoformat()}
            
            for part in parts:
                if ':' in part:
                    key, value = part.split(':')
                    data[key.strip().lower()] = float(value.strip())
            
            return data
        except:
            return {'type': 'analyzer', 'error': 'Parse failed', 'raw': raw_data}
    
    def register_callback(self, device_id: str, callback: Callable):
        """Register callback for device readings"""
        if device_id not in self.callbacks:
            self.callbacks[device_id] = []
        self.callbacks[device_id].append(callback)
    
    def get_latest_reading(self, device_id: str) -> Optional[Dict]:
        """Get latest reading from device"""
        if not IS_DESKTOP or not HAS_SERIAL:
            return None
        
        if device_id not in self.devices:
            return None
        
        device = self.devices[device_id]
        return device.get('last_reading')
    
    def stop_all(self):
        """Stop all devices"""
        self.running = False
        for device_id, device in self.devices.items():
            try:
                if device['connection'] and device['connection'].is_open:
                    device['connection'].close()
            except:
                pass
        print("All hardware devices stopped")
    
    def list_ports(self) -> List[Dict]:
        """List available serial ports"""
        if not IS_DESKTOP or not HAS_SERIAL:
            return []
        
        ports = []
        for port in serial.tools.list_ports.comports():
            ports.append({
                'device': port.device,
                'description': port.description,
                'hwid': port.hwid
            })
        return ports


# Global instance
hardware = HardwareAdapter()


# Convenience functions for routes
def get_latest_weight() -> Optional[float]:
    """Get latest weight reading"""
    if not IS_DESKTOP:
        return None
    
    reading = hardware.get_latest_reading('scale_01')
    if reading and 'weight' in reading:
        return reading['weight']
    return None


def get_latest_analyzer() -> Optional[Dict]:
    """Get latest analyzer reading"""
    if not IS_DESKTOP:
        return None
    
    return hardware.get_latest_reading('analyzer_01')


def start_hardware():
    """Start hardware (desktop only)"""
    if not IS_DESKTOP:
        print("Hardware start skipped (cloud mode)")
        return
    
    hardware.running = True
    
    # Register default devices
    hardware.register_device('scale_01', 'scale', os.getenv('SCALE_PORT', 'COM3'))
    hardware.register_device('analyzer_01', 'analyzer', os.getenv('ANALYZER_PORT', 'COM4'))
    
    # Start reading
    hardware.start_reading('scale_01')
    hardware.start_reading('analyzer_01')


def stop_hardware():
    """Stop hardware"""
    hardware.stop_all()
