const mongoose = require('mongoose');
const InventoryCategory = require('./models/InventoryCategory');
const InventoryItem = require('./models/InventoryItem');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mern-app');
    console.log('MongoDB connected for seeding');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Seed data for categories
const seedCategories = [
  {
    name: 'Window Types',
    code: 'WINDOW_TYPE',
    type: 'window_type',
    description: 'Different types of windows available',
    specifications: {
      properties: [
        { key: 'operationType', label: 'Operation Type', type: 'string', options: ['manual', 'automatic'] },
        { key: 'ventilationType', label: 'Ventilation Type', type: 'string', options: ['natural', 'mechanical'] },
        { key: 'securityRating', label: 'Security Rating', type: 'string', options: ['standard', 'high', 'maximum'] }
      ]
    }
  },
  {
    name: 'Glass Types',
    code: 'GLASS_TYPE',
    type: 'glass_type',
    description: 'Various glass specifications and types',
    specifications: {
      properties: [
        { key: 'thickness', label: 'Thickness', type: 'number', unit: 'mm' },
        { key: 'transparency', label: 'Transparency', type: 'string', options: ['clear', 'translucent', 'opaque'] },
        { key: 'coating', label: 'Coating Type', type: 'string', options: ['none', 'low_e', 'reflective', 'tinted'] }
      ]
    }
  },
  {
    name: 'Frame Materials',
    code: 'FRAME_MAT',
    type: 'frame_material',
    description: 'Window frame materials and finishes',
    specifications: {
      properties: [
        { key: 'durability', label: 'Durability Rating', type: 'string', options: ['standard', 'high', 'premium'] },
        { key: 'maintenance', label: 'Maintenance Level', type: 'string', options: ['low', 'medium', 'high'] },
        { key: 'weatherResistance', label: 'Weather Resistance', type: 'string', options: ['good', 'excellent', 'superior'] }
      ]
    }
  },
  {
    name: 'Grille Patterns',
    code: 'GRILLE_PAT',
    type: 'grille_pattern',
    description: 'Decorative grille patterns and designs',
    specifications: {
      properties: [
        { key: 'installationType', label: 'Installation Type', type: 'string', options: ['internal', 'external', 'between_glass'] },
        { key: 'material', label: 'Grille Material', type: 'string', options: ['aluminum', 'vinyl', 'wood'] },
        { key: 'removable', label: 'Removable', type: 'boolean' }
      ]
    }
  },
  {
    name: 'Color Options',
    code: 'COLOR_OPT',
    type: 'color_option',
    description: 'Available color options for frames and components',
    specifications: {
      properties: [
        { key: 'finish', label: 'Finish Type', type: 'string', options: ['matte', 'glossy', 'satin', 'textured'] },
        { key: 'fadeResistance', label: 'Fade Resistance', type: 'string', options: ['standard', 'enhanced', 'premium'] },
        { key: 'customizable', label: 'Customizable', type: 'boolean' }
      ]
    }
  }
];

// Seed data for inventory items
const seedInventoryItems = [
  // Window Types
  {
    name: 'Sliding Window - Standard',
    sku: 'WIN-SLD-STD-001',
    categoryType: 'window_type',
    specifications: {
      windowType: 'sliding',
      dimensions: {
        width: { min: 600, max: 3000, standard: 1200, unit: 'mm' },
        height: { min: 400, max: 2500, standard: 1500, unit: 'mm' },
        depth: { min: 50, max: 150, standard: 100, unit: 'mm' }
      },
      performance: {
        thermalRating: 4.5,
        soundReduction: 35,
        waterResistance: 9,
        windResistance: 8,
        energyRating: 'A'
      }
    },
    stock: { currentQuantity: 20, reorderLevel: 5, reorderQuantity: 20 },
    pricing: { unitPrice: 15000, costPrice: 12000, currency: 'INR' },
    description: 'Standard sliding window with aluminum frame'
  },
  {
    name: 'Casement Window - Premium',
    sku: 'WIN-CAS-PRM-001',
    categoryType: 'window_type',
    specifications: {
      windowType: 'casement',
      dimensions: {
        width: { min: 500, max: 2500, standard: 1000, unit: 'mm' },
        height: { min: 600, max: 2800, standard: 1600, unit: 'mm' },
        depth: { min: 60, max: 160, standard: 120, unit: 'mm' }
      },
      performance: {
        thermalRating: 5.0,
        soundReduction: 40,
        waterResistance: 10,
        windResistance: 9,
        energyRating: 'A+'
      }
    },
    stock: { currentQuantity: 20, reorderLevel: 5, reorderQuantity: 20 },
    pricing: { unitPrice: 18000, costPrice: 14500, currency: 'INR' },
    description: 'Premium casement window with enhanced security features'
  },
  {
    name: 'Bay Window - 3 Panel',
    sku: 'WIN-BAY-3PN-001',
    categoryType: 'window_type',
    specifications: {
      windowType: 'bay',
      dimensions: {
        width: { min: 1800, max: 4500, standard: 3000, unit: 'mm' },
        height: { min: 800, max: 2500, standard: 1800, unit: 'mm' },
        depth: { min: 300, max: 800, standard: 500, unit: 'mm' }
      },
      performance: {
        thermalRating: 4.8,
        soundReduction: 38,
        waterResistance: 9,
        windResistance: 7,
        energyRating: 'A'
      }
    },
    stock: { currentQuantity: 20, reorderLevel: 3, reorderQuantity: 15 },
    pricing: { unitPrice: 45000, costPrice: 36000, currency: 'INR' },
    description: '3-panel bay window with 30-degree angle configuration'
  },
  {
    name: 'Double Hung Window - Traditional',
    sku: 'WIN-DHG-TRD-001',
    categoryType: 'window_type',
    specifications: {
      windowType: 'double_hung',
      dimensions: {
        width: { min: 600, max: 1500, standard: 900, unit: 'mm' },
        height: { min: 800, max: 2200, standard: 1400, unit: 'mm' },
        depth: { min: 80, max: 180, standard: 120, unit: 'mm' }
      },
      performance: {
        thermalRating: 4.6,
        soundReduction: 36,
        waterResistance: 8,
        windResistance: 8,
        energyRating: 'A'
      }
    },
    stock: { currentQuantity: 20, reorderLevel: 5, reorderQuantity: 20 },
    pricing: { unitPrice: 22000, costPrice: 17500, currency: 'INR' },
    description: 'Traditional double hung window with balanced operation'
  },

  // Glass Types
  {
    name: 'Single Glazed Clear Glass - 6mm',
    sku: 'GLS-SNG-CLR-6MM',
    categoryType: 'glass_type',
    specifications: {
      glassType: 'single',
      thickness: 6,
      performance: {
        thermalRating: 2.0,
        soundReduction: 20,
        energyRating: 'C'
      }
    },
    stock: { currentQuantity: 20, reorderLevel: 8, reorderQuantity: 30 },
    pricing: { unitPrice: 350, costPrice: 280, currency: 'INR' },
    description: 'Standard 6mm clear float glass for single glazing',
    unit: 'sq.ft'
  },
  {
    name: 'Double Glazed Low-E Glass - 4mm+12mm+4mm',
    sku: 'GLS-DBL-LOE-4124',
    categoryType: 'glass_type',
    specifications: {
      glassType: 'double',
      thickness: 20, // Total unit thickness
      performance: {
        thermalRating: 4.2,
        soundReduction: 32,
        energyRating: 'A'
      }
    },
    stock: { currentQuantity: 20, reorderLevel: 6, reorderQuantity: 25 },
    pricing: { unitPrice: 850, costPrice: 680, currency: 'INR' },
    description: 'Double glazed unit with Low-E coating and argon gas fill',
    unit: 'sq.ft'
  },
  {
    name: 'Laminated Safety Glass - 6.38mm',
    sku: 'GLS-LAM-SAF-638',
    categoryType: 'glass_type',
    specifications: {
      glassType: 'laminated',
      thickness: 6.38,
      performance: {
        thermalRating: 2.5,
        soundReduction: 35,
        energyRating: 'B'
      }
    },
    stock: { currentQuantity: 20, reorderLevel: 6, reorderQuantity: 25 },
    pricing: { unitPrice: 650, costPrice: 520, currency: 'INR' },
    description: 'Laminated safety glass with PVB interlayer',
    unit: 'sq.ft'
  },

  // Frame Materials
  {
    name: 'Aluminum Frame - Powder Coated',
    sku: 'FRM-ALU-PWD-001',
    categoryType: 'frame_material',
    specifications: {
      frameMaterial: 'aluminum',
      finish: 'powder_coated',
      performance: {
        thermalRating: 3.5,
        weatherResistance: 9
      }
    },
    stock: { currentQuantity: 20, reorderLevel: 8, reorderQuantity: 30 },
    pricing: { unitPrice: 2500, costPrice: 2000, currency: 'INR' },
    description: 'High-grade aluminum frame with powder coating finish',
    unit: 'linear_meter'
  },
  {
    name: 'uPVC Frame - Multi-Chamber',
    sku: 'FRM-UPC-MLC-001',
    categoryType: 'frame_material',
    specifications: {
      frameMaterial: 'upvc',
      finish: 'natural',
      performance: {
        thermalRating: 4.8,
        weatherResistance: 10
      }
    },
    stock: { currentQuantity: 20, reorderLevel: 6, reorderQuantity: 25 },
    pricing: { unitPrice: 3200, costPrice: 2550, currency: 'INR' },
    description: 'Multi-chamber uPVC frame for superior insulation',
    unit: 'linear_meter'
  },
  {
    name: 'Wooden Frame - Teak',
    sku: 'FRM-WOD-TEK-001',
    categoryType: 'frame_material',
    specifications: {
      frameMaterial: 'wooden',
      finish: 'natural',
      performance: {
        thermalRating: 4.2,
        weatherResistance: 7
      }
    },
    stock: { currentQuantity: 20, reorderLevel: 4, reorderQuantity: 15 },
    pricing: { unitPrice: 8500, costPrice: 6800, currency: 'INR' },
    description: 'Premium teak wood frame with natural finish',
    unit: 'linear_meter'
  },

  // Grille Patterns
  {
    name: 'Colonial Grille Pattern',
    sku: 'GRL-COL-STD-001',
    categoryType: 'grille_pattern',
    specifications: {
      grillePattern: 'colonial',
      grilleWidth: 25
    },
    stock: { currentQuantity: 20, reorderLevel: 10, reorderQuantity: 40 },
    pricing: { unitPrice: 1200, costPrice: 960, currency: 'INR' },
    description: 'Traditional colonial grid pattern with 25mm bars',
    unit: 'sq.ft'
  },
  {
    name: 'Prairie Style Grille',
    sku: 'GRL-PRA-STY-001',
    categoryType: 'grille_pattern',
    specifications: {
      grillePattern: 'prairie',
      grilleWidth: 20
    },
    stock: { currentQuantity: 20, reorderLevel: 8, reorderQuantity: 30 },
    pricing: { unitPrice: 1400, costPrice: 1120, currency: 'INR' },
    description: 'Modern prairie style grille with clean lines',
    unit: 'sq.ft'
  },

  // Color Options
  {
    name: 'White - Standard',
    sku: 'COL-WHT-STD-001',
    categoryType: 'color_option',
    specifications: {
      colorCode: '#FFFFFF',
      colorFamily: 'white'
    },
    stock: { currentQuantity: 20, reorderLevel: 15, reorderQuantity: 50 },
    pricing: { unitPrice: 0, costPrice: 0, currency: 'INR' },
    description: 'Standard white color - no additional cost',
    unit: 'application'
  },
  {
    name: 'Bronze Anodized',
    sku: 'COL-BRZ-ANO-001',
    categoryType: 'color_option',
    specifications: {
      colorCode: '#CD7F32',
      colorFamily: 'bronze'
    },
    stock: { currentQuantity: 20, reorderLevel: 8, reorderQuantity: 30 },
    pricing: { unitPrice: 850, costPrice: 680, currency: 'INR' },
    description: 'Premium bronze anodized finish',
    unit: 'sq.ft'
  },
  {
    name: 'Charcoal Grey',
    sku: 'COL-CHR-GRY-001',
    categoryType: 'color_option',
    specifications: {
      colorCode: '#36454F',
      colorFamily: 'grey'
    },
    stock: { currentQuantity: 20, reorderLevel: 8, reorderQuantity: 30 },
    pricing: { unitPrice: 600, costPrice: 480, currency: 'INR' },
    description: 'Modern charcoal grey powder coating',
    unit: 'sq.ft'
  }
];

// Function to seed categories
const seedCategoriesData = async () => {
  try {
    // Clear existing categories
    await InventoryCategory.deleteMany({});
    console.log('Cleared existing categories');

    // Insert seed categories
    for (const categoryData of seedCategories) {
      const category = new InventoryCategory(categoryData);
      await category.save();
      console.log(`Created category: ${category.name}`);
    }

    return await InventoryCategory.find({});
  } catch (error) {
    console.error('Error seeding categories:', error);
    throw error;
  }
};

// Function to seed inventory items
const seedInventoryData = async (categories) => {
  try {
    // Clear existing inventory items
    await InventoryItem.deleteMany({});
    console.log('Cleared existing inventory items');

    // Create a category lookup map
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.type] = cat._id;
    });

    // Insert seed inventory items
    for (const itemData of seedInventoryItems) {
      const item = new InventoryItem({
        ...itemData,
        category: categoryMap[itemData.categoryType],
        supplier: {
          name: 'Default Supplier Ltd.',
          contactPerson: 'John Doe',
          phone: '+91-9876543210',
          email: 'supplier@example.com',
          leadTime: 7
        },
        location: {
          warehouse: 'Main Warehouse',
          section: 'A',
          row: '1',
          shelf: '1'
        }
      });

      await item.save();
      console.log(`Created inventory item: ${item.name} (SKU: ${item.sku})`);
    }

    console.log(`\n✅ Seeded ${seedInventoryItems.length} inventory items successfully!`);
  } catch (error) {
    console.error('Error seeding inventory items:', error);
    throw error;
  }
};

// Main seeding function
const seedDatabase = async () => {
  try {
    await connectDB();
    
    console.log('🌱 Starting database seeding...\n');
    
    // Seed categories first
    console.log('📁 Seeding categories...');
    const categories = await seedCategoriesData();
    console.log(`✅ Seeded ${categories.length} categories successfully!\n`);
    
    // Then seed inventory items
    console.log('📦 Seeding inventory items...');
    await seedInventoryData(categories);
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Categories: ${categories.length}`);
    console.log(`- Inventory Items: ${seedInventoryItems.length}`);
    console.log('- Default stock per item: 20 units');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
};

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, seedCategories, seedInventoryItems };