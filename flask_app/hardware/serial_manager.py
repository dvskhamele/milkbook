"""
MilkRecord Serial Manager - Production Grade
Handles all hardware communication with stability and safety
"""

import serial
import serial.tools.list_ports
import threading
import queue
import time
import logging
from datetime import datetime
from typing import Dict, Optional, List, Callable
from dataclasses import dataclass, field
from enum import Enum
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DeviceType(Enum):
    """Supported hardware device types"""
    WEIGHING_SCALE = "weighing_scale"
    MILK_ANALYZER = "milk_analyzer"
    THERMAL_PRINTER = "thermal_printer"
    UNKNOWN = "unknown"

@dataclass
class DeviceConfig:
    """Device configuration"""
    device_id: str
    device_type: DeviceType
    port: str
    baudrate: int = 9600
    timeout: float = 1.0
    enabled: bool = True
    
@dataclass
class DeviceReading:
    """Standardized device reading"""
    device_id: str
    timestamp: datetime
    value: float
    unit: str
    is_stable: bool = False
    raw_data: str = ""
    quality_score: float = 0.0

@dataclass
class AnalyzerReading:
    """Milk analyzer specific reading"""
    device_id: str
    timestamp: datetime
    fat: float = 0.0
    snf: float = 0.0
    temperature: float = 0.0
    density: float = 0.0
    is_valid: bool = False
    raw_data: str = ""

class SerialStabilityFilter:
    """
    Implements stability filtering for serial readings
    Requires 3 consecutive identical readings before accepting
    """
    
    def __init__(self, required_consecutive: int = 3, tolerance: float = 0.01):
        self.required_consecutive = required_consecutive
        self.tolerance = tolerance
        self.reading_history: List[float] = []
        self.last_stable_value: Optional[float] = None
        
    def add_reading(self, value: float) -> tuple[bool, Optional[float]]:
        """
        Add reading and check if stable
        Returns: (is_stable, stable_value)
        """
        self.reading_history.append(value)
        
        # Keep only recent history
        if len(self.reading_history) > self.required_consecutive * 2:
            self.reading_history.pop(0)
        
        # Check if we have enough readings
        if len(self.reading_history) < self.required_consecutive:
            return False, None
        
        # Check last N readings for stability
        recent = self.reading_history[-self.required_consecutive:]
        
        # Check if all readings are within tolerance
        is_stable = all(abs(recent[i] - recent[i+1]) < self.tolerance 
                       for i in range(len(recent)-1))
        
        if is_stable:
            stable_value = sum(recent) / len(recent)  # Average
            self.last_stable_value = stable_value
            self.reading_history.clear()  # Reset for next reading
            return True, stable_value
        
        return False, None
    
    def reset(self):
        """Reset filter state"""
        self.reading_history.clear()
        self.last_stable_value = None

class SerialDeviceManager:
    """
    Manages serial communication with hardware devices
    Thread-safe, non-blocking operation
    """
    
    def __init__(self):
        self.devices: Dict[str, DeviceConfig] = {}
        self.serial_connections: Dict[str, serial.Serial] = {}
        self.reading_queues: Dict[str, queue.Queue] = {}
        self.threads: Dict[str, threading.Thread] = {}
        self.running = False
        self.stability_filters: Dict[str, SerialStabilityFilter] = {}
        self.callbacks: Dict[str, List[Callable]] = {}
        self.device_health: Dict[str, dict] = {}
        
    def register_device(self, config: DeviceConfig):
        """Register a new device"""
        self.devices[config.device_id] = config
        self.reading_queues[config.device_id] = queue.Queue(maxsize=100)
        self.stability_filters[config.device_id] = SerialStabilityFilter()
        self.callbacks[config.device_id] = []
        self.device_health[config.device_id] = {
            'status': 'registered',
            'last_seen': None,
            'packets_received': 0,
            'errors': 0
        }
        logger.info(f"Registered device: {config.device_id} ({config.device_type.value})")
    
    def register_callback(self, device_id: str, callback: Callable):
        """Register callback for device readings"""
        if device_id in self.callbacks:
            self.callbacks[device_id].append(callback)
    
    def start_device(self, device_id: str):
        """Start reading from a device"""
        if device_id not in self.devices:
            logger.error(f"Device {device_id} not registered")
            return
        
        config = self.devices[device_id]
        
        if not config.enabled:
            logger.warning(f"Device {device_id} is disabled")
            return
        
        try:
            # Open serial connection
            ser = serial.Serial(
                port=config.port,
                baudrate=config.baudrate,
                timeout=config.timeout
            )
            self.serial_connections[device_id] = ser
            
            # Start reading thread
            self.running = True
            thread = threading.Thread(
                target=self._read_device_loop,
                args=(device_id,),
                daemon=True
            )
            self.threads[device_id] = thread
            thread.start()
            
            logger.info(f"Started device: {device_id} on {config.port}")
            self.device_health[device_id]['status'] = 'running'
            
        except serial.SerialException as e:
            logger.error(f"Failed to start device {device_id}: {e}")
            self.device_health[device_id]['status'] = 'error'
            self.device_health[device_id]['error'] = str(e)
    
    def _read_device_loop(self, device_id: str):
        """
        Background thread for reading from device
        Implements stability filtering and error handling
        """
        config = self.devices[device_id]
        ser = self.serial_connections.get(device_id)
        filter = self.stability_filters[device_id]
        
        while self.running and ser and ser.is_open:
            try:
                if ser.in_waiting > 0:
                    # Read raw data
                    raw_data = ser.readline().decode('utf-8', errors='ignore').strip()
                    
                    if raw_data:
                        # Update health
                        self.device_health[device_id]['last_seen'] = datetime.now()
                        self.device_health[device_id]['packets_received'] += 1
                        
                        # Parse based on device type
                        if config.device_type == DeviceType.WEIGHING_SCALE:
                            self._process_scale_reading(device_id, raw_data, filter)
                        elif config.device_type == DeviceType.MILK_ANALYZER:
                            self._process_analyzer_reading(device_id, raw_data)
                        
            except Exception as e:
                logger.error(f"Error reading {device_id}: {e}")
                self.device_health[device_id]['errors'] += 1
                time.sleep(0.1)  # Brief pause on error
        
        logger.info(f"Stopped reading from {device_id}")
    
    def _process_scale_reading(self, device_id: str, raw_data: str, filter: SerialStabilityFilter):
        """Process weighing scale reading with stability filter"""
        try:
            # Parse weight value (adjust parsing based on your scale format)
            # Example formats: "12.34 kg", "12.34", "ST,12.34,kg"
            weight_str = raw_data.replace('kg', '').replace('ST', '').strip()
            weight = float(weight_str)
            
            # Apply stability filter
            is_stable, stable_value = filter.add_reading(weight)
            
            if is_stable and stable_value is not None:
                reading = DeviceReading(
                    device_id=device_id,
                    timestamp=datetime.now(),
                    value=stable_value,
                    unit='kg',
                    is_stable=True,
                    raw_data=raw_data,
                    quality_score=1.0
                )
                
                # Put in queue
                self.reading_queues[device_id].put(reading)
                
                # Call callbacks
                for callback in self.callbacks[device_id]:
                    try:
                        callback(reading)
                    except Exception as e:
                        logger.error(f"Callback error: {e}")
                
                logger.debug(f"Stable weight: {stable_value} kg")
                
        except (ValueError, IndexError) as e:
            logger.warning(f"Failed to parse scale reading '{raw_data}': {e}")
    
    def _process_analyzer_reading(self, device_id: str, raw_data: str):
        """Process milk analyzer reading"""
        try:
            # Parse analyzer data (adjust based on your analyzer format)
            # Example: "FAT:4.5,SNF:8.5,TEMP:35.0"
            parts = raw_data.split(',')
            data = {}
            for part in parts:
                if ':' in part:
                    key, value = part.split(':')
                    data[key.strip().lower()] = float(value.strip())
            
            reading = AnalyzerReading(
                device_id=device_id,
                timestamp=datetime.now(),
                fat=data.get('fat', 0.0),
                snf=data.get('snf', 0.0),
                temperature=data.get('temp', 0.0),
                density=data.get('density', 0.0),
                is_valid=True,
                raw_data=raw_data
            )
            
            # Put in queue
            self.reading_queues[device_id].put(reading)
            
            # Call callbacks
            for callback in self.callbacks[device_id]:
                try:
                    callback(reading)
                except Exception as e:
                    logger.error(f"Callback error: {e}")
            
            logger.debug(f"Analyzer: FAT={reading.fat}, SNF={reading.snf}")
            
        except Exception as e:
            logger.warning(f"Failed to parse analyzer reading '{raw_data}': {e}")
    
    def get_latest_reading(self, device_id: str, timeout: float = 0.1) -> Optional:
        """Get latest reading from device (non-blocking)"""
        if device_id not in self.reading_queues:
            return None
        
        try:
            reading = self.reading_queues[device_id].get_nowait()
            return reading
        except queue.Empty:
            return None
    
    def stop_device(self, device_id: str):
        """Stop reading from device"""
        if device_id in self.threads:
            self.running = False
            self.threads[device_id].join(timeout=2.0)
        
        if device_id in self.serial_connections:
            ser = self.serial_connections[device_id]
            if ser and ser.is_open:
                ser.close()
        
        if device_id in self.device_health:
            self.device_health[device_id]['status'] = 'stopped'
        
        logger.info(f"Stopped device: {device_id}")
    
    def stop_all(self):
        """Stop all devices"""
        self.running = False
        for device_id in list(self.devices.keys()):
            self.stop_device(device_id)
        logger.info("All devices stopped")
    
    def get_device_health(self, device_id: str) -> dict:
        """Get device health status"""
        return self.device_health.get(device_id, {})
    
    def list_available_ports(self) -> List[dict]:
        """List available serial ports"""
        ports = []
        for port in serial.tools.list_ports.comports():
            ports.append({
                'device': port.device,
                'description': port.description,
                'hwid': port.hwid,
                'available': True
            })
        return ports

# Global instance
serial_manager = SerialDeviceManager()

# Convenience functions
def get_manager() -> SerialDeviceManager:
    """Get global serial manager instance"""
    return serial_manager

def init_default_devices():
    """Initialize default device configuration"""
    # Weighing Scale
    scale_config = DeviceConfig(
        device_id="scale_01",
        device_type=DeviceType.WEIGHING_SCALE,
        port="/dev/ttyUSB0",  # Adjust for your system
        baudrate=9600
    )
    serial_manager.register_device(scale_config)
    
    # Milk Analyzer
    analyzer_config = DeviceConfig(
        device_id="analyzer_01",
        device_type=DeviceType.MILK_ANALYZER,
        port="/dev/ttyUSB1",  # Adjust for your system
        baudrate=9600
    )
    serial_manager.register_device(analyzer_config)
    
    logger.info("Default devices initialized")
