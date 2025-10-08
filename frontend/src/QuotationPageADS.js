import React, { useState, useEffect } from 'react';
import './QuotationPageADS.css';
import ClientService from './services/ClientService';
import { useCompany } from './CompanyContext';

const QuotationPage = () => {
  const { companyInfo, getNextQuotationNumber } = useCompany();
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [quotationData, setQuotationData] = useState({
    quotationNumber: '',
    date: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    clientInfo: {
      name: '',
      address: '',
      city: '',
      phone: '',
      email: ''
    },
    selectedWindowType: null,
    windowSpecs: {
      width: '',
      height: '',
      quantity: 1,
      frame: 'aluminum',
      glass: 'single',
      color: 'white',
      hardware: 'standard',
      opening: 'fixed',
      grilles: 'none'
    },
    pricing: {
      unitPrice: 0,
      totalPrice: 0,
      tax: 0,
      finalTotal: 0
    }
  });

  // Window Types as shown in the attachment
  const WINDOW_TYPES = [
    {
      id: 'sliding',
      icon: '🪟',
      name: 'Sliding Windows',
      description: 'Horizontal sliding windows with multiple tracks',
      basePrice: 250
    },
    {
      id: 'casement',
      icon: '🚪',
      name: 'Casement Windows',
      description: 'Side-hinged windows that open outward',
      basePrice: 280
    },
    {
      id: 'bay',
      icon: '🏠',
      name: 'Bay Windows',
      description: 'Protruding windows with multiple angles',
      basePrice: 450
    },
    {
      id: 'fixed',
      icon: '🖼️',
      name: 'Fixed Windows',
      description: 'Non-opening windows for light and view',
      basePrice: 200
    },
    {
      id: 'awning',
      icon: '🌬️',
      name: 'Awning Windows',
      description: 'Top-hinged windows that open outward',
      basePrice: 270
    },
    {
      id: 'picture',
      icon: '🖼️',
      name: 'Picture Windows',
      description: 'Large fixed windows for unobstructed views',
      basePrice: 350
    },
    {
      id: 'double-hung',
      icon: '⬆️',
      name: 'Double Hung Windows',
      description: 'Two vertically sliding sashes',
      basePrice: 300
    },
    {
      id: 'single-hung',
      icon: '⬇️',
      name: 'Single Hung Windows',
      description: 'Bottom sash slides up, top is fixed',
      basePrice: 260
    },
    {
      id: 'pivot',
      icon: '🔄',
      name: 'Pivot Windows',
      description: 'Central pivot rotation mechanism',
      basePrice: 320
    }
  ];

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    // Initialize quotation number when component mounts and context is ready
    if (!quotationData.quotationNumber && getNextQuotationNumber && companyInfo) {
      try {
        const nextNumber = getNextQuotationNumber();
        setQuotationData(prev => ({
          ...prev,
          quotationNumber: nextNumber
        }));
      } catch (error) {
        console.error('Error generating quotation number:', error);
        // Fallback to simple number if there's an error
        setQuotationData(prev => ({
          ...prev,
          quotationNumber: `Q${Date.now().toString().slice(-4)}`
        }));
      }
    }
  }, [companyInfo, quotationData.quotationNumber, getNextQuotationNumber]);

  const loadClients = async () => {
    try {
      const clientsData = await ClientService.getAllClients();
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const handleClientSelect = (clientId) => {
    const client = clients.find(c => c._id === clientId);
    if (client) {
      setSelectedClient(client);
      setQuotationData(prev => ({
        ...prev,
        clientInfo: {
          name: client.name,
          address: client.address || '',
          city: client.city || '',
          phone: client.phone || '',
          email: client.email || ''
        }
      }));
    }
  };

  const handleWindowTypeSelect = (windowType) => {
    setQuotationData(prev => {
      const newData = {
        ...prev,
        selectedWindowType: windowType,
        pricing: {
          ...prev.pricing,
          unitPrice: windowType.basePrice
        }
      };
      calculatePricing(windowType.basePrice, prev.windowSpecs.quantity);
      return newData;
    });
  };

  const handleSpecChange = (field, value) => {
    setQuotationData(prev => {
      const newSpecs = { ...prev.windowSpecs, [field]: value };
      const newData = { ...prev, windowSpecs: newSpecs };
      
      if (field === 'quantity' && prev.selectedWindowType) {
        calculatePricing(prev.pricing.unitPrice, value);
      }
      
      return newData;
    });
  };

  const calculatePricing = (unitPrice, quantity) => {
    const totalPrice = unitPrice * quantity;
    const tax = totalPrice * 0.1; // 10% tax
    const finalTotal = totalPrice + tax;
    
    setQuotationData(prev => ({
      ...prev,
      pricing: {
        unitPrice,
        totalPrice,
        tax,
        finalTotal
      }
    }));
  };

  const handleSaveQuotation = () => {
    const quotations = JSON.parse(localStorage.getItem('quotations') || '[]');
    const newQuotation = {
      ...quotationData,
      id: quotationData.quotationNumber,
      createdAt: new Date().toISOString()
    };
    quotations.push(newQuotation);
    localStorage.setItem('quotations', JSON.stringify(quotations));
    alert('Quotation saved successfully!');
  };

  const handleNewQuotation = () => {
    // Reset all form data and generate new quotation number
    setSelectedClient(null);
    setQuotationData({
      quotationNumber: getNextQuotationNumber(),
      date: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      clientInfo: {
        name: '',
        address: '',
        city: '',
        phone: '',
        email: ''
      },
      selectedWindowType: null,
      windowSpecs: {
        width: '',
        height: '',
        quantity: 1,
        frame: 'aluminum',
        glass: 'single',
        color: 'white',
        hardware: 'standard',
        opening: 'fixed',
        grilles: 'none'
      },
      pricing: {
        unitPrice: 0,
        totalPrice: 0,
        tax: 0,
        finalTotal: 0
      }
    });
  };

  const generatePDF = () => {
    window.print();
  };

  // Dynamic Window Shape Component - Matching Reference Images
  const WindowDiagram = ({ windowType, specs }) => {
    if (!windowType) return null;

    // Scale dimensions proportionally but keep reasonable preview size
    const baseWidth = 300;
    const baseHeight = 250;
    const aspectRatio = (parseInt(specs.width) || 1200) / (parseInt(specs.height) || 1500);
    
    let width, height;
    if (aspectRatio > 1.2) { // Wide window
      width = baseWidth;
      height = baseWidth / aspectRatio;
    } else { // Tall or square window
      height = baseHeight;
      width = baseHeight * aspectRatio;
    }

    const renderShape = () => {
      const frameThickness = 8;
      const glassColor = "#E6F3FF";
      const frameColor = "#003366";
      
      switch (windowType.id) {
        case 'single-hung':
          return (
            <g>
              {/* Outer frame */}
              <rect x="10" y="10" width={width-20} height={height-20} fill={frameColor} stroke={frameColor} strokeWidth="2"/>
              {/* Glass areas */}
              <rect x="18" y="18" width={width-36} height={(height-36)/2-4} fill={glassColor} stroke="#ccc" strokeWidth="1"/>
              <rect x="18" y={18+(height-36)/2+4} width={width-36} height={(height-36)/2-4} fill={glassColor} stroke="#ccc" strokeWidth="1"/>
              {/* Middle rail */}
              <rect x="14" y={14+(height-28)/2-2} width={width-28} height="4" fill={frameColor}/>
              {/* Grid pattern on glass */}
              <line x1="26" y1="18" x2="26" y2={18+(height-36)/2-4} stroke="#ddd" strokeWidth="1"/>
              <line x1={width-26} y1="18" x2={width-26} y2={18+(height-36)/2-4} stroke="#ddd" strokeWidth="1"/>
              <line x1="18" y1={18+(height-36)/4-2} x2={width-18} y2={18+(height-36)/4-2} stroke="#ddd" strokeWidth="1"/>
              {/* Bottom sash grid */}
              <line x1="26" y1={18+(height-36)/2+4} x2="26" y2={height-18} stroke="#ddd" strokeWidth="1"/>
              <line x1={width-26} y1={18+(height-36)/2+4} x2={width-26} y2={height-18} stroke="#ddd" strokeWidth="1"/>
              <line x1="18" y1={18+(height-36)*3/4+2} x2={width-18} y2={18+(height-36)*3/4+2} stroke="#ddd" strokeWidth="1"/>
              {/* Sash locks */}
              <circle cx={width-25} cy={14+(height-28)/2} r="3" fill="#666"/>
            </g>
          );
          
        case 'double-hung':
          return (
            <g>
              {/* Outer frame */}
              <rect x="10" y="10" width={width-20} height={height-20} fill={frameColor} stroke={frameColor} strokeWidth="2"/>
              {/* Glass areas */}
              <rect x="18" y="18" width={width-36} height={(height-36)/2-4} fill={glassColor} stroke="#ccc" strokeWidth="1"/>
              <rect x="18" y={18+(height-36)/2+4} width={width-36} height={(height-36)/2-4} fill={glassColor} stroke="#ccc" strokeWidth="1"/>
              {/* Middle rail */}
              <rect x="14" y={14+(height-28)/2-2} width={width-28} height="4" fill={frameColor}/>
              {/* Grid pattern on both sashes */}
              <line x1="26" y1="18" x2="26" y2={18+(height-36)/2-4} stroke="#ddd" strokeWidth="1"/>
              <line x1={width-26} y1="18" x2={width-26} y2={18+(height-36)/2-4} stroke="#ddd" strokeWidth="1"/>
              <line x1="18" y1={18+(height-36)/4-2} x2={width-18} y2={18+(height-36)/4-2} stroke="#ddd" strokeWidth="1"/>
              <line x1="26" y1={18+(height-36)/2+4} x2="26" y2={height-18} stroke="#ddd" strokeWidth="1"/>
              <line x1={width-26} y1={18+(height-36)/2+4} x2={width-26} y2={height-18} stroke="#ddd" strokeWidth="1"/>
              <line x1="18" y1={18+(height-36)*3/4+2} x2={width-18} y2={18+(height-36)*3/4+2} stroke="#ddd" strokeWidth="1"/>
              {/* Sash handles */}
              <circle cx="25" cy={18+(height-36)/4-2} r="2" fill="#666"/>
              <circle cx="25" cy={18+(height-36)*3/4+2} r="2" fill="#666"/>
            </g>
          );
          
        case 'sliding':
          return (
            <g>
              {/* Outer frame */}
              <rect x="10" y="10" width={width-20} height={height-20} fill={frameColor} stroke={frameColor} strokeWidth="2"/>
              {/* Glass panels */}
              <rect x="18" y="18" width={(width-36)/2-2} height={height-36} fill={glassColor} stroke="#ccc" strokeWidth="1"/>
              <rect x={18+(width-36)/2+2} y="18" width={(width-36)/2-2} height={height-36} fill={glassColor} stroke="#ccc" strokeWidth="1"/>
              {/* Center track */}
              <rect x={14+(width-28)/2-2} y="14" width="4" height={height-28} fill={frameColor}/>
              {/* Handle on sliding panel */}
              <circle cx={width-30} cy={height/2} r="4" fill="#666"/>
              {/* Track indicators */}
              <rect x="14" y={height-16} width={width-28} height="2" fill="#999"/>
            </g>
          );
          
        case 'casement':
          return (
            <g>
              {/* Outer frame */}
              <rect x="10" y="10" width={width-20} height={height-20} fill={frameColor} stroke={frameColor} strokeWidth="2"/>
              {/* Glass area */}
              <rect x="18" y="18" width={width-36} height={height-36} fill={glassColor} stroke="#ccc" strokeWidth="1"/>
              {/* Hinges on left side */}
              <rect x="12" y="25" width="4" height="8" fill="#666"/>
              <rect x="12" y={height/2-4} width="4" height="8" fill="#666"/>
              <rect x="12" y={height-33} width="4" height="8" fill="#666"/>
              {/* Handle/crank on right side */}
              <circle cx={width-25} cy={height/2} r="4" fill="#666"/>
              <line x1={width-25} y1={height/2} x2={width-20} y2={height/2-5} stroke="#666" strokeWidth="2"/>
            </g>
          );
          
        case 'awning':
          return (
            <g>
              {/* Outer frame */}
              <rect x="10" y="10" width={width-20} height={height-20} fill={frameColor} stroke={frameColor} strokeWidth="2"/>
              {/* Glass area */}
              <rect x="18" y="18" width={width-36} height={height-36} fill={glassColor} stroke="#ccc" strokeWidth="1"/>
              {/* Top hinges */}
              <rect x="25" y="12" width="8" height="4" fill="#666"/>
              <rect x={width/2-4} y="12" width="8" height="4" fill="#666"/>
              <rect x={width-33} y="12" width="8" height="4" fill="#666"/>
              {/* Bottom handle/operator */}
              <circle cx={width/2} cy={height-25} r="4" fill="#666"/>
              <line x1={width/2} y1={height-25} x2={width/2} y2={height-15} stroke="#666" strokeWidth="2"/>
            </g>
          );
          
        case 'bay':
          return (
            <g>
              {/* Center window */}
              <rect x={width*0.2} y="10" width={width*0.6} height={height-20} fill={frameColor} stroke={frameColor} strokeWidth="2"/>
              <rect x={width*0.2+8} y="18" width={width*0.6-16} height={height-36} fill={glassColor} stroke="#ccc" strokeWidth="1"/>
              {/* Left angled window */}
              <polygon points={`10,${height-10} ${width*0.2+5},10 ${width*0.2+5},${height-10}`} fill={frameColor} stroke={frameColor} strokeWidth="2"/>
              <polygon points={`18,${height-18} ${width*0.2-3},18 ${width*0.2-3},${height-18}`} fill={glassColor} stroke="#ccc" strokeWidth="1"/>
              {/* Right angled window */}
              <polygon points={`${width*0.8-5},10 ${width-10},${height-10} ${width*0.8-5},${height-10}`} fill={frameColor} stroke={frameColor} strokeWidth="2"/>
              <polygon points={`${width*0.8+3},18 ${width-18},${height-18} ${width*0.8+3},${height-18}`} fill={glassColor} stroke="#ccc" strokeWidth="1"/>
            </g>
          );
          
        case 'bow':
          return (
            <g>
              {/* Create curved bow window effect with multiple angled sections */}
              <polygon points={`10,${height-10} 30,10 50,15 ${width-50},15 ${width-30},10 ${width-10},${height-10}`} 
                       fill={frameColor} stroke={frameColor} strokeWidth="2"/>
              {/* Glass sections */}
              <polygon points={`18,${height-18} 35,18 45,22 25,${height-18}`} fill={glassColor} stroke="#ccc" strokeWidth="1"/>
              <polygon points={`45,22 ${width-45},22 ${width-25},${height-18} 25,${height-18}`} fill={glassColor} stroke="#ccc" strokeWidth="1"/>
              <polygon points={`${width-45},22 ${width-35},18 ${width-18},${height-18} ${width-25},${height-18}`} fill={glassColor} stroke="#ccc" strokeWidth="1"/>
              {/* Mullions */}
              <line x1="35" y1="18" x2="25" y2={height-18} stroke={frameColor} strokeWidth="2"/>
              <line x1={width-35} y1="18" x2={width-25} y2={height-18} stroke={frameColor} strokeWidth="2"/>
            </g>
          );
          
        case 'picture':
          return (
            <g>
              {/* Large fixed window frame */}
              <rect x="10" y="10" width={width-20} height={height-20} fill={frameColor} stroke={frameColor} strokeWidth="3"/>
              {/* Large glass area */}
              <rect x="20" y="20" width={width-40} height={height-40} fill={glassColor} stroke="#ccc" strokeWidth="1"/>
              {/* No operating hardware - just clean lines */}
            </g>
          );
          
        case 'hopper':
          return (
            <g>
              {/* Outer frame */}
              <rect x="10" y="10" width={width-20} height={height-20} fill={frameColor} stroke={frameColor} strokeWidth="2"/>
              {/* Glass area */}
              <rect x="18" y="18" width={width-36} height={height-36} fill={glassColor} stroke="#ccc" strokeWidth="1"/>
              {/* Bottom hinges */}
              <rect x="25" y={height-16} width="8" height="4" fill="#666"/>
              <rect x={width/2-4} y={height-16} width="8" height="4" fill="#666"/>
              <rect x={width-33} y={height-16} width="8" height="4" fill="#666"/>
              {/* Top handle */}
              <circle cx={width/2} cy="25" r="4" fill="#666"/>
            </g>
          );
          
        default:
          return (
            <g>
              <rect x="10" y="10" width={width-20} height={height-20} fill={frameColor} stroke={frameColor} strokeWidth="2"/>
              <rect x="18" y="18" width={width-36} height={height-36} fill={glassColor} stroke="#ccc" strokeWidth="1"/>
            </g>
          );
      }
    };

    return (
      <div className="window-diagram-container">
        <svg width={width} height={height} className="window-diagram" viewBox={`0 0 ${width} ${height}`}>
          {renderShape()}
        </svg>
        <div className="diagram-dimensions">
          {specs.width || '1200'}mm × {specs.height || '1500'}mm
        </div>
      </div>
    );
  };

  return (
    <div className="quotation-container">
      {/* Header Section */}
      <div className="quotation-header">
        <div className="header-top">
          <div className="company-branding">
            <div className="company-logo-container">
              <div className="company-logo-box">
                <span className="company-initial">{companyInfo.name ? companyInfo.name.charAt(0) : 'F'}</span>
              </div>
              <div className="company-name">{companyInfo.name || 'Finvent'}</div>
            </div>
          </div>
          <div className="company-contact">
            {companyInfo.phone && (
              <div className="contact-item">
                <span className="contact-label">Phone:</span>
                <span className="contact-value">{companyInfo.phone}</span>
              </div>
            )}
            {companyInfo.email && (
              <div className="contact-item">
                <span className="contact-label">Email:</span>
                <span className="contact-value">{companyInfo.email}</span>
              </div>
            )}
            {companyInfo.website && (
              <div className="contact-item">
                <span className="contact-label">Website:</span>
                <span className="contact-value">{companyInfo.website}</span>
              </div>
            )}
          </div>
        </div>
        {companyInfo.tagline && (
          <div className="company-tagline">{companyInfo.tagline}</div>
        )}
      </div>

      {/* Title Section */}
      <div className="quotation-title-section">
        <h1 className="quotation-main-title">WINDOW QUOTATION</h1>
      </div>

      {/* Client Information Section */}
      <div className="client-section">
        <div className="section-title">Client Information</div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Select Existing Client</label>
            <select onChange={(e) => handleClientSelect(e.target.value)} value={selectedClient?._id || ''}>
              <option value="">Choose a client...</option>
              {clients.map(client => (
                <option key={client._id} value={client._id}>{client.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Quotation No.</label>
            <input type="text" value={quotationData.quotationNumber} readOnly />
          </div>
          <div className="form-group">
            <label>Date</label>
            <input type="date" value={quotationData.date} 
                   onChange={(e) => setQuotationData(prev => ({...prev, date: e.target.value}))} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Client Name</label>
            <input type="text" value={quotationData.clientInfo.name}
                   onChange={(e) => setQuotationData(prev => ({
                     ...prev, 
                     clientInfo: {...prev.clientInfo, name: e.target.value}
                   }))} />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input type="text" value={quotationData.clientInfo.phone}
                   onChange={(e) => setQuotationData(prev => ({
                     ...prev, 
                     clientInfo: {...prev.clientInfo, phone: e.target.value}
                   }))} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Address</label>
            <input type="text" value={quotationData.clientInfo.address}
                   onChange={(e) => setQuotationData(prev => ({
                     ...prev, 
                     clientInfo: {...prev.clientInfo, address: e.target.value}
                   }))} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={quotationData.clientInfo.email}
                   onChange={(e) => setQuotationData(prev => ({
                     ...prev, 
                     clientInfo: {...prev.clientInfo, email: e.target.value}
                   }))} />
          </div>
        </div>
      </div>

      {/* Window Builder Section */}
      <div className="window-builder">
        <div className="window-builder-title">
          <span className="window-builder-icon">🏗️</span>
          <h2>Window Builder</h2>
        </div>

        <div className="builder-layout">
          {/* Left Panel - Window Selection */}
          <div className="builder-left-panel">
            <div className="section-title">Window Configuration</div>
            
            <div className="config-section">
              <h4>Window Type</h4>
              <select 
                value={quotationData.selectedWindowType?.id || ''} 
                onChange={(e) => {
                  const windowType = WINDOW_TYPES.find(type => type.id === e.target.value);
                  if (windowType) handleWindowTypeSelect(windowType);
                }}
                className="window-type-dropdown"
              >
                <option value="">Select Window Type...</option>
                {WINDOW_TYPES.map(windowType => (
                  <option key={windowType.id} value={windowType.id}>
                    {windowType.name}
                  </option>
                ))}
              </select>
              {quotationData.selectedWindowType && (
                <p className="window-description">{quotationData.selectedWindowType.description}</p>
              )}
            </div>

            <div className="config-section">
              <h4>Dimensions</h4>
              <div className="dimension-inputs">
                <div className="dimension-group">
                  <label>Width (mm)</label>
                  <input 
                    type="number" 
                    value={quotationData.windowSpecs.width}
                    onChange={(e) => handleSpecChange('width', e.target.value)}
                    placeholder="1200"
                    min="300"
                    max="3000"
                  />
                </div>
                <div className="dimension-group">
                  <label>Height (mm)</label>
                  <input 
                    type="number" 
                    value={quotationData.windowSpecs.height}
                    onChange={(e) => handleSpecChange('height', e.target.value)}
                    placeholder="1500"
                    min="300"
                    max="2500"
                  />
                </div>
              </div>
            </div>

            <div className="config-section">
              <h4>Specifications</h4>
              <div className="spec-inputs">
                <div className="spec-input-group">
                  <label>Frame Material</label>
                  <select value={quotationData.windowSpecs.frame}
                          onChange={(e) => handleSpecChange('frame', e.target.value)}>
                    <option value="aluminum">Aluminum</option>
                    <option value="upvc">uPVC</option>
                    <option value="wood">Wood</option>
                    <option value="steel">Steel</option>
                  </select>
                </div>
                <div className="spec-input-group">
                  <label>Glass Type</label>
                  <select value={quotationData.windowSpecs.glass}
                          onChange={(e) => handleSpecChange('glass', e.target.value)}>
                    <option value="single">Single Glazed</option>
                    <option value="double">Double Glazed</option>
                    <option value="triple">Triple Glazed</option>
                    <option value="laminated">Laminated</option>
                    <option value="tempered">Tempered</option>
                  </select>
                </div>
                <div className="spec-input-group">
                  <label>Quantity</label>
                  <input 
                    type="number" 
                    value={quotationData.windowSpecs.quantity}
                    onChange={(e) => handleSpecChange('quantity', parseInt(e.target.value))}
                    min="1"
                    max="50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Window Preview */}
          <div className="builder-right-panel">
            <div className="section-title">Window Preview</div>
            {quotationData.selectedWindowType ? (
              <div className="window-preview">
                <div className="preview-container">
                  <WindowDiagram 
                    windowType={quotationData.selectedWindowType} 
                    specs={quotationData.windowSpecs} 
                  />
                </div>
                <div className="preview-info">
                  <div className="preview-details">
                    <h4>{quotationData.selectedWindowType.name}</h4>
                    <p>Dimensions: {quotationData.windowSpecs.width || '1200'}mm × {quotationData.windowSpecs.height || '1500'}mm</p>
                    <p>Frame: {quotationData.windowSpecs.frame}</p>
                    <p>Glass: {quotationData.windowSpecs.glass}</p>
                    <p>Quantity: {quotationData.windowSpecs.quantity}</p>
                  </div>
                  <div className="preview-pricing">
                    <div className="price-display">
                      <span className="price-label">Unit Price:</span>
                      <span className="price-value">${quotationData.pricing.unitPrice.toFixed(2)}</span>
                    </div>
                    <div className="price-display total">
                      <span className="price-label">Total:</span>
                      <span className="price-value">${quotationData.pricing.finalTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-selection">
                <div className="no-selection-icon">🪟</div>
                <h3>Select a Window Type</h3>
                <p>Choose a window type from the dropdown to see preview</p>
              </div>
            )}
          </div>
        </div>
      </div>



      {/* Pricing Section */}
      {quotationData.selectedWindowType && (
        <div className="pricing-section">
          <div className="section-title">Pricing Details</div>
          
          <table className="pricing-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total Price</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{quotationData.selectedWindowType.name}</td>
                <td>{quotationData.windowSpecs.quantity}</td>
                <td>${quotationData.pricing.unitPrice.toFixed(2)}</td>
                <td>${quotationData.pricing.totalPrice.toFixed(2)}</td>
              </tr>
              <tr>
                <td colSpan="3">Tax (10%)</td>
                <td>${quotationData.pricing.tax.toFixed(2)}</td>
              </tr>
              <tr className="total-row">
                <td colSpan="3"><strong>Total Amount</strong></td>
                <td><strong>${quotationData.pricing.finalTotal.toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Terms and Conditions */}
      <div className="terms-section">
        <h4>Terms and Conditions</h4>
        <ul>
          <li>This quotation is valid for 30 days from the date of issue.</li>
          <li>All prices are in USD and include standard installation.</li>
          <li>Delivery time: 2-4 weeks from order confirmation.</li>
          <li>50% advance payment required to commence work.</li>
          <li>Balance payment due on completion of installation.</li>
        </ul>
      </div>

      {/* Signature Section */}
      <div className="signature-section">
        <div className="signature-box">
          <div className="signature-line"></div>
          <div className="signature-label">Customer Signature</div>
        </div>
        <div className="signature-box">
          <div className="signature-line"></div>
          <div className="signature-label">Company Representative</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="quotation-actions">
        <button className="btn-success" onClick={handleNewQuotation}>
          New Quotation
        </button>
        <button className="btn-primary" onClick={handleSaveQuotation}>
          Save Quotation
        </button>
        <button className="btn-secondary" onClick={generatePDF}>
          Generate PDF
        </button>
      </div>
    </div>
  );
};

export default QuotationPage;