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
    slidingConfig: {
      panels: 2,
      combination: null
    },
    bayConfig: {
      combination: null,
      angle: 30 // Default angle in degrees
    },
    doubleHungConfig: {
      combination: null
    },
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

  // Sliding Window Combinations
  const SLIDING_COMBINATIONS = {
    1: [
      { id: '1-fixed', name: '1 Fixed', pattern: ['F'] },
      { id: '1-sliding', name: '1 Sliding', pattern: ['S'] }
    ],
    2: [
      { id: '2-fixed-sliding-left', name: '1 Fixed + 1 Sliding (Left Fixed)', pattern: ['F', 'S'] },
      { id: '2-fixed-sliding-right', name: '1 Fixed + 1 Sliding (Right Fixed)', pattern: ['S', 'F'] },
      { id: '2-both-sliding', name: '2 Sliding (Both Move)', pattern: ['S', 'S'] }
    ],
    3: [
      { id: '3-fsf', name: 'Fixed–Sliding–Fixed', pattern: ['F', 'S', 'F'] },
      { id: '3-sfs', name: 'Sliding–Fixed–Sliding', pattern: ['S', 'F', 'S'] },
      { id: '3-fss', name: 'Fixed–Sliding–Sliding', pattern: ['F', 'S', 'S'] },
      { id: '3-ssf', name: 'Sliding–Sliding–Fixed', pattern: ['S', 'S', 'F'] }
    ],
    4: [
      { id: '4-fssf', name: 'Fixed–Sliding–Sliding–Fixed', pattern: ['F', 'S', 'S', 'F'] },
      { id: '4-sffs', name: 'Sliding–Fixed–Fixed–Sliding', pattern: ['S', 'F', 'F', 'S'] },
      { id: '4-ffss', name: 'Fixed–Fixed–Sliding–Sliding', pattern: ['F', 'F', 'S', 'S'] },
      { id: '4-ssff', name: 'Sliding–Sliding–Fixed–Fixed', pattern: ['S', 'S', 'F', 'F'] },
      { id: '4-ssss', name: 'All 4 Sliding (Stackable)', pattern: ['S', 'S', 'S', 'S'] }
    ],
    5: [
      { id: '5-fsfsf', name: 'Fixed–Sliding–Fixed–Sliding–Fixed', pattern: ['F', 'S', 'F', 'S', 'F'] },
      { id: '5-sfsfs', name: 'Sliding–Fixed–Sliding–Fixed–Sliding', pattern: ['S', 'F', 'S', 'F', 'S'] },
      { id: '5-fsssf', name: 'Fixed–Sliding–Sliding–Sliding–Fixed', pattern: ['F', 'S', 'S', 'S', 'F'] },
      { id: '5-sssss', name: 'All 5 Sliding (Stackable)', pattern: ['S', 'S', 'S', 'S', 'S'] }
    ],
    6: [
      { id: '6-fsssf', name: 'Fixed–Sliding–Sliding–Sliding–Sliding–Fixed', pattern: ['F', 'S', 'S', 'S', 'S', 'F'] },
      { id: '6-sfsfsf', name: 'Sliding–Fixed–Sliding–Fixed–Sliding–Fixed', pattern: ['S', 'F', 'S', 'F', 'S', 'F'] },
      { id: '6-ffssff', name: 'Fixed–Fixed–Sliding–Sliding–Fixed–Fixed', pattern: ['F', 'F', 'S', 'S', 'F', 'F'] },
      { id: '6-ssffss', name: 'Sliding–Sliding–Fixed–Fixed–Sliding–Sliding', pattern: ['S', 'S', 'F', 'F', 'S', 'S'] },
      { id: '6-ssssss', name: 'All 6 Sliding (Stackable)', pattern: ['S', 'S', 'S', 'S', 'S', 'S'] }
    ]
  };

  // Bay Window Combinations
  const BAY_COMBINATIONS = [
    { id: 'bay-3-fixed', name: '3 Fixed Panels (All Fixed)', pattern: ['Fixed', 'Fixed', 'Fixed'] },
    { id: 'bay-fcf', name: 'Fixed – Casement – Fixed', pattern: ['Fixed', 'Casement', 'Fixed'] },
    { id: 'bay-cfc', name: 'Casement – Fixed – Casement', pattern: ['Casement', 'Fixed', 'Casement'] },
    { id: 'bay-sfs', name: 'Sliding – Fixed – Sliding', pattern: ['Sliding', 'Fixed', 'Sliding'] },
    { id: 'bay-fsf', name: 'Fixed – Sliding – Fixed', pattern: ['Fixed', 'Sliding', 'Fixed'] },
    { id: 'bay-faf', name: 'Fixed – Awning – Fixed', pattern: ['Fixed', 'Awning', 'Fixed'] },
    { id: 'bay-cpc', name: 'Casement – Picture – Casement', pattern: ['Casement', 'Picture', 'Casement'] }
  ];

  // Double Hung Window Combinations
  const DOUBLE_HUNG_COMBINATIONS = [
    { id: 'dh-both-sliding', name: '2 Sliding Sashes (Both Move Vertically)', pattern: ['Sliding', 'Sliding'] },
    { id: 'dh-top-fixed', name: 'Top Fixed + Bottom Sliding', pattern: ['Fixed', 'Sliding'] },
    { id: 'dh-bottom-fixed', name: 'Top Sliding + Bottom Fixed', pattern: ['Sliding', 'Fixed'] },
    { id: 'dh-both-fixed', name: 'Both Fixed (False Double Hung)', pattern: ['Fixed', 'Fixed'] },
    { id: 'dh-tilt-in', name: 'Tilt-In Double Hung', pattern: ['Tilt-In', 'Tilt-In'] },
    { id: 'dh-split-glass', name: 'Split Glass Style', pattern: ['Split', 'Split'] }
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
  const WindowDiagram = ({ windowType, specs, slidingConfig, bayConfig, doubleHungConfig }) => {
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

    const renderSlidingWindow = (config) => {
      const frameThickness = 8;
      const glassColor = "#E6F3FF";
      const frameColor = "#003366";
      const slidingColor = "#CCE7FF"; // Lighter blue for sliding panels
      const fixedColor = "#E6F3FF";   // Regular glass color for fixed panels
      
      const panels = config?.panels || 2;
      const combination = config?.combination;
      
      // Get the pattern for the selected combination
      let pattern = ['S', 'S']; // Default 2 sliding panels
      if (combination && SLIDING_COMBINATIONS[panels]) {
        const selectedCombo = SLIDING_COMBINATIONS[panels].find(combo => combo.id === combination);
        if (selectedCombo) {
          pattern = selectedCombo.pattern;
        }
      } else {
        // Default patterns for each panel count
        switch (panels) {
          case 1: pattern = ['S']; break;
          case 2: pattern = ['S', 'S']; break;
          case 3: pattern = ['F', 'S', 'F']; break;
          case 4: pattern = ['F', 'S', 'S', 'F']; break;
          case 5: pattern = ['F', 'S', 'S', 'S', 'F']; break;
          case 6: pattern = ['F', 'S', 'S', 'S', 'S', 'F']; break;
        }
      }
      
      const panelWidth = (width - 36) / panels;
      const trackHeight = 2;
      
      return (
        <g>
          {/* Outer frame */}
          <rect x="10" y="10" width={width-20} height={height-20} fill={frameColor} stroke={frameColor} strokeWidth="2"/>
          
          {/* Render each panel */}
          {pattern.map((panelType, index) => {
            const panelX = 18 + (index * panelWidth);
            const isSliding = panelType === 'S';
            const panelColor = isSliding ? slidingColor : fixedColor;
            
            return (
              <g key={index}>
                {/* Glass panel */}
                <rect 
                  x={panelX + (index > 0 ? 1 : 0)} 
                  y="18" 
                  width={panelWidth - (index > 0 && index < panels - 1 ? 2 : 1)} 
                  height={height-36} 
                  fill={panelColor} 
                  stroke="#ccc" 
                  strokeWidth="1"
                />
                
                {/* Panel separator (mullion) */}
                {index < panels - 1 && (
                  <rect 
                    x={panelX + panelWidth - 1} 
                    y="14" 
                    width="2" 
                    height={height-28} 
                    fill={frameColor}
                  />
                )}
                
                {/* Handle for sliding panels */}
                {isSliding && (
                  <circle 
                    cx={panelX + panelWidth - 15} 
                    cy={height/2} 
                    r="3" 
                    fill="#666"
                  />
                )}
                
                {/* Track indicator for sliding panels */}
                {isSliding && (
                  <rect 
                    x={panelX + 2} 
                    y={height-18} 
                    width={panelWidth - 4} 
                    height={trackHeight} 
                    fill="#999"
                  />
                )}
              </g>
            );
          })}
          
          {/* Bottom track for all sliding windows */}
          <rect x="14" y={height-16} width={width-28} height="2" fill="#999"/>
        </g>
      );
    };

    const renderBayWindowSVG = (combination, angle = 30) => {
      // Professional color scheme
      const frameColor = "#2C3E50";
      const frameHighlight = "#34495E";
      const frameShadow = "#1A252F";
      const glassBase = "#E8F4FD";
      const glassReflection = "#B3D9F7";
      const glassShadow = "#A0C4E8";
      const glassColor = glassBase; // Define glassColor for compatibility
      
      // Calculate angle in radians for proper geometry
      const angleRad = (angle * Math.PI) / 180;
      const cos = Math.cos(angleRad);
      const sin = Math.sin(angleRad);
      
      // Enhanced panel dimensions with accurate proportions
      const isBayWindow = true;
      const svgWidth = isBayWindow ? width + 120 : width;
      const svgHeight = isBayWindow ? height + 100 : height;
      const totalPanelWidth = width * 0.8; // Total usable width
      const centerWidth = totalPanelWidth * 0.5; // True 1/2 of usable width
      const sideWidth = totalPanelWidth * 0.25;  // True 1/4 of usable width each
      const frameThickness = 6;
      const panelHeight = height - 60;
      
      // Professional 3D positioning calculations
      const centerX = svgWidth / 2;
      const centerY = 35;
      const depth = sideWidth * sin * 0.8; // Controlled depth for better proportions
      const shadowOffset = 3;
      
      if (!combination) {
        return (
          <g>
            {/* Enhanced default bay window with proper 3D perspective */}
            {/* Left angled panel with 3D effect */}
            <polygon 
              points={`${centerX - centerWidth/2 - depth},${centerY + depth} ${centerX - centerWidth/2},${centerY} ${centerX - centerWidth/2},${centerY + panelHeight} ${centerX - centerWidth/2 - depth},${centerY + panelHeight + depth}`}
              fill={frameColor}
              stroke={frameColor}
              strokeWidth="2"
            />
            <polygon 
              points={`${centerX - centerWidth/2 - depth + frameThickness},${centerY + depth + frameThickness} ${centerX - centerWidth/2 - frameThickness},${centerY + frameThickness} ${centerX - centerWidth/2 - frameThickness},${centerY + panelHeight - frameThickness} ${centerX - centerWidth/2 - depth + frameThickness},${centerY + panelHeight + depth - frameThickness}`}
              fill={glassColor}
              stroke="#ccc"
              strokeWidth="1"
            />
            
            {/* Center flat panel - adjusted for symmetrical joints */}
            <rect 
              x={centerX - centerWidth/2 + frameThickness} 
              y={centerY} 
              width={centerWidth - 2*frameThickness} 
              height={panelHeight} 
              fill={frameColor}
              stroke={frameColor}
              strokeWidth="2"
            />
            <rect 
              x={centerX - centerWidth/2 + 2*frameThickness} 
              y={centerY + frameThickness} 
              width={centerWidth - 4*frameThickness} 
              height={panelHeight - 2*frameThickness} 
              fill={glassColor}
              stroke="#ccc"
              strokeWidth="1"
            />
            
            {/* Right angled panel with 3D effect - symmetrical to left */}
            <polygon 
              points={`${centerX + centerWidth/2 - frameThickness},${centerY} ${centerX + centerWidth/2 + depth},${centerY + depth} ${centerX + centerWidth/2 + depth},${centerY + panelHeight + depth} ${centerX + centerWidth/2 - frameThickness},${centerY + panelHeight}`}
              fill={frameColor}
              stroke={frameColor}
              strokeWidth="2"
            />
            <polygon 
              points={`${centerX + centerWidth/2},${centerY + frameThickness} ${centerX + centerWidth/2 + depth - frameThickness},${centerY + depth + frameThickness} ${centerX + centerWidth/2 + depth - frameThickness},${centerY + panelHeight + depth - frameThickness} ${centerX + centerWidth/2},${centerY + panelHeight - frameThickness}`}
              fill={glassColor}
              stroke="#ccc"
              strokeWidth="1"
            />
            
            {/* Angle indicator */}
            <line x1={centerX - centerWidth/2} y1={centerY + panelHeight/2} x2={centerX - centerWidth/2 - 30} y2={centerY + panelHeight/2} stroke="#999" strokeWidth="1" strokeDasharray="3,3"/>
            <text x={centerX - centerWidth/2 - 35} y={centerY + panelHeight/2 - 5} fontSize="10" fill="#666">{angle}°</text>
            
            {/* Default labels positioned safely */}
            <text x={centerX - centerWidth/2 - depth/2} y={15} textAnchor="middle" fontSize="12" fill="#333" fontWeight="bold">1/4</text>
            <text x={centerX} y={15} textAnchor="middle" fontSize="12" fill="#333" fontWeight="bold">1/2</text>
            <text x={centerX + centerWidth/2 + depth/2} y={15} textAnchor="middle" fontSize="12" fill="#333" fontWeight="bold">1/4</text>
            
            <text x={centerX} y={centerY + panelHeight + 60} textAnchor="middle" fontSize="12" fill="#666">Select Bay Configuration</text>
          </g>
        );
      }

      const config = BAY_COMBINATIONS.find(c => c.id === combination);
      if (!config) return null;

      // Premium panel colors with sophisticated gradients
      const panelColors = {
        'Fixed': { base: '#95A5A6', light: '#BDC3C7', dark: '#7F8C8D' },
        'Casement': { base: '#3498DB', light: '#5DADE2', dark: '#2E86C1' },
        'Sliding': { base: '#2ECC71', light: '#58D68D', dark: '#27AE60' },
        'Picture': { base: '#9B59B6', light: '#BB8FCE', dark: '#8E44AD' },
        'Awning': { base: '#E67E22', light: '#F39C12', dark: '#D35400' }
      };

      return (
        <g>
          {/* Add subtle shadow for depth */}
          <g opacity="0.2">
            <polygon 
              points={`${centerX - centerWidth/2 - depth + shadowOffset},${centerY + depth + shadowOffset} ${centerX - centerWidth/2 + shadowOffset},${centerY + shadowOffset} ${centerX - centerWidth/2 + shadowOffset},${centerY + panelHeight + shadowOffset} ${centerX - centerWidth/2 - depth + shadowOffset},${centerY + panelHeight + depth + shadowOffset}`}
              fill="#000"
            />
            <rect 
              x={centerX - centerWidth/2 + frameThickness + shadowOffset} 
              y={centerY + shadowOffset} 
              width={centerWidth - 2*frameThickness} 
              height={panelHeight} 
              fill="#000"
            />
            <polygon 
              points={`${centerX + centerWidth/2 - frameThickness + shadowOffset},${centerY + shadowOffset} ${centerX + centerWidth/2 + depth + shadowOffset},${centerY + depth + shadowOffset} ${centerX + centerWidth/2 + depth + shadowOffset},${centerY + panelHeight + depth + shadowOffset} ${centerX + centerWidth/2 - frameThickness + shadowOffset},${centerY + panelHeight + shadowOffset}`}
              fill="#000"
            />
          </g>

          {/* LEFT ANGLED PANEL - Enhanced with 3D effects */}
          {/* Frame with gradient */}
          <defs>
            <linearGradient id="leftFrameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={frameHighlight} />
              <stop offset="50%" stopColor={frameColor} />
              <stop offset="100%" stopColor={frameShadow} />
            </linearGradient>
            <linearGradient id={`leftGlass${config.pattern[0]}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={panelColors[config.pattern[0]]?.light || glassReflection} />
              <stop offset="30%" stopColor={panelColors[config.pattern[0]]?.base || glassBase} />
              <stop offset="100%" stopColor={panelColors[config.pattern[0]]?.dark || glassShadow} />
            </linearGradient>
          </defs>
          
          <polygon 
            points={`${centerX - centerWidth/2 - depth},${centerY + depth} ${centerX - centerWidth/2 + frameThickness},${centerY} ${centerX - centerWidth/2 + frameThickness},${centerY + panelHeight} ${centerX - centerWidth/2 - depth},${centerY + panelHeight + depth}`}
            fill="url(#leftFrameGrad)"
            stroke={frameShadow}
            strokeWidth="1"
          />
          <polygon 
            points={`${centerX - centerWidth/2 - depth + frameThickness},${centerY + depth + frameThickness} ${centerX - centerWidth/2},${centerY + frameThickness} ${centerX - centerWidth/2},${centerY + panelHeight - frameThickness} ${centerX - centerWidth/2 - depth + frameThickness},${centerY + panelHeight + depth - frameThickness}`}
            fill={`url(#leftGlass${config.pattern[0]})`}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="0.5"
          />
          
          {/* CENTER FLAT PANEL - Premium finish */}
          <defs>
            <linearGradient id="centerFrameGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={frameHighlight} />
              <stop offset="50%" stopColor={frameColor} />
              <stop offset="100%" stopColor={frameShadow} />
            </linearGradient>
            <linearGradient id={`centerGlass${config.pattern[1]}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={panelColors[config.pattern[1]]?.light || glassReflection} />
              <stop offset="40%" stopColor={panelColors[config.pattern[1]]?.base || glassBase} />
              <stop offset="100%" stopColor={panelColors[config.pattern[1]]?.dark || glassShadow} />
            </linearGradient>
          </defs>
          
          <rect 
            x={centerX - centerWidth/2} 
            y={centerY} 
            width={centerWidth} 
            height={panelHeight} 
            fill="url(#centerFrameGrad)"
            stroke={frameShadow}
            strokeWidth="1"
          />
          <rect 
            x={centerX - centerWidth/2 + frameThickness} 
            y={centerY + frameThickness} 
            width={centerWidth - 2*frameThickness} 
            height={panelHeight - 2*frameThickness} 
            fill={`url(#centerGlass${config.pattern[1]})`}
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="0.5"
          />
          
          {/* Realistic glass reflection */}
          <rect 
            x={centerX - centerWidth/2 + frameThickness + 5} 
            y={centerY + frameThickness + 10} 
            width={(centerWidth - 2*frameThickness) * 0.3} 
            height={panelHeight * 0.6} 
            fill="rgba(255,255,255,0.15)"
            rx="2"
          />
          
          {/* RIGHT ANGLED PANEL - Mirror of left with proper gradients */}
          <defs>
            <linearGradient id="rightFrameGrad" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={frameHighlight} />
              <stop offset="50%" stopColor={frameColor} />
              <stop offset="100%" stopColor={frameShadow} />
            </linearGradient>
            <linearGradient id={`rightGlass${config.pattern[2]}`} x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={panelColors[config.pattern[2]]?.light || glassReflection} />
              <stop offset="30%" stopColor={panelColors[config.pattern[2]]?.base || glassBase} />
              <stop offset="100%" stopColor={panelColors[config.pattern[2]]?.dark || glassShadow} />
            </linearGradient>
          </defs>
          
          <polygon 
            points={`${centerX + centerWidth/2 - frameThickness},${centerY} ${centerX + centerWidth/2 + depth},${centerY + depth} ${centerX + centerWidth/2 + depth},${centerY + panelHeight + depth} ${centerX + centerWidth/2 - frameThickness},${centerY + panelHeight}`}
            fill="url(#rightFrameGrad)"
            stroke={frameShadow}
            strokeWidth="1"
          />
          <polygon 
            points={`${centerX + centerWidth/2},${centerY + frameThickness} ${centerX + centerWidth/2 + depth - frameThickness},${centerY + depth + frameThickness} ${centerX + centerWidth/2 + depth - frameThickness},${centerY + panelHeight + depth - frameThickness} ${centerX + centerWidth/2},${centerY + panelHeight - frameThickness}`}
            fill={`url(#rightGlass${config.pattern[2]})`}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="0.5"
          />

          {/* Professional mullions/dividers */}
          <line 
            x1={centerX - centerWidth/2 - frameThickness} 
            y1={centerY} 
            x2={centerX - centerWidth/2 - frameThickness} 
            y2={centerY + panelHeight} 
            stroke={frameShadow} 
            strokeWidth="2"
          />
          <line 
            x1={centerX + centerWidth/2 - frameThickness} 
            y1={centerY} 
            x2={centerX + centerWidth/2 - frameThickness} 
            y2={centerY + panelHeight} 
            stroke={frameShadow} 
            strokeWidth="2"
          />

          {/* Premium panel size labels with professional styling */}
          <defs>
            <filter id="labelShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="1" dy="1" stdDeviation="1" floodColor="rgba(0,0,0,0.3)"/>
            </filter>
          </defs>
          
          <text x={centerX - centerWidth/2 - depth/2} y={20} textAnchor="middle" fontSize="14" fill="#2C3E50" fontWeight="600" filter="url(#labelShadow)">1/4</text>
          <text x={centerX} y={20} textAnchor="middle" fontSize="14" fill="#2C3E50" fontWeight="600" filter="url(#labelShadow)">1/2</text>
          <text x={centerX + centerWidth/2 + depth/2} y={20} textAnchor="middle" fontSize="14" fill="#2C3E50" fontWeight="600" filter="url(#labelShadow)">1/4</text>
          
          {/* Elegant panel type labels - adjusted positioning */}
          <rect x={centerX - centerWidth/2 - depth/2 - 25} y={centerY + panelHeight + 20} width="50" height="18" rx="9" fill="rgba(44,62,80,0.1)" stroke="rgba(44,62,80,0.3)" strokeWidth="1"/>
          <text x={centerX - centerWidth/2 - depth/2} y={centerY + panelHeight + 32} textAnchor="middle" fontSize="11" fill="#2C3E50" fontWeight="500">{config.pattern[0]}</text>
          
          <rect x={centerX - 25} y={centerY + panelHeight + 25} width="50" height="18" rx="9" fill="rgba(44,62,80,0.1)" stroke="rgba(44,62,80,0.3)" strokeWidth="1"/>
          <text x={centerX} y={centerY + panelHeight + 37} textAnchor="middle" fontSize="11" fill="#2C3E50" fontWeight="500">{config.pattern[1]}</text>
          
          <rect x={centerX + centerWidth/2 + depth/2 - 25} y={centerY + panelHeight + 20} width="50" height="18" rx="9" fill="rgba(44,62,80,0.1)" stroke="rgba(44,62,80,0.3)" strokeWidth="1"/>
          <text x={centerX + centerWidth/2 + depth/2} y={centerY + panelHeight + 32} textAnchor="middle" fontSize="11" fill="#2C3E50" fontWeight="500">{config.pattern[2]}</text>

          {/* Premium movement indicators with icons - adjusted positioning */}
          {config.pattern[0] === 'Casement' && (
            <g>
              <circle cx={centerX - centerWidth/2 - depth/2} cy={centerY + panelHeight + 50} r="8" fill="#E74C3C" opacity="0.9"/>
              <text x={centerX - centerWidth/2 - depth/2} y={centerY + panelHeight + 54} textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">↔</text>
            </g>
          )}
          {config.pattern[0] === 'Sliding' && (
            <g>
              <circle cx={centerX - centerWidth/2 - depth/2} cy={centerY + panelHeight + 50} r="8" fill="#2ECC71" opacity="0.9"/>
              <text x={centerX - centerWidth/2 - depth/2} y={centerY + panelHeight + 54} textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">⟵⟶</text>
            </g>
          )}
          {config.pattern[0] === 'Awning' && (
            <g>
              <circle cx={centerX - centerWidth/2 - depth/2} cy={centerY + panelHeight + 50} r="8" fill="#F39C12" opacity="0.9"/>
              <text x={centerX - centerWidth/2 - depth/2} y={centerY + panelHeight + 54} textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">↕</text>
            </g>
          )}

          {config.pattern[1] === 'Casement' && (
            <g>
              <circle cx={centerX} cy={centerY + panelHeight + 55} r="8" fill="#E74C3C" opacity="0.9"/>
              <text x={centerX} y={centerY + panelHeight + 59} textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">↔</text>
            </g>
          )}
          {config.pattern[1] === 'Sliding' && (
            <g>
              <circle cx={centerX} cy={centerY + panelHeight + 55} r="8" fill="#2ECC71" opacity="0.9"/>
              <text x={centerX} y={centerY + panelHeight + 59} textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">⟵⟶</text>
            </g>
          )}
          {config.pattern[1] === 'Awning' && (
            <g>
              <circle cx={centerX} cy={centerY + panelHeight + 55} r="8" fill="#F39C12" opacity="0.9"/>
              <text x={centerX} y={centerY + panelHeight + 59} textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">↕</text>
            </g>
          )}

          {config.pattern[2] === 'Casement' && (
            <g>
              <circle cx={centerX + centerWidth/2 + depth/2} cy={centerY + panelHeight + 50} r="8" fill="#E74C3C" opacity="0.9"/>
              <text x={centerX + centerWidth/2 + depth/2} y={centerY + panelHeight + 54} textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">↔</text>
            </g>
          )}
          {config.pattern[2] === 'Sliding' && (
            <g>
              <circle cx={centerX + centerWidth/2 + depth/2} cy={centerY + panelHeight + 45} r="8" fill="#2ECC71" opacity="0.9"/>
              <text x={centerX + centerWidth/2 + depth/2} y={centerY + panelHeight + 49} textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">⟵⟶</text>
            </g>
          )}
          {config.pattern[2] === 'Awning' && (
            <g>
              <circle cx={centerX + centerWidth/2 + depth/2} cy={centerY + panelHeight + 45} r="8" fill="#F39C12" opacity="0.9"/>
              <text x={centerX + centerWidth/2 + depth/2} y={centerY + panelHeight + 49} textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">↕</text>
            </g>
          )}

          {/* Professional angle indicator with enhanced styling */}
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#34495E" />
            </marker>
          </defs>
          
          <line x1={centerX - centerWidth/2 - frameThickness} y1={centerY + 25} x2={centerX - centerWidth/2 - 45} y2={centerY + 25} stroke="#34495E" strokeWidth="2" strokeDasharray="5,3" markerEnd="url(#arrowhead)"/>
          <path d={`M ${centerX - centerWidth/2 - 35} ${centerY + 25} A 20 20 0 0 0 ${centerX - centerWidth/2 - 35 + 20*cos} ${centerY + 25 - 20*sin}`} stroke="#E74C3C" strokeWidth="2" fill="none"/>
          
          <rect x={centerX - centerWidth/2 - 70} y={centerY + 10} width="30" height="20" rx="10" fill="rgba(231,76,60,0.9)" stroke="#C0392B" strokeWidth="1"/>
          <text x={centerX - centerWidth/2 - 55} y={centerY + 23} textAnchor="middle" fontSize="11" fill="white" fontWeight="bold">{angle}°</text>
        </g>
      );
    };



    const renderDoubleHungWindowSVG = (combination) => {
      const frameColor = "#003366";
      const glassColor = "#E6F3FF";
      
      if (!combination) {
        // Default double hung window
        return (
          <g>
            <rect x="10" y="10" width={width-20} height={height-20} fill={frameColor} stroke={frameColor} strokeWidth="2"/>
            <rect x="18" y="18" width={width-36} height={(height-36)/2-4} fill={glassColor} stroke="#ccc" strokeWidth="1"/>
            <rect x="18" y={18+(height-36)/2+4} width={width-36} height={(height-36)/2-4} fill={glassColor} stroke="#ccc" strokeWidth="1"/>
            <rect x="10" y={height/2-2} width={width-20} height="4" fill={frameColor}/>
            <text x={width/2} y={height-5} textAnchor="middle" fontSize="12" fill="#666">Select Double Hung Configuration</text>
          </g>
        );
      }

      const config = DOUBLE_HUNG_COMBINATIONS.find(c => c.id === combination);
      if (!config) return null;

      const sashColors = {
        'Sliding': '#2ecc71',
        'Fixed': '#95a5a6',
        'Tilt-In': '#3498db',
        'Split': '#9b59b6'
      };

      return (
        <g>
          {/* Window frame */}
          <rect x="10" y="10" width={width-20} height={height-20} fill={frameColor} stroke={frameColor} strokeWidth="2"/>
          
          {/* Top sash */}
          <rect 
            x="18" 
            y="18" 
            width={width-36} 
            height={(height-36)/2-4} 
            fill={sashColors[config.pattern[0]] || glassColor} 
            stroke="#ccc" 
            strokeWidth="1"
          />
          
          {/* Bottom sash */}
          <rect 
            x="18" 
            y={18+(height-36)/2+4} 
            width={width-36} 
            height={(height-36)/2-4} 
            fill={sashColors[config.pattern[1]] || glassColor} 
            stroke="#ccc" 
            strokeWidth="1"
          />
          
          {/* Middle rail/divider */}
          <rect x="10" y={height/2-2} width={width-20} height="4" fill={frameColor}/>

          {/* Sash labels */}
          <text x={width/2} y={height/4+5} textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">
            Top: {config.pattern[0]}
          </text>
          <text x={width/2} y={height*3/4+5} textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">
            Bottom: {config.pattern[1]}
          </text>

          {/* Movement indicators */}
          {(config.pattern[0] === 'Sliding' || config.pattern[0] === 'Tilt-In') && (
            <text x={width/2} y={height/4+18} textAnchor="middle" fontSize="12" fill="#e74c3c">↕</text>
          )}
          {config.pattern[0] === 'Split' && (
            <text x={width/2} y={height/4+18} textAnchor="middle" fontSize="12" fill="#e74c3c">⊞</text>
          )}

          {(config.pattern[1] === 'Sliding' || config.pattern[1] === 'Tilt-In') && (
            <text x={width/2} y={height*3/4+18} textAnchor="middle" fontSize="12" fill="#e74c3c">↕</text>
          )}
          {config.pattern[1] === 'Split' && (
            <text x={width/2} y={height*3/4+18} textAnchor="middle" fontSize="12" fill="#e74c3c">⊞</text>
          )}

          {/* Configuration name at bottom */}
          <text x={width/2} y={height-5} textAnchor="middle" fontSize="12" fill="#666" fontWeight="bold">
            {config.name}
          </text>
        </g>
      );
    };

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
        case 'Double Hung Windows':
          return renderDoubleHungWindowSVG(doubleHungConfig?.combination);
          
        case 'sliding':
          return renderSlidingWindow(slidingConfig);
        
        case 'Sliding Windows':
          return renderSlidingWindow(slidingConfig);
          
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
        case 'Bay Windows':
          return renderBayWindowSVG(bayConfig?.combination, bayConfig?.angle || 30);
          
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

    // Adjust dimensions for bay windows to accommodate 3D projection and labels
    const isBayWindow = windowType?.name === 'Bay Windows';
    const svgWidth = isBayWindow ? width + 120 : width;  // Extra width for angled panels
    const svgHeight = isBayWindow ? height + 100 : height; // Extra height for labels
    
    return (
      <div className="window-diagram-container">
        <svg width={svgWidth} height={svgHeight} className="window-diagram" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
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

              {/* Dynamic Sliding Window Configuration */}
              {quotationData.selectedWindowType?.name === 'Sliding Windows' && (
                <div className="sliding-config-section">
                  <div className="sliding-input-group">
                    <label>Number of Panels:</label>
                    <select
                      value={quotationData.slidingConfig.panels}
                      onChange={(e) => {
                        const panels = parseInt(e.target.value);
                        setQuotationData(prev => ({
                          ...prev,
                          slidingConfig: {
                            ...prev.slidingConfig,
                            panels: panels,
                            combination: null // Reset combination when panels change
                          }
                        }));
                      }}
                      className="sliding-dropdown"
                    >
                      <option value={1}>1 Panel</option>
                      <option value={2}>2 Panels</option>
                      <option value={3}>3 Panels</option>
                      <option value={4}>4 Panels</option>
                      <option value={5}>5 Panels</option>
                      <option value={6}>6 Panels</option>
                    </select>
                  </div>

                  <div className="sliding-input-group">
                    <label>Panel Configuration:</label>
                    <select
                      value={quotationData.slidingConfig.combination || ''}
                      onChange={(e) => {
                        setQuotationData(prev => ({
                          ...prev,
                          slidingConfig: {
                            ...prev.slidingConfig,
                            combination: e.target.value
                          }
                        }));
                      }}
                      className="sliding-dropdown"
                    >
                      <option value="">Select Configuration</option>
                      {SLIDING_COMBINATIONS[quotationData.slidingConfig.panels]?.map(combo => (
                        <option key={combo.id} value={combo.id}>
                          {combo.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {quotationData.slidingConfig.combination && (
                    <div className="pattern-preview">
                      <span className="pattern-label">Pattern: </span>
                      {SLIDING_COMBINATIONS[quotationData.slidingConfig.panels]
                        ?.find(combo => combo.id === quotationData.slidingConfig.combination)
                        ?.pattern.map((panel, index) => (
                          <span key={index} className={`panel-indicator ${panel === 'F' ? 'fixed' : 'sliding'}`}>
                            {panel === 'F' ? 'Fixed' : 'Sliding'}
                            {index < SLIDING_COMBINATIONS[quotationData.slidingConfig.panels]
                              .find(combo => combo.id === quotationData.slidingConfig.combination)
                              .pattern.length - 1 && ' – '}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Dynamic Bay Window Configuration */}
              {quotationData.selectedWindowType?.name === 'Bay Windows' && (
                <div className="bay-config-section">
                  <div className="bay-input-group">
                    <label>Bay Window Configuration:</label>
                    <select
                      value={quotationData.bayConfig.combination || ''}
                      onChange={(e) => {
                        setQuotationData(prev => ({
                          ...prev,
                          bayConfig: {
                            ...prev.bayConfig,
                            combination: e.target.value
                          }
                        }));
                      }}
                      className="bay-dropdown"
                    >
                      <option value="">Select Configuration</option>
                      {BAY_COMBINATIONS.map(combo => (
                        <option key={combo.id} value={combo.id}>
                          {combo.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="bay-input-group">
                    <label>Bay Window Angle:</label>
                    <select
                      value={quotationData.bayConfig.angle}
                      onChange={(e) => {
                        setQuotationData(prev => ({
                          ...prev,
                          bayConfig: {
                            ...prev.bayConfig,
                            angle: parseInt(e.target.value)
                          }
                        }));
                      }}
                      className="bay-dropdown"
                    >
                      <option value={15}>15° (Shallow Bay)</option>
                      <option value={22.5}>22.5° (Standard Bay)</option>
                      <option value={25}>25° (Three-Lite Bay)</option>
                      <option value={30}>30° (Standard Bay)</option>
                      <option value={45}>45° (Corner Bay)</option>
                      <option value={60}>60° (Wide Bay)</option>
                      <option value={90}>90° (Right Angle Bay)</option>
                    </select>
                  </div>


                </div>
              )}

              {/* Dynamic Double Hung Window Configuration */}
              {quotationData.selectedWindowType?.name === 'Double Hung Windows' && (
                <div className="double-hung-config-section">
                  <div className="double-hung-input-group">
                    <label>Double Hung Configuration:</label>
                    <select
                      value={quotationData.doubleHungConfig.combination || ''}
                      onChange={(e) => {
                        setQuotationData(prev => ({
                          ...prev,
                          doubleHungConfig: {
                            ...prev.doubleHungConfig,
                            combination: e.target.value
                          }
                        }));
                      }}
                      className="double-hung-dropdown"
                    >
                      <option value="">Select Configuration</option>
                      {DOUBLE_HUNG_COMBINATIONS.map(combo => (
                        <option key={combo.id} value={combo.id}>
                          {combo.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {quotationData.doubleHungConfig.combination && (
                    <div className="pattern-preview">
                      <span className="pattern-label">Sash Configuration: </span>
                      {DOUBLE_HUNG_COMBINATIONS
                        .find(combo => combo.id === quotationData.doubleHungConfig.combination)
                        ?.pattern.map((sash, index) => (
                          <span key={index} className={`panel-indicator double-hung-sash ${sash.toLowerCase().replace('-', '_')}`}>
                            {index === 0 ? 'Top: ' : 'Bottom: '}{sash}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
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
                    slidingConfig={quotationData.slidingConfig}
                    bayConfig={quotationData.bayConfig}
                    doubleHungConfig={quotationData.doubleHungConfig}
                  />
                </div>
                <div className="preview-info">
                  <div className="preview-details">
                    <h4>{quotationData.selectedWindowType.name}</h4>
                    <p>Dimensions: {quotationData.windowSpecs.width || '1200'}mm × {quotationData.windowSpecs.height || '1500'}mm</p>
                    {quotationData.selectedWindowType?.name === 'Bay Windows' && quotationData.bayConfig.combination && (
                      <>
                        <p>Configuration: {BAY_COMBINATIONS.find(c => c.id === quotationData.bayConfig.combination)?.name}</p>
                        <p>Bay Angle: {quotationData.bayConfig.angle}°</p>
                      </>
                    )}
                    {quotationData.selectedWindowType?.name === 'Double Hung Windows' && quotationData.doubleHungConfig.combination && (
                      <p>Configuration: {DOUBLE_HUNG_COMBINATIONS.find(c => c.id === quotationData.doubleHungConfig.combination)?.name}</p>
                    )}
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