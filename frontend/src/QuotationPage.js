import React, { useState, useRef, useEffect } from 'react';
import './QuotationPage.css';
import ClientService from './services/ClientService';
import InventoryService from './services/InventoryService';
import { generateQuotationPDF } from './utils/pdfGenerator';

// Window Types Configuration
const WINDOW_TYPES = {
  sliding: {
    name: 'Sliding Windows',
    icon: '↔️',
    description: 'Horizontal sliding windows with multiple tracks',
    defaultSpecs: {
      panels: 2,
      tracks: 1,
      openingType: 'horizontal',
      fixedPanels: []
    }
  },
  casement: {
    name: 'Casement Windows',
    icon: '🔄',
    description: 'Side-hinged windows that open outward',
    defaultSpecs: {
      panels: 1,
      tracks: 1,
      openingType: 'side',
      fixedPanels: []
    }
  },
  bay: {
    name: 'Bay Windows',
    icon: '🏠',
    description: 'Protruding windows with multiple angles',
    defaultSpecs: {
      panels: 3,
      tracks: 1,
      openingType: 'side',
      fixedPanels: ['center']
    }
  },
  fixed: {
    name: 'Fixed Windows',
    icon: '⬜',
    description: 'Non-opening windows for light and view',
    defaultSpecs: {
      panels: 1,
      tracks: 0,
      openingType: 'none',
      fixedPanels: ['all']
    }
  },
  awning: {
    name: 'Awning Windows',
    icon: '📐',
    description: 'Top-hinged windows that open outward',
    defaultSpecs: {
      panels: 1,
      tracks: 1,
      openingType: 'top',
      fixedPanels: []
    }
  },
  picture: {
    name: 'Picture Windows',
    icon: '🖼️',
    description: 'Large fixed windows for unobstructed views',
    defaultSpecs: {
      panels: 1,
      tracks: 0,
      openingType: 'none',
      fixedPanels: ['all']
    }
  },
  doubleHung: {
    name: 'Double Hung Windows',
    icon: '↕️',
    description: 'Two vertically sliding sashes',
    defaultSpecs: {
      panels: 2,
      tracks: 2,
      openingType: 'vertical',
      fixedPanels: []
    }
  },
  singleHung: {
    name: 'Single Hung Windows',
    icon: '⬇️',
    description: 'Bottom sash slides up, top is fixed',
    defaultSpecs: {
      panels: 2,
      tracks: 1,
      openingType: 'vertical',
      fixedPanels: ['top']
    }
  },
  pivot: {
    name: 'Pivot Windows',
    icon: '🔄',
    description: 'Central pivot rotation mechanism',
    defaultSpecs: {
      panels: 1,
      tracks: 1,
      openingType: 'pivot',
      fixedPanels: []
    }
  },
  metal: {
    name: 'Metal Windows',
    icon: '🔧',
    description: 'Industrial style metal frame windows',
    defaultSpecs: {
      panels: 1,
      tracks: 1,
      openingType: 'side',
      fixedPanels: []
    }
  },
  louvered: {
    name: 'Louvered Windows',
    icon: '📏',
    description: 'Multiple horizontal slats for ventilation',
    defaultSpecs: {
      panels: 8,
      tracks: 1,
      openingType: 'slats',
      fixedPanels: []
    }
  },
  glassBlock: {
    name: 'Glass Block Windows',
    icon: '⬛',
    description: 'Decorative glass blocks for privacy',
    defaultSpecs: {
      panels: 1,
      tracks: 0,
      openingType: 'none',
      fixedPanels: ['all']
    }
  }
};

// Glass Options
const GLASS_OPTIONS = [
  { value: 'clear-5mm', label: '5mm Clear Glass', thickness: 5, price: 150 },
  { value: 'clear-6mm', label: '6mm Clear Glass', thickness: 6, price: 180 },
  { value: 'clear-8mm', label: '8mm Clear Glass', thickness: 8, price: 220 },
  { value: 'toughened-5mm', label: '5mm Toughened Glass', thickness: 5, price: 200 },
  { value: 'toughened-6mm', label: '6mm Toughened Glass', thickness: 6, price: 240 },
  { value: 'toughened-8mm', label: '8mm Toughened Glass', thickness: 8, price: 300 },
  { value: 'laminated-6mm', label: '6mm Laminated Glass', thickness: 6, price: 350 },
  { value: 'laminated-8mm', label: '8mm Laminated Glass', thickness: 8, price: 420 },
  { value: 'double-glazed', label: 'Double Glazed Unit', thickness: 24, price: 800 }
];

// Lock Options
const LOCK_OPTIONS = [
  { value: 'none', label: 'No Lock', position: 'none' },
  { value: 'left-handle', label: 'Left Side Handle Lock', position: 'left' },
  { value: 'right-handle', label: 'Right Side Handle Lock', position: 'right' },
  { value: 'top-lock', label: 'Top Lock', position: 'top' },
  { value: 'bottom-lock', label: 'Bottom Lock', position: 'bottom' },
  { value: 'multi-point', label: 'Multi-Point Lock', position: 'multi' },
  { value: 'concealed', label: 'Concealed Lock', position: 'concealed' }
];

// Frame Materials
const FRAME_MATERIALS = [
  { value: 'aluminum', label: 'Aluminum', priceMultiplier: 1.0 },
  { value: 'upvc', label: 'uPVC', priceMultiplier: 1.2 },
  { value: 'wooden', label: 'Wooden', priceMultiplier: 1.8 },
  { value: 'steel', label: 'Steel', priceMultiplier: 0.9 },
  { value: 'composite', label: 'Composite', priceMultiplier: 1.5 }
];

// Color Options
const COLOR_OPTIONS = [
  { value: 'white', label: 'White', hex: '#FFFFFF' },
  { value: 'black', label: 'Black', hex: '#000000' },
  { value: 'brown', label: 'Brown', hex: '#8B4513' },
  { value: 'grey', label: 'Grey', hex: '#808080' },
  { value: 'green', label: 'Green', hex: '#008000' },
  { value: 'blue', label: 'Blue', hex: '#0000FF' },
  { value: 'bronze', label: 'Bronze', hex: '#CD7F32' },
  { value: 'silver', label: 'Silver', hex: '#C0C0C0' }
];

const QuotationPage = () => {
  const [clients, setClients] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [quotationData, setQuotationData] = useState({
    quotationNumber: `QT-${Date.now()}`,
    project: '',
    date: new Date().toLocaleDateString('en-GB'),
    companyDetails: {
      name: 'ADS SYSTEMS',
      phone: '9574544012',
      email: 'support@adssystem.co.in',
      website: 'adssystem.co.in',
      gstin: '24APJPP8011N1ZK'
    },
    clientDetails: {
      name: '',
      address: ''
    },
    windowSpecs: []
  });

  const [currentWindow, setCurrentWindow] = useState({
    id: '',
    type: 'sliding',
    name: '',
    location: '',
    dimensions: {
      width: 1000,
      height: 1000,
      radius: 0 // for bay windows
    },
    specifications: {
      glass: 'clear-5mm',
      glassThickness: 5,
      lock: 'right-handle',
      lockPosition: 'right',
      openingType: 'horizontal',
      fixedPanels: [],
      grille: {
        enabled: false,
        style: 'rectangular',
        pattern: 'grid'
      },
      frame: {
        material: 'aluminum',
        color: 'white',
        customColor: ''
      },
      panels: 2,
      tracks: 1
    },
    pricing: {
      basePrice: 5000,
      sqFtPrice: 450,
      quantity: 1,
      customPricing: false
    },
    computedValues: {
      sqFtPerWindow: 0,
      totalPrice: 0,
      weight: 0
    }
  });

  const [editingIndex, setEditingIndex] = useState(-1);

  // Load clients and inventory on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [clientsData, inventoryData] = await Promise.all([
          ClientService.getAllClients(),
          InventoryService.getAllInventory()
        ]);
        setClients(clientsData);
        setInventory(inventoryData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Calculate window dimensions and pricing
  useEffect(() => {
    const { width, height } = currentWindow.dimensions;
    const sqFt = (width * height) / 144000; // Convert mm² to sq ft
    const glassOption = GLASS_OPTIONS.find(g => g.value === currentWindow.specifications.glass);
    const frameOption = FRAME_MATERIALS.find(f => f.value === currentWindow.specifications.frame.material);
    
    let basePrice = currentWindow.pricing.basePrice;
    let sqFtPrice = currentWindow.pricing.sqFtPrice;
    
    if (glassOption) {
      sqFtPrice += glassOption.price;
    }
    
    if (frameOption) {
      basePrice *= frameOption.priceMultiplier;
    }
    
    const totalPrice = (basePrice + (sqFt * sqFtPrice)) * currentWindow.pricing.quantity;
    const weight = sqFt * 15; // Approximate weight calculation
    
    setCurrentWindow(prev => ({
      ...prev,
      computedValues: {
        sqFtPerWindow: sqFt,
        totalPrice: totalPrice,
        weight: weight
      }
    }));
  }, [
    currentWindow.dimensions,
    currentWindow.specifications.glass,
    currentWindow.specifications.frame,
    currentWindow.pricing.basePrice,
    currentWindow.pricing.sqFtPrice,
    currentWindow.pricing.quantity
  ]);

  const calculateQuoteTotal = () => {
    return quotationData.windowSpecs.reduce((total, spec) => 
      total + (spec.computedValues.totalPrice || 0), 0
    );
  };

  const calculateGST = () => {
    return calculateQuoteTotal() * 0.18;
  };

  const calculateGrandTotal = () => {
    return calculateQuoteTotal() + calculateGST() + 2000; // Including transport
  };

  const addWindowToQuote = () => {
    if (!currentWindow.name || !currentWindow.location) {
      alert('Please fill in window name and location');
      return;
    }

    const windowSpec = {
      ...currentWindow,
      id: `W${quotationData.windowSpecs.length + 1}`
    };

    setQuotationData(prev => ({
      ...prev,
      windowSpecs: [...prev.windowSpecs, windowSpec]
    }));

    // Reset form
    resetCurrentWindow();
  };

  const editWindow = (index) => {
    setCurrentWindow(quotationData.windowSpecs[index]);
    setEditingIndex(index);
  };

  const updateWindow = () => {
    if (editingIndex >= 0) {
      const updatedSpecs = [...quotationData.windowSpecs];
      updatedSpecs[editingIndex] = currentWindow;
      setQuotationData(prev => ({
        ...prev,
        windowSpecs: updatedSpecs
      }));
      setEditingIndex(-1);
      resetCurrentWindow();
    }
  };

  const removeWindow = (index) => {
    setQuotationData(prev => ({
      ...prev,
      windowSpecs: prev.windowSpecs.filter((_, i) => i !== index)
    }));
  };

  const resetCurrentWindow = () => {
    const windowType = WINDOW_TYPES[currentWindow.type];
    setCurrentWindow({
      id: '',
      type: 'sliding',
      name: '',
      location: '',
      dimensions: {
        width: 1000,
        height: 1000,
        radius: 0
      },
      specifications: {
        glass: 'clear-5mm',
        glassThickness: 5,
        lock: 'right-handle',
        lockPosition: 'right',
        openingType: windowType?.defaultSpecs.openingType || 'horizontal',
        fixedPanels: [...(windowType?.defaultSpecs.fixedPanels || [])],
        grille: {
          enabled: false,
          style: 'rectangular',
          pattern: 'grid'
        },
        frame: {
          material: 'aluminum',
          color: 'white',
          customColor: ''
        },
        panels: windowType?.defaultSpecs.panels || 2,
        tracks: windowType?.defaultSpecs.tracks || 1
      },
      pricing: {
        basePrice: 5000,
        sqFtPrice: 450,
        quantity: 1,
        customPricing: false
      },
      computedValues: {
        sqFtPerWindow: 0,
        totalPrice: 0,
        weight: 0
      }
    });
  };

  const handleWindowTypeChange = (type) => {
    const windowType = WINDOW_TYPES[type];
    setCurrentWindow(prev => ({
      ...prev,
      type: type,
      specifications: {
        ...prev.specifications,
        openingType: windowType.defaultSpecs.openingType,
        fixedPanels: [...windowType.defaultSpecs.fixedPanels],
        panels: windowType.defaultSpecs.panels,
        tracks: windowType.defaultSpecs.tracks
      }
    }));
  };

  const saveQuotation = () => {
    if (!quotationData.clientDetails.name || quotationData.windowSpecs.length === 0) {
      alert('Please select a client and add at least one window specification');
      return;
    }

    const savedQuotes = JSON.parse(localStorage.getItem('savedQuotations') || '[]');
    const quotationToSave = {
      ...quotationData,
      id: quotationData.quotationNumber,
      createdDate: new Date().toISOString(),
      totalAmount: calculateGrandTotal()
    };

    // Check if updating existing quote
    const existingIndex = savedQuotes.findIndex(q => q.quotationNumber === quotationData.quotationNumber);
    if (existingIndex >= 0) {
      savedQuotes[existingIndex] = quotationToSave;
    } else {
      savedQuotes.push(quotationToSave);
    }

    localStorage.setItem('savedQuotations', JSON.stringify(savedQuotes));
    alert('Quotation saved successfully!');
  };

  const handleDownloadPDF = async () => {
    if (quotationData.windowSpecs.length === 0) {
      alert('Please add at least one window specification to generate PDF');
      return;
    }

    if (!quotationData.clientDetails.name) {
      alert('Please select a client before generating PDF');
      return;
    }

    try {
      // Show loading state
      const result = await generateQuotationPDF(quotationData);
      
      if (result.success) {
        alert(`PDF generated successfully: ${result.fileName}`);
      } else {
        alert(`Error generating PDF: ${result.error}`);
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('An error occurred while generating the PDF. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="quotation-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading clients and inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="quotation-container">
      <div className="quotation-header">
        <h1>🪟 Advanced Window Quotation Builder</h1>
        <div className="quotation-actions">
          <button className="btn-print-quote" onClick={handleDownloadPDF}>
            📄 Download PDF
          </button>
          <button className="btn-save" onClick={saveQuotation}>
            💾 Save Quotation
          </button>
        </div>
      </div>

      <div className="quotation-form">
        {/* Basic Quote Information */}
        <div className="quote-info-section">
          <h3>📝 Quote Information</h3>
          <div className="info-grid">
            <div className="form-group">
              <label>Quote Number:</label>
              <input
                type="text"
                value={quotationData.quotationNumber}
                onChange={(e) => setQuotationData({...quotationData, quotationNumber: e.target.value})}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Project Name:</label>
              <input
                type="text"
                value={quotationData.project}
                onChange={(e) => setQuotationData({...quotationData, project: e.target.value})}
                className="form-input"
                placeholder="Enter project name"
              />
            </div>
            <div className="form-group">
              <label>Date:</label>
              <input
                type="date"
                value={quotationData.date}
                onChange={(e) => setQuotationData({...quotationData, date: e.target.value})}
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Client Selection */}
        <div className="client-section">
          <h3>👤 Client Information</h3>
          <div className="client-grid">
            <div className="form-group">
              <label>Select Client:</label>
              <select
                value={quotationData.clientDetails.name}
                onChange={(e) => {
                  const selectedClient = clients.find(client => client.name === e.target.value);
                  if (selectedClient) {
                    setQuotationData({
                      ...quotationData,
                      clientDetails: {
                        name: selectedClient.name,
                        address: `${selectedClient.address}\n${selectedClient.city}, ${selectedClient.state} - ${selectedClient.pincode}`
                      }
                    });
                  }
                }}
                className="form-select"
              >
                <option value="">Select a client...</option>
                {clients.map((client) => (
                  <option key={client._id} value={client.name}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Client Address:</label>
              <textarea
                value={quotationData.clientDetails.address}
                onChange={(e) => setQuotationData({
                  ...quotationData,
                  clientDetails: {...quotationData.clientDetails, address: e.target.value}
                })}
                className="form-textarea"
                rows={4}
                placeholder="Enter client address"
              />
            </div>
          </div>
        </div>

        {/* Window Builder Section */}
        <div className="window-builder-section">
          <h3>🏗️ Window Builder</h3>
          
          {/* Window Type Selection */}
          <div className="window-type-selector">
            <h4>Select Window Type:</h4>
            <div className="window-types-grid">
              {Object.entries(WINDOW_TYPES).map(([key, type]) => (
                <div
                  key={key}
                  className={`window-type-card ${currentWindow.type === key ? 'selected' : ''}`}
                  onClick={() => handleWindowTypeChange(key)}
                >
                  <div className="window-type-icon">{type.icon}</div>
                  <div className="window-type-name">{type.name}</div>
                  <div className="window-type-desc">{type.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Window Configuration */}
          <div className="window-config-section">
            <div className="config-left">
              <h4>🪟 Window Preview</h4>
              <div className="window-preview">
                <DynamicWindowShape 
                  windowType={currentWindow.type} 
                  dimensions={currentWindow.dimensions}
                  specifications={currentWindow.specifications}
                />
              </div>
              
              <div className="dimensions-controls">
                <div className="dimension-group">
                  <label>Width (mm):</label>
                  <input
                    type="number"
                    value={currentWindow.dimensions.width}
                    onChange={(e) => setCurrentWindow(prev => ({
                      ...prev,
                      dimensions: { ...prev.dimensions, width: parseInt(e.target.value) || 0 }
                    }))}
                    className="dimension-input"
                    min="100"
                    max="5000"
                  />
                </div>
                <div className="dimension-group">
                  <label>Height (mm):</label>
                  <input
                    type="number"
                    value={currentWindow.dimensions.height}
                    onChange={(e) => setCurrentWindow(prev => ({
                      ...prev,
                      dimensions: { ...prev.dimensions, height: parseInt(e.target.value) || 0 }
                    }))}
                    className="dimension-input"
                    min="100"
                    max="3000"
                  />
                </div>
                {currentWindow.type === 'bay' && (
                  <div className="dimension-group">
                    <label>Bay Angle (degrees):</label>
                    <input
                      type="number"
                      value={currentWindow.dimensions.radius}
                      onChange={(e) => setCurrentWindow(prev => ({
                        ...prev,
                        dimensions: { ...prev.dimensions, radius: parseInt(e.target.value) || 0 }
                      }))}
                      className="dimension-input"
                      min="30"
                      max="150"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="config-right">
              <h4>⚙️ Window Specifications</h4>
              
              {/* Basic Info */}
              <div className="spec-section">
                <div className="form-group">
                  <label>Window Name:</label>
                  <input
                    type="text"
                    value={currentWindow.name}
                    onChange={(e) => setCurrentWindow(prev => ({...prev, name: e.target.value}))}
                    className="form-input"
                    placeholder="e.g., Living Room Window"
                  />
                </div>
                <div className="form-group">
                  <label>Location:</label>
                  <input
                    type="text"
                    value={currentWindow.location}
                    onChange={(e) => setCurrentWindow(prev => ({...prev, location: e.target.value}))}
                    className="form-input"
                    placeholder="e.g., Living Room, Bedroom 1"
                  />
                </div>
              </div>

              {/* Glass Options */}
              <div className="spec-section">
                <h5>🔹 Glass Specifications</h5>
                <div className="form-group">
                  <label>Glass Type & Thickness:</label>
                  <select
                    value={currentWindow.specifications.glass}
                    onChange={(e) => {
                      const selectedGlass = GLASS_OPTIONS.find(g => g.value === e.target.value);
                      setCurrentWindow(prev => ({
                        ...prev,
                        specifications: {
                          ...prev.specifications,
                          glass: e.target.value,
                          glassThickness: selectedGlass?.thickness || 5
                        }
                      }));
                    }}
                    className="form-select"
                  >
                    {GLASS_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label} (+₹{option.price}/sq.ft)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Lock Options */}
              <div className="spec-section">
                <h5>🔒 Lock Configuration</h5>
                <div className="form-group">
                  <label>Lock Type & Position:</label>
                  <select
                    value={currentWindow.specifications.lock}
                    onChange={(e) => {
                      const selectedLock = LOCK_OPTIONS.find(l => l.value === e.target.value);
                      setCurrentWindow(prev => ({
                        ...prev,
                        specifications: {
                          ...prev.specifications,
                          lock: e.target.value,
                          lockPosition: selectedLock?.position || 'none'
                        }
                      }));
                    }}
                    className="form-select"
                  >
                    {LOCK_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Opening Configuration */}
              <div className="spec-section">
                <h5>🚪 Opening Configuration</h5>
                <div className="form-group">
                  <label>Opening Type:</label>
                  <select
                    value={currentWindow.specifications.openingType}
                    onChange={(e) => setCurrentWindow(prev => ({
                      ...prev,
                      specifications: { ...prev.specifications, openingType: e.target.value }
                    }))}
                    className="form-select"
                  >
                    <option value="horizontal">Horizontal Sliding</option>
                    <option value="vertical">Vertical Sliding</option>
                    <option value="side">Side Hinged</option>
                    <option value="top">Top Hinged</option>
                    <option value="bottom">Bottom Hinged</option>
                    <option value="pivot">Pivot</option>
                    <option value="slats">Louvered Slats</option>
                    <option value="none">Fixed (No Opening)</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Fixed Panels:</label>
                  <div className="checkbox-group">
                    {['left', 'center', 'right'].map(position => (
                      <label key={position} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={currentWindow.specifications.fixedPanels.includes(position)}
                          onChange={(e) => {
                            const fixedPanels = [...currentWindow.specifications.fixedPanels];
                            if (e.target.checked) {
                              fixedPanels.push(position);
                            } else {
                              const index = fixedPanels.indexOf(position);
                              if (index > -1) fixedPanels.splice(index, 1);
                            }
                            setCurrentWindow(prev => ({
                              ...prev,
                              specifications: { ...prev.specifications, fixedPanels }
                            }));
                          }}
                        />
                        {position.charAt(0).toUpperCase() + position.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Grille Options */}
              <div className="spec-section">
                <h5>🔲 Grille Design</h5>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={currentWindow.specifications.grille.enabled}
                      onChange={(e) => setCurrentWindow(prev => ({
                        ...prev,
                        specifications: {
                          ...prev.specifications,
                          grille: { ...prev.specifications.grille, enabled: e.target.checked }
                        }
                      }))}
                    />
                    Enable Grille Design
                  </label>
                </div>
                
                {currentWindow.specifications.grille.enabled && (
                  <>
                    <div className="form-group">
                      <label>Grille Style:</label>
                      <select
                        value={currentWindow.specifications.grille.style}
                        onChange={(e) => setCurrentWindow(prev => ({
                          ...prev,
                          specifications: {
                            ...prev.specifications,
                            grille: { ...prev.specifications.grille, style: e.target.value }
                          }
                        }))}
                        className="form-select"
                      >
                        <option value="rectangular">Rectangular Grid</option>
                        <option value="diamond">Diamond Pattern</option>
                        <option value="colonial">Colonial Style</option>
                        <option value="prairie">Prairie Style</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              {/* Frame Options */}
              <div className="spec-section">
                <h5>🖼️ Frame Configuration</h5>
                <div className="form-group">
                  <label>Frame Material:</label>
                  <select
                    value={currentWindow.specifications.frame.material}
                    onChange={(e) => setCurrentWindow(prev => ({
                      ...prev,
                      specifications: {
                        ...prev.specifications,
                        frame: { ...prev.specifications.frame, material: e.target.value }
                      }
                    }))}
                    className="form-select"
                  >
                    {FRAME_MATERIALS.map(material => (
                      <option key={material.value} value={material.value}>
                        {material.label} ({material.priceMultiplier}x price)
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Frame Color:</label>
                  <div className="color-selection">
                    <select
                      value={currentWindow.specifications.frame.color}
                      onChange={(e) => setCurrentWindow(prev => ({
                        ...prev,
                        specifications: {
                          ...prev.specifications,
                          frame: { ...prev.specifications.frame, color: e.target.value }
                        }
                      }))}
                      className="form-select"
                    >
                      {COLOR_OPTIONS.map(color => (
                        <option key={color.value} value={color.value}>
                          {color.label}
                        </option>
                      ))}
                      <option value="custom">Custom Color</option>
                    </select>
                    
                    {currentWindow.specifications.frame.color === 'custom' && (
                      <input
                        type="color"
                        value={currentWindow.specifications.frame.customColor}
                        onChange={(e) => setCurrentWindow(prev => ({
                          ...prev,
                          specifications: {
                            ...prev.specifications,
                            frame: { ...prev.specifications.frame, customColor: e.target.value }
                          }
                        }))}
                        className="color-picker"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="spec-section">
                <h5>💰 Pricing Configuration</h5>
                <div className="pricing-grid">
                  <div className="form-group">
                    <label>Base Price (₹):</label>
                    <input
                      type="number"
                      value={currentWindow.pricing.basePrice}
                      onChange={(e) => setCurrentWindow(prev => ({
                        ...prev,
                        pricing: { ...prev.pricing, basePrice: parseFloat(e.target.value) || 0 }
                      }))}
                      className="form-input"
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Price per Sq.Ft (₹):</label>
                    <input
                      type="number"
                      value={currentWindow.pricing.sqFtPrice}
                      onChange={(e) => setCurrentWindow(prev => ({
                        ...prev,
                        pricing: { ...prev.pricing, sqFtPrice: parseFloat(e.target.value) || 0 }
                      }))}
                      className="form-input"
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Quantity:</label>
                    <input
                      type="number"
                      value={currentWindow.pricing.quantity}
                      onChange={(e) => setCurrentWindow(prev => ({
                        ...prev,
                        pricing: { ...prev.pricing, quantity: parseInt(e.target.value) || 1 }
                      }))}
                      className="form-input"
                      min="1"
                    />
                  </div>
                </div>
              </div>

              {/* Computed Values */}
              <div className="computed-values-section">
                <h5>📊 Computed Values</h5>
                <div className="computed-grid">
                  <div className="computed-item">
                    <span>Area:</span>
                    <span>{currentWindow.computedValues.sqFtPerWindow.toFixed(2)} sq.ft</span>
                  </div>
                  <div className="computed-item">
                    <span>Total Price:</span>
                    <span>₹{currentWindow.computedValues.totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="computed-item">
                    <span>Weight:</span>
                    <span>{currentWindow.computedValues.weight.toFixed(2)} kg</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="window-actions">
                {editingIndex >= 0 ? (
                  <>
                    <button className="btn-update" onClick={updateWindow}>
                      ✏️ Update Window
                    </button>
                    <button className="btn-cancel" onClick={resetCurrentWindow}>
                      ❌ Cancel Edit
                    </button>
                  </>
                ) : (
                  <button className="btn-add-window" onClick={addWindowToQuote}>
                    ➕ Add to Quote
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Added Windows List */}
        {quotationData.windowSpecs.length > 0 && (
          <div className="added-windows-section">
            <h3>📋 Added Windows ({quotationData.windowSpecs.length})</h3>
            <div className="windows-list">
              {quotationData.windowSpecs.map((window, index) => (
                <div key={window.id} className="window-summary-card">
                  <div className="window-summary-header">
                    <div className="window-title">
                      <span className="window-icon">{WINDOW_TYPES[window.type]?.icon}</span>
                      <div>
                        <h4>{window.name}</h4>
                        <p>{window.location} - {WINDOW_TYPES[window.type]?.name}</p>
                      </div>
                    </div>
                    <div className="window-actions">
                      <button 
                        className="btn-edit"
                        onClick={() => editWindow(index)}
                        title="Edit Window"
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn-remove"
                        onClick={() => removeWindow(index)}
                        title="Remove Window"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  <div className="window-summary-details">
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span>Dimensions:</span>
                        <span>{window.dimensions.width} × {window.dimensions.height} mm</span>
                      </div>
                      <div className="detail-item">
                        <span>Area:</span>
                        <span>{window.computedValues.sqFtPerWindow.toFixed(2)} sq.ft</span>
                      </div>
                      <div className="detail-item">
                        <span>Glass:</span>
                        <span>{GLASS_OPTIONS.find(g => g.value === window.specifications.glass)?.label}</span>
                      </div>
                      <div className="detail-item">
                        <span>Frame:</span>
                        <span>{FRAME_MATERIALS.find(f => f.value === window.specifications.frame.material)?.label}</span>
                      </div>
                      <div className="detail-item">
                        <span>Lock:</span>
                        <span>{LOCK_OPTIONS.find(l => l.value === window.specifications.lock)?.label}</span>
                      </div>
                      <div className="detail-item">
                        <span>Quantity:</span>
                        <span>{window.pricing.quantity}</span>
                      </div>
                      <div className="detail-item total-price">
                        <span>Total Price:</span>
                        <span>₹{window.computedValues.totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quote Summary */}
        <div className="quote-summary">
          <div className="summary-table">
            <table>
              <tbody>
                <tr>
                  <td>No. of Components</td>
                  <td>{quotationData.windowSpecs.length} Pcs</td>
                </tr>
                <tr>
                  <td>Total Area</td>
                  <td>{quotationData.windowSpecs.reduce((sum, spec) => sum + spec.computedValues.sqFtPerWindow, 0).toFixed(2)} Sq.Ft.</td>
                </tr>
                <tr>
                  <td>Basic Value</td>
                  <td>{calculateQuoteTotal().toFixed(2)} INR</td>
                </tr>
                <tr>
                  <td>Sub Total</td>
                  <td>{calculateQuoteTotal().toFixed(2)} INR</td>
                </tr>
                <tr>
                  <td>Transportation Cost</td>
                  <td>1,000 INR</td>
                </tr>
                <tr>
                  <td>Loading And Unloading</td>
                  <td>1,000 INR</td>
                </tr>
                <tr>
                  <td>Total Project Cost</td>
                  <td>{(calculateQuoteTotal() + 2000).toFixed(2)} INR</td>
                </tr>
                <tr>
                  <td>Gst @18%</td>
                  <td>{calculateGST().toFixed(2)} INR</td>
                </tr>
                <tr className="grand-total-row">
                  <td><strong>Grand Total</strong></td>
                  <td><strong>{(calculateGrandTotal() + 2000).toFixed(2)} INR</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Dynamic Window Shape Component
const DynamicWindowShape = ({ windowType, dimensions, specifications }) => {
  const { width, height, radius } = dimensions;
  const { panels, tracks, fixedPanels, grille } = specifications;
  
  const scale = Math.min(250 / Math.max(width, height), 0.2);
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;
  
  const renderWindow = () => {
    switch (windowType) {
      case 'sliding':
        return (
          <g>
            {/* Frame */}
            <rect
              x="10"
              y="10"
              width={scaledWidth}
              height={scaledHeight}
              fill="none"
              stroke="#333"
              strokeWidth="3"
            />
            {/* Panels */}
            {Array.from({ length: panels }, (_, i) => (
              <rect
                key={i}
                x={10 + (i * scaledWidth / panels)}
                y="10"
                width={scaledWidth / panels}
                height={scaledHeight}
                fill={fixedPanels.includes(i === 0 ? 'left' : i === panels - 1 ? 'right' : 'center') ? 
                      'rgba(200, 200, 200, 0.5)' : 'rgba(173, 216, 230, 0.3)'}
                stroke="#666"
                strokeWidth="1"
              />
            ))}
            {/* Track indicators */}
            {Array.from({ length: tracks }, (_, i) => (
              <line
                key={i}
                x1="10"
                y1={10 + scaledHeight - 5 - (i * 4)}
                x2={10 + scaledWidth}
                y2={10 + scaledHeight - 5 - (i * 4)}
                stroke="#e74c3c"
                strokeWidth="2"
              />
            ))}
          </g>
        );
      
      case 'casement':
        return (
          <g>
            <rect
              x="10"
              y="10"
              width={scaledWidth}
              height={scaledHeight}
              fill="rgba(173, 216, 230, 0.3)"
              stroke="#333"
              strokeWidth="3"
            />
            {/* Hinge indicator */}
            <line
              x1="10"
              y1="10"
              x2="10"
              y2={10 + scaledHeight}
              stroke="#e74c3c"
              strokeWidth="4"
            />
            {/* Handle */}
            <circle
              cx={10 + scaledWidth - 20}
              cy={10 + scaledHeight / 2}
              r="5"
              fill="#666"
            />
          </g>
        );
      
      case 'bay':
        const angle = radius || 30;
        const sideWidth = scaledWidth * 0.3;
        const centerWidth = scaledWidth * 0.4;
        return (
          <g>
            {/* Center panel */}
            <rect
              x="10"
              y="10"
              width={centerWidth}
              height={scaledHeight}
              fill="rgba(173, 216, 230, 0.3)"
              stroke="#333"
              strokeWidth="2"
            />
            {/* Left angled panel */}
            <polygon
              points={`${10 - sideWidth * Math.cos(angle * Math.PI / 180)},${10} 
                       ${10},${10} 
                       ${10},${10 + scaledHeight} 
                       ${10 - sideWidth * Math.cos(angle * Math.PI / 180)},${10 + scaledHeight}`}
              fill="rgba(173, 216, 230, 0.3)"
              stroke="#333"
              strokeWidth="2"
            />
            {/* Right angled panel */}
            <polygon
              points={`${10 + centerWidth},${10} 
                       ${10 + centerWidth + sideWidth * Math.cos(angle * Math.PI / 180)},${10} 
                       ${10 + centerWidth + sideWidth * Math.cos(angle * Math.PI / 180)},${10 + scaledHeight} 
                       ${10 + centerWidth},${10 + scaledHeight}`}
              fill="rgba(173, 216, 230, 0.3)"
              stroke="#333"
              strokeWidth="2"
            />
          </g>
        );
      
      case 'fixed':
      case 'picture':
        return (
          <rect
            x="10"
            y="10"
            width={scaledWidth}
            height={scaledHeight}
            fill="rgba(200, 200, 200, 0.5)"
            stroke="#333"
            strokeWidth="3"
          />
        );
      
      case 'awning':
        return (
          <g>
            <rect
              x="10"
              y="10"
              width={scaledWidth}
              height={scaledHeight}
              fill="rgba(173, 216, 230, 0.3)"
              stroke="#333"
              strokeWidth="3"
            />
            {/* Top hinge */}
            <line
              x1="10"
              y1="10"
              x2={10 + scaledWidth}
              y2="10"
              stroke="#e74c3c"
              strokeWidth="4"
            />
            {/* Opening indicator */}
            <path
              d={`M ${10 + scaledWidth / 2} ${10 + scaledHeight - 10} 
                  Q ${10 + scaledWidth / 2 + 10} ${10 + scaledHeight - 20} 
                    ${10 + scaledWidth / 2 + 20} ${10 + scaledHeight - 10}`}
              fill="none"
              stroke="#666"
              strokeWidth="2"
            />
          </g>
        );
      
      case 'doubleHung':
        return (
          <g>
            <rect
              x="10"
              y="10"
              width={scaledWidth}
              height={scaledHeight / 2}
              fill="rgba(173, 216, 230, 0.3)"
              stroke="#333"
              strokeWidth="2"
            />
            <rect
              x="10"
              y={10 + scaledHeight / 2}
              width={scaledWidth}
              height={scaledHeight / 2}
              fill="rgba(173, 216, 230, 0.3)"
              stroke="#333"
              strokeWidth="2"
            />
            {/* Vertical tracks */}
            <line x1="15" y1="10" x2="15" y2={10 + scaledHeight} stroke="#e74c3c" strokeWidth="2"/>
            <line x1={10 + scaledWidth - 5} y1="10" x2={10 + scaledWidth - 5} y2={10 + scaledHeight} stroke="#e74c3c" strokeWidth="2"/>
          </g>
        );
      
      case 'singleHung':
        return (
          <g>
            <rect
              x="10"
              y="10"
              width={scaledWidth}
              height={scaledHeight / 2}
              fill="rgba(200, 200, 200, 0.5)"
              stroke="#333"
              strokeWidth="2"
            />
            <rect
              x="10"
              y={10 + scaledHeight / 2}
              width={scaledWidth}
              height={scaledHeight / 2}
              fill="rgba(173, 216, 230, 0.3)"
              stroke="#333"
              strokeWidth="2"
            />
            <text x={10 + scaledWidth / 2} y={10 + scaledHeight / 4} textAnchor="middle" fontSize="10" fill="#666">FIXED</text>
          </g>
        );
      
      case 'pivot':
        return (
          <g>
            <rect
              x="10"
              y="10"
              width={scaledWidth}
              height={scaledHeight}
              fill="rgba(173, 216, 230, 0.3)"
              stroke="#333"
              strokeWidth="3"
            />
            {/* Pivot point */}
            <circle
              cx={10 + scaledWidth / 2}
              cy={10 + scaledHeight / 2}
              r="6"
              fill="#e74c3c"
            />
            {/* Rotation indicators */}
            <path
              d={`M ${10 + scaledWidth / 2 - 15} ${10 + scaledHeight / 2} 
                  A 15 15 0 0 1 ${10 + scaledWidth / 2 + 15} ${10 + scaledHeight / 2}`}
              fill="none"
              stroke="#666"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />
          </g>
        );
      
      case 'louvered':
        return (
          <g>
            <rect
              x="10"
              y="10"
              width={scaledWidth}
              height={scaledHeight}
              fill="none"
              stroke="#333"
              strokeWidth="3"
            />
            {/* Louver slats */}
            {Array.from({ length: Math.floor(panels) || 8 }, (_, i) => (
              <ellipse
                key={i}
                cx={10 + scaledWidth / 2}
                cy={10 + (i + 1) * scaledHeight / (Math.floor(panels) || 8 + 1)}
                rx={scaledWidth / 2 - 5}
                ry="3"
                fill="rgba(173, 216, 230, 0.7)"
                stroke="#666"
                strokeWidth="1"
              />
            ))}
          </g>
        );
      
      case 'glassBlock':
        const blockSize = Math.min(scaledWidth / 6, scaledHeight / 6);
        const blocksX = Math.floor(scaledWidth / blockSize);
        const blocksY = Math.floor(scaledHeight / blockSize);
        return (
          <g>
            {Array.from({ length: blocksY }, (_, row) =>
              Array.from({ length: blocksX }, (_, col) => (
                <rect
                  key={`${row}-${col}`}
                  x={10 + col * blockSize}
                  y={10 + row * blockSize}
                  width={blockSize - 2}
                  height={blockSize - 2}
                  fill="rgba(173, 216, 230, 0.8)"
                  stroke="#333"
                  strokeWidth="1"
                />
              ))
            )}
          </g>
        );
      
      default:
        return (
          <rect
            x="10"
            y="10"
            width={scaledWidth}
            height={scaledHeight}
            fill="rgba(173, 216, 230, 0.3)"
            stroke="#333"
            strokeWidth="3"
          />
        );
    }
  };

  const renderGrille = () => {
    if (!grille.enabled) return null;
    
    const gridLines = [];
    const gridSpacing = Math.min(scaledWidth / 4, scaledHeight / 4);
    
    // Vertical lines
    for (let i = 1; i < 4; i++) {
      gridLines.push(
        <line
          key={`v-${i}`}
          x1={10 + (i * scaledWidth / 4)}
          y1="10"
          x2={10 + (i * scaledWidth / 4)}
          y2={10 + scaledHeight}
          stroke="#333"
          strokeWidth="1"
          opacity="0.6"
        />
      );
    }
    
    // Horizontal lines
    for (let i = 1; i < 4; i++) {
      gridLines.push(
        <line
          key={`h-${i}`}
          x1="10"
          y1={10 + (i * scaledHeight / 4)}
          x2={10 + scaledWidth}
          y2={10 + (i * scaledHeight / 4)}
          stroke="#333"
          strokeWidth="1"
          opacity="0.6"
        />
      );
    }
    
    return <g>{gridLines}</g>;
  };

  return (
    <div className="dynamic-window-shape">
      <div className="window-type-label">
        {WINDOW_TYPES[windowType]?.icon} {WINDOW_TYPES[windowType]?.name}
      </div>
      <svg
        width="280"
        height="200"
        viewBox={`0 0 ${Math.max(scaledWidth + 20, 280)} ${Math.max(scaledHeight + 20, 200)}`}
        className="window-shape-svg"
      >
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                  refX="0" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
          </marker>
        </defs>
        {renderWindow()}
        {renderGrille()}
      </svg>
      <div className="window-dimensions">
        <span>{width} × {height} mm</span>
        {radius > 0 && <span>Angle: {radius}°</span>}
      </div>
    </div>
  );
};

export default QuotationPage;