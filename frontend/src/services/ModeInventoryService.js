// Mode-based Inventory Validation Service
import { MODE_CONFIG, APP_MODES } from '../contexts/AppModeContext';

class ModeInventoryService {
  // Check if an item can be configured based on current mode
  static canConfigureItem(item, requestedQuantity = 1, currentMode = APP_MODES.TEST) {
    const modeConfig = MODE_CONFIG[currentMode];
    
    // Test and Quotation modes allow unlimited configurations
    if (modeConfig.features.ignoreInventory) {
      return {
        allowed: true,
        reason: `${modeConfig.name} allows unlimited configurations`,
        warning: null
      };
    }
    
    // Manufacturer mode requires real inventory validation
    if (currentMode === APP_MODES.MANUFACTURER) {
      const availableStock = item.stock?.currentQuantity || 0;
      const reservedStock = item.stock?.reservedQuantity || 0;
      const actualAvailable = availableStock - reservedStock;
      
      if (actualAvailable >= requestedQuantity) {
        return {
          allowed: true,
          reason: 'Sufficient inventory available',
          warning: actualAvailable <= item.stock?.reorderLevel ? 
            `Low stock warning: Only ${actualAvailable} units remaining` : null
        };
      } else {
        return {
          allowed: false,
          reason: `Insufficient inventory. Available: ${actualAvailable}, Required: ${requestedQuantity}`,
          warning: 'Cannot proceed in Manufacturer mode without sufficient stock'
        };
      }
    }
    
    return { allowed: true, reason: 'Default allowed', warning: null };
  }
  
  // Get inventory warnings based on mode
  static getInventoryWarnings(items, currentMode = APP_MODES.TEST) {
    const modeConfig = MODE_CONFIG[currentMode];
    const warnings = [];
    
    if (!modeConfig.features.showInventoryWarnings) {
      return warnings;
    }
    
    items.forEach(item => {
      const availableStock = item.stock?.currentQuantity || 0;
      const reorderLevel = item.stock?.reorderLevel || 5;
      
      if (availableStock === 0) {
        warnings.push({
          type: 'out-of-stock',
          itemId: item._id,
          itemName: item.name,
          message: `${item.name} is out of stock`,
          severity: 'high'
        });
      } else if (availableStock <= reorderLevel) {
        warnings.push({
          type: 'low-stock',
          itemId: item._id,
          itemName: item.name,
          message: `${item.name} is running low (${availableStock} units remaining)`,
          severity: 'medium'
        });
      }
    });
    
    return warnings;
  }
  
  // Generate configuration export data based on mode
  static generateConfigurationExport(configurations, currentMode = APP_MODES.TEST) {
    const modeConfig = MODE_CONFIG[currentMode];
    const timestamp = new Date().toISOString();
    
    const exportData = {
      metadata: {
        mode: currentMode,
        modeName: modeConfig.name,
        exportDate: timestamp,
        totalConfigurations: configurations.length,
        validatedForProduction: currentMode === APP_MODES.MANUFACTURER
      },
      configurations: configurations.map(config => ({
        ...config,
        mode: currentMode,
        inventoryValidated: currentMode === APP_MODES.MANUFACTURER,
        exportTimestamp: timestamp
      }))
    };
    
    if (currentMode === APP_MODES.MANUFACTURER) {
      // Add production-specific metadata
      exportData.metadata.productionReady = true;
      exportData.metadata.inventorySnapshot = configurations.map(config => ({
        configId: config.id,
        requiredItems: config.items || [],
        stockValidation: 'verified'
      }));
    }
    
    return exportData;
  }
  
  // Reserve inventory for confirmed configurations (Manufacturer mode only)
  static async reserveInventoryForConfiguration(configuration, currentMode = APP_MODES.TEST) {
    if (currentMode !== APP_MODES.MANUFACTURER) {
      return {
        success: true,
        message: `No reservation needed in ${MODE_CONFIG[currentMode].name}`,
        reservations: []
      };
    }
    
    const reservations = [];
    const errors = [];
    
    for (const item of configuration.items || []) {
      try {
        // In a real implementation, this would make API calls to reserve stock
        const reservationResult = await this.createStockReservation(item.id, item.quantity);
        reservations.push(reservationResult);
      } catch (error) {
        errors.push({
          itemId: item.id,
          error: error.message
        });
      }
    }
    
    return {
      success: errors.length === 0,
      message: errors.length === 0 ? 'All items reserved successfully' : 'Some reservations failed',
      reservations,
      errors
    };
  }
  
  // Mock stock reservation function (would be replaced with actual API call)
  static async createStockReservation(itemId, quantity) {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          itemId,
          quantity,
          reservationId: `RES-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          reservedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        });
      }, 100);
    });
  }
  
  // Get mode-specific dashboard statistics
  static getModeSpecificStats(inventory, currentMode = APP_MODES.TEST) {
    const modeConfig = MODE_CONFIG[currentMode];
    const baseStats = {
      totalItems: inventory.length,
      totalValue: inventory.reduce((sum, item) => sum + (item.pricing?.unitPrice || 0) * (item.stock?.currentQuantity || 0), 0)
    };
    
    if (modeConfig.features.showInventoryWarnings) {
      const lowStockItems = inventory.filter(item => 
        (item.stock?.currentQuantity || 0) <= (item.stock?.reorderLevel || 5)
      );
      const outOfStockItems = inventory.filter(item => 
        (item.stock?.currentQuantity || 0) === 0
      );
      
      return {
        ...baseStats,
        lowStockCount: lowStockItems.length,
        outOfStockCount: outOfStockItems.length,
        lowStockItems,
        outOfStockItems
      };
    }
    
    return baseStats;
  }
}

export default ModeInventoryService;