import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './QuotationPageADS.css';
import ClientService from './services/ClientService';
import InventoryService from './services/InventoryService';
import QuoteService from './services/QuoteService';
import { useCompany } from './CompanyContext';
import { useAppMode } from './contexts/AppModeContext';
import ModeSelector from './components/ModeSelector';
import { generateQuotationPDF } from './utils/pdfGenerator';
import { generateExactQuotationPDF } from './utils/pdfGeneratorExact';
import { generatePerfectQuotationPDF } from './utils/pdfGeneratorPerfect';
import ConfirmDialog from './components/ConfirmDialog';
import { validateQuotationForm, hasValidationErrors, scrollToFirstError } from './utils/validation';

const QuotationPage = () => {
  const location = useLocation();
  const { companyInfo, getNextQuotationNumber } = useCompany();
  const {
    currentMode,
    getCurrentModeConfig,
    canIgnoreInventory,
    shouldShowInventoryWarnings,
    requiresInventoryValidation,
    allowsUnlimitedConfigurations
  } = useAppMode();
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', description: '' });
  const [activeTab, setActiveTab] = useState('configuration');
  const [inventoryItems, setInventoryItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Validation and Confirmation Dialog States
  const [validationErrors, setValidationErrors] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning',
    confirmText: 'OK',
    cancelText: 'Cancel'
  });

  // Notification/Toast State
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success' // 'success', 'error', 'info', 'warning'
  });

  // Multi-window management state
  const [windows, setWindows] = useState([]);
  const [currentWindowIndex, setCurrentWindowIndex] = useState(0);


  // Load quotation data from localStorage or use default
  const loadQuotationData = () => {
    try {
      const savedData = localStorage.getItem('quotationData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        // Ensure all required fields exist by merging with default structure
        return {
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
            angle: 30
          },
          doubleHungConfig: {
            combination: null
          },
          singleHungConfig: {
            combination: 'sh-standard'
          },
          casementConfig: {
            direction: 'outward',
            hinge: 'left'
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
          },
          ...parsedData // Override with saved data
        };
      }
    } catch (error) {
      console.error('Error loading quotation data from localStorage:', error);
    }
    
    // Return default data if no saved data or error occurred
    return {
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
        angle: 30
      },
      doubleHungConfig: {
        combination: null
      },
      singleHungConfig: {
        combination: 'sh-standard'
      },
      casementConfig: {
        direction: 'outward',
        hinge: 'left'
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
    };
  };

  // Function to clean up invalid quote IDs from localStorage
  const cleanupInvalidQuoteIds = async () => {
    try {
      const quotations = JSON.parse(localStorage.getItem('quotations') || '[]');
      const validQuotations = [];
      
      for (const quotation of quotations) {
        if (quotation._id) {
          try {
            // Check if quote exists in database
            await QuoteService.getQuote(quotation._id);
            validQuotations.push(quotation);
          } catch (error) {
            console.warn(`Removing invalid quote ID from localStorage: ${quotation._id}`);
            // Skip invalid quotes - they won't be added to validQuotations
          }
        } else {
          validQuotations.push(quotation);
        }
      }
      
      // Update localStorage with only valid quotations
      localStorage.setItem('quotations', JSON.stringify(validQuotations));
    } catch (error) {
      console.error('Error cleaning up invalid quote IDs:', error);
    }
  };

  const [quotationData, setQuotationData] = useState(loadQuotationData());

  // Handle edit mode when component mounts
  useEffect(() => {
    const { editMode, quoteData, quoteId } = location.state || {};
    if (editMode && quoteData) {
      console.log('Edit mode activated with quote data:', quoteData);
      
      // Find the corresponding window type from WINDOW_TYPES
      let selectedWindowType = null;
      if (quoteData.selectedWindowType) {
        // Handle both string and object cases
        const windowTypeId = typeof quoteData.selectedWindowType === 'string' 
          ? quoteData.selectedWindowType.toLowerCase()
          : quoteData.selectedWindowType.id || quoteData.selectedWindowType.name?.toLowerCase();
        
        console.log('Looking for window type:', windowTypeId, 'in WINDOW_TYPES');
        selectedWindowType = WINDOW_TYPES.find(type => 
          type.id === windowTypeId || 
          type.name.toLowerCase().includes(windowTypeId) ||
          windowTypeId.includes(type.id)
        ) || WINDOW_TYPES.find(type => type.id === 'sliding'); // fallback
        
        console.log('Found window type:', selectedWindowType);
      }

      // Check if we have raw configuration data for perfect restoration
      const rawConfig = quoteData.rawConfigurationData;
      
      // If no raw config, try to reconstruct from available data structures
      const reconstructedConfig = !rawConfig ? {
        windowSpecs: {
          // Dimensions & Basic Info
          width: quoteData.windowSpecs?.[0]?.dimensions?.width || '',
          height: quoteData.windowSpecs?.[0]?.dimensions?.height || '',
          quantity: quoteData.windowSpecs?.[0]?.pricing?.quantity || 1,
          
          // Installation Details
          location: quoteData.windowSpecs?.[0]?.specifications?.location || 'ground-floor',
          wallType: quoteData.windowSpecs?.[0]?.specifications?.wallType || 'brick',
          replacement: quoteData.windowSpecs?.[0]?.specifications?.replacement || 'new-opening',
          installationMethod: quoteData.windowSpecs?.[0]?.specifications?.installationMethod || 'standard',
          finishingWork: quoteData.windowSpecs?.[0]?.specifications?.finishingWork || 'basic',
          cleanup: quoteData.windowSpecs?.[0]?.specifications?.cleanup ?? true,
          
          // Frame Material & Color
          frame: quoteData.windowSpecs?.[0]?.specifications?.frameMaterial || 'aluminum',
          frameColor: quoteData.windowSpecs?.[0]?.specifications?.frameColor || 'white',
          color: quoteData.windowSpecs?.[0]?.specifications?.frameColor || 'white',
          
          // Glass Specifications
          glass: quoteData.windowSpecs?.[0]?.specifications?.glass || 'single',
          glassTint: quoteData.windowSpecs?.[0]?.specifications?.glassTint || 'clear',
          glassPattern: quoteData.windowSpecs?.[0]?.specifications?.glassPattern || 'clear',
          
          // Hardware & Operation
          hardware: quoteData.windowSpecs?.[0]?.specifications?.hardware || 'standard',
          opening: quoteData.windowSpecs?.[0]?.specifications?.openingType || 'fixed',
          lockPosition: quoteData.windowSpecs?.[0]?.specifications?.lockPosition || 'right',
          
          // Grille & Aesthetic Features
          grilles: quoteData.windowSpecs?.[0]?.specifications?.grille?.style || 'none',
          grillePattern: quoteData.windowSpecs?.[0]?.specifications?.grille?.pattern || 'grid',
          grillColor: quoteData.windowSpecs?.[0]?.specifications?.grillColor || 'white',
          grilleEnabled: quoteData.windowSpecs?.[0]?.specifications?.grille?.enabled || false,
          
          // Weather & Energy Features
          weatherStripping: quoteData.windowSpecs?.[0]?.specifications?.weatherStripping || quoteData.windowSpecs?.[0]?.specifications?.weatherSealing || 'standard',
          weatherSealing: quoteData.windowSpecs?.[0]?.specifications?.weatherSealing || quoteData.windowSpecs?.[0]?.specifications?.weatherStripping || 'standard',
          insulation: quoteData.windowSpecs?.[0]?.specifications?.insulation || 'standard',
          energyRating: quoteData.windowSpecs?.[0]?.specifications?.energyRating || 'standard',
          drainage: quoteData.windowSpecs?.[0]?.specifications?.drainage || 'standard',
          
          // Comfort & Additional Options
          screenIncluded: quoteData.windowSpecs?.[0]?.specifications?.screenIncluded || false,
          motorized: quoteData.windowSpecs?.[0]?.specifications?.motorized || false,
          security: quoteData.windowSpecs?.[0]?.specifications?.security || 'standard',
          childSafety: quoteData.windowSpecs?.[0]?.specifications?.childSafety || false,
          tiltAndTurn: quoteData.windowSpecs?.[0]?.specifications?.tiltAndTurn || false,
          smartHome: quoteData.windowSpecs?.[0]?.specifications?.smartHome || false,
          
          // Accessories & Add-ons
          blindsIntegrated: quoteData.windowSpecs?.[0]?.specifications?.blindsIntegrated || false,
          blindsIncluded: quoteData.windowSpecs?.[0]?.specifications?.blindsIncluded || false,
          curtainRail: quoteData.windowSpecs?.[0]?.specifications?.curtainRail || false,
          ventilation: quoteData.windowSpecs?.[0]?.specifications?.ventilation || false,
          trimStyle: quoteData.windowSpecs?.[0]?.specifications?.trimStyle || 'standard'
        },
        slidingConfig: quoteData.slidingConfig || quoteData.windowSpecs?.[0]?.specifications?.slidingDetails || {},
        casementConfig: quoteData.casementConfig || quoteData.windowSpecs?.[0]?.specifications?.casementDetails || {},
        bayConfig: quoteData.bayConfig || quoteData.windowSpecs?.[0]?.specifications?.bayDetails || {},
        awningConfig: quoteData.awningConfig || quoteData.windowSpecs?.[0]?.specifications?.awningDetails || {},
        doubleHungConfig: quoteData.doubleHungConfig || quoteData.windowSpecs?.[0]?.specifications?.doubleHungDetails || {},
        singleHungConfig: quoteData.singleHungConfig || quoteData.windowSpecs?.[0]?.specifications?.singleHungDetails || {},
        pricing: quoteData.pricing || {}
      } : null;
      
      // Use either raw config or reconstructed config as fallback
      const effectiveConfig = rawConfig || reconstructedConfig;
      
      console.log('Effective configuration for restoration:', effectiveConfig);
      
      // Set the quotation data with the edit data
      const editQuotationData = {
        quotationNumber: quoteData.quotationNumber || '',
        date: quoteData.createdAt ? new Date(quoteData.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        validUntil: quoteData.validUntil ? new Date(quoteData.validUntil).toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        clientInfo: {
          name: quoteData.clientInfo?.name || '',
          address: quoteData.clientInfo?.address || '',
          city: quoteData.clientInfo?.city || '',
          phone: quoteData.clientInfo?.phone || '',
          email: quoteData.clientInfo?.email || ''
        },
        selectedWindowType: selectedWindowType || effectiveConfig?.selectedWindowType,
        windowSpecs: {
          // COMPREHENSIVE RESTORATION: Dimensions & Basic Info
          width: effectiveConfig?.windowSpecs?.width || quoteData.windowSpecs?.[0]?.dimensions?.width || quoteData.windowSpecs?.width || '',
          height: effectiveConfig?.windowSpecs?.height || quoteData.windowSpecs?.[0]?.dimensions?.height || quoteData.windowSpecs?.height || '',
          quantity: effectiveConfig?.windowSpecs?.quantity || quoteData.windowSpecs?.[0]?.pricing?.quantity || quoteData.windowSpecs?.quantity || 1,
          
          // Installation Details (COMPLETE RESTORATION)
          location: effectiveConfig?.windowSpecs?.location || quoteData.windowSpecs?.[0]?.specifications?.location || 'ground-floor',
          wallType: effectiveConfig?.windowSpecs?.wallType || quoteData.windowSpecs?.[0]?.specifications?.wallType || 'brick',
          replacement: effectiveConfig?.windowSpecs?.replacement || quoteData.windowSpecs?.[0]?.specifications?.replacement || 'new-opening',
          installationMethod: effectiveConfig?.windowSpecs?.installationMethod || quoteData.windowSpecs?.[0]?.specifications?.installationMethod || 'standard',
          finishingWork: effectiveConfig?.windowSpecs?.finishingWork || quoteData.windowSpecs?.[0]?.specifications?.finishingWork || 'basic',
          cleanup: effectiveConfig?.windowSpecs?.cleanup ?? quoteData.windowSpecs?.[0]?.specifications?.cleanup ?? true,
          
          // Frame Material & Color (COMPLETE RESTORATION)
          frame: effectiveConfig?.windowSpecs?.frame || quoteData.windowSpecs?.[0]?.specifications?.frameMaterial || quoteData.windowSpecs?.frame || 'aluminum',
          frameColor: effectiveConfig?.windowSpecs?.frameColor || quoteData.windowSpecs?.[0]?.specifications?.frameColor || quoteData.windowSpecs?.color || 'white',
          color: effectiveConfig?.windowSpecs?.color || quoteData.windowSpecs?.[0]?.specifications?.frameColor || quoteData.windowSpecs?.color || 'white', // Legacy support
          
          // Glass Specifications (COMPLETE RESTORATION)
          glass: effectiveConfig?.windowSpecs?.glass || quoteData.windowSpecs?.[0]?.specifications?.glass || quoteData.windowSpecs?.glass || 'single',
          glassTint: effectiveConfig?.windowSpecs?.glassTint || quoteData.windowSpecs?.[0]?.specifications?.glassTint || 'clear',
          glassPattern: effectiveConfig?.windowSpecs?.glassPattern || quoteData.windowSpecs?.[0]?.specifications?.glassPattern || 'clear',
          
          // Hardware & Operation (COMPLETE RESTORATION)
          hardware: effectiveConfig?.windowSpecs?.hardware || quoteData.windowSpecs?.[0]?.specifications?.hardware || quoteData.windowSpecs?.hardware || 'standard',
          opening: effectiveConfig?.windowSpecs?.opening || quoteData.windowSpecs?.[0]?.specifications?.openingType || quoteData.windowSpecs?.opening || 'fixed',
          lockPosition: effectiveConfig?.windowSpecs?.lockPosition || quoteData.windowSpecs?.[0]?.specifications?.lockPosition || 'right',
          
          // Grille & Aesthetic Features (COMPLETE RESTORATION)
          grilles: effectiveConfig?.windowSpecs?.grilles || quoteData.windowSpecs?.[0]?.specifications?.grille?.style || quoteData.windowSpecs?.grilles || 'none',
          grillePattern: effectiveConfig?.windowSpecs?.grillePattern || quoteData.windowSpecs?.[0]?.specifications?.grille?.pattern || 'grid',
          grillColor: effectiveConfig?.windowSpecs?.grillColor || quoteData.windowSpecs?.[0]?.specifications?.grillColor || 'white',
          grilleEnabled: effectiveConfig?.windowSpecs?.grilleEnabled || quoteData.windowSpecs?.[0]?.specifications?.grille?.enabled || false,
          
          // Weather & Energy Features (COMPLETE RESTORATION)
          // Support both legacy and current naming
          weatherStripping: effectiveConfig?.windowSpecs?.weatherStripping || effectiveConfig?.windowSpecs?.weatherSealing || quoteData.windowSpecs?.[0]?.specifications?.weatherStripping || quoteData.windowSpecs?.[0]?.specifications?.weatherSealing || 'standard',
          weatherSealing: effectiveConfig?.windowSpecs?.weatherSealing || quoteData.windowSpecs?.[0]?.specifications?.weatherSealing || effectiveConfig?.windowSpecs?.weatherStripping || 'standard',
          insulation: effectiveConfig?.windowSpecs?.insulation || quoteData.windowSpecs?.[0]?.specifications?.insulation || 'standard',
          energyRating: effectiveConfig?.windowSpecs?.energyRating || quoteData.windowSpecs?.[0]?.specifications?.energyRating || 'standard',
          drainage: effectiveConfig?.windowSpecs?.drainage || quoteData.windowSpecs?.[0]?.specifications?.drainage || 'standard',
          
          // Comfort & Additional Options (COMPLETE RESTORATION)
          screenIncluded: effectiveConfig?.windowSpecs?.screenIncluded ?? quoteData.windowSpecs?.[0]?.specifications?.screenIncluded ?? false,
          motorized: effectiveConfig?.windowSpecs?.motorized ?? quoteData.windowSpecs?.[0]?.specifications?.motorized ?? false,
          security: effectiveConfig?.windowSpecs?.security || quoteData.windowSpecs?.[0]?.specifications?.security || 'standard',
          childSafety: effectiveConfig?.windowSpecs?.childSafety ?? quoteData.windowSpecs?.[0]?.specifications?.childSafety ?? false,
          tiltAndTurn: effectiveConfig?.windowSpecs?.tiltAndTurn ?? quoteData.windowSpecs?.[0]?.specifications?.tiltAndTurn ?? false,
          smartHome: effectiveConfig?.windowSpecs?.smartHome ?? quoteData.windowSpecs?.[0]?.specifications?.smartHome ?? false,
          
          // Accessories & Add-ons (COMPLETE RESTORATION)
          blindsIntegrated: effectiveConfig?.windowSpecs?.blindsIntegrated ?? quoteData.windowSpecs?.[0]?.specifications?.blindsIntegrated ?? false,
          blindsIncluded: effectiveConfig?.windowSpecs?.blindsIncluded ?? quoteData.windowSpecs?.[0]?.specifications?.blindsIncluded ?? false, // legacy/alt naming
          curtainRail: effectiveConfig?.windowSpecs?.curtainRail ?? quoteData.windowSpecs?.[0]?.specifications?.curtainRail ?? false,
          ventilation: effectiveConfig?.windowSpecs?.ventilation ?? quoteData.windowSpecs?.[0]?.specifications?.ventilation ?? false,
          trimStyle: effectiveConfig?.windowSpecs?.trimStyle || quoteData.windowSpecs?.[0]?.specifications?.trimStyle || 'standard',
          
          // Calculated values restoration
          calculatedArea: effectiveConfig?.calculatedArea || 0
        },
        slidingConfig: {
          panels: effectiveConfig?.slidingConfig?.panels || quoteData.slidingConfig?.panels || quoteData.windowSpecs?.[0]?.specifications?.panels || quoteData.windowSpecs?.[0]?.specifications?.slidingDetails?.panels || 2,
          tracks: effectiveConfig?.slidingConfig?.tracks || quoteData.slidingConfig?.tracks || quoteData.windowSpecs?.[0]?.specifications?.tracks || quoteData.windowSpecs?.[0]?.specifications?.slidingDetails?.tracks || 2,
          openingType: effectiveConfig?.slidingConfig?.openingType || quoteData.slidingConfig?.openingType || quoteData.windowSpecs?.[0]?.specifications?.slidingDetails?.openingType || 'left-to-right',
          combination: effectiveConfig?.slidingConfig?.combination || quoteData.slidingConfig?.combination || quoteData.windowSpecs?.[0]?.specifications?.slidingDetails?.combination || null
        },
        casementConfig: {
          panels: effectiveConfig?.casementConfig?.panels || quoteData.casementConfig?.panels || quoteData.windowSpecs?.[0]?.specifications?.panels || quoteData.windowSpecs?.[0]?.specifications?.casementDetails?.panels || 2,
          direction: effectiveConfig?.casementConfig?.direction || quoteData.casementConfig?.direction || quoteData.casementConfig?.openingType || quoteData.windowSpecs?.[0]?.specifications?.openingType || quoteData.windowSpecs?.[0]?.specifications?.casementDetails?.direction || 'outward',
          hinge: effectiveConfig?.casementConfig?.hinge || quoteData.casementConfig?.hinge || quoteData.casementConfig?.handlePosition || quoteData.windowSpecs?.[0]?.specifications?.casementDetails?.hinge || 'left'
        },
        bayConfig: {
          angle: effectiveConfig?.bayConfig?.angle || quoteData.bayConfig?.angle || quoteData.windowSpecs?.[0]?.specifications?.bayDetails?.angle || 135,
          sideWindows: effectiveConfig?.bayConfig?.sideWindows || quoteData.bayConfig?.sideWindows || quoteData.bayConfig?.windows || quoteData.windowSpecs?.[0]?.specifications?.bayDetails?.sideWindows || 2,
          centerPanels: effectiveConfig?.bayConfig?.centerPanels || quoteData.bayConfig?.centerPanels || quoteData.windowSpecs?.[0]?.specifications?.bayDetails?.centerPanels || 1,
          combination: effectiveConfig?.bayConfig?.combination || quoteData.bayConfig?.combination || quoteData.windowSpecs?.[0]?.specifications?.bayDetails?.combination || null
        },
        awningConfig: {
          panels: effectiveConfig?.awningConfig?.panels || quoteData.awningConfig?.panels || quoteData.windowSpecs?.[0]?.specifications?.awningDetails?.panels || 1,
          openingAngle: effectiveConfig?.awningConfig?.openingAngle || quoteData.awningConfig?.openingAngle || quoteData.windowSpecs?.[0]?.specifications?.awningDetails?.openingAngle || 45,
          operationType: effectiveConfig?.awningConfig?.operationType || quoteData.awningConfig?.operationType || quoteData.windowSpecs?.[0]?.specifications?.awningDetails?.operationType || 'crank',
          size: effectiveConfig?.awningConfig?.size || quoteData.awningConfig?.size || quoteData.windowSpecs?.[0]?.specifications?.awningDetails?.size || 'standard',
          orientation: effectiveConfig?.awningConfig?.orientation || quoteData.awningConfig?.orientation || quoteData.windowSpecs?.[0]?.specifications?.awningDetails?.orientation || 'horizontal'
        },
        doubleHungConfig: {
          combination: effectiveConfig?.doubleHungConfig?.combination || quoteData.doubleHungConfig?.combination || quoteData.windowSpecs?.[0]?.specifications?.doubleHungDetails?.combination || null
        },
        singleHungConfig: {
          combination: effectiveConfig?.singleHungConfig?.combination || quoteData.singleHungConfig?.combination || quoteData.windowSpecs?.[0]?.specifications?.singleHungDetails?.combination || 'sh-standard'
        },
        pricing: {
          basePrice: effectiveConfig?.pricing?.basePrice || quoteData.pricing?.basePrice || 0,
          unitPrice: effectiveConfig?.pricing?.unitPrice || quoteData.pricing?.unitPrice || quoteData.windowSpecs?.[0]?.pricing?.unitPrice || 0,
          totalPrice: effectiveConfig?.pricing?.totalPrice || quoteData.pricing?.totalPrice || quoteData.pricing?.total || quoteData.windowSpecs?.[0]?.pricing?.totalPrice || 0,
          tax: effectiveConfig?.pricing?.tax || quoteData.pricing?.tax || 0,
          finalTotal: effectiveConfig?.pricing?.finalTotal || quoteData.pricing?.finalTotal || quoteData.pricing?.grandTotal || 0,
          modifications: effectiveConfig?.pricing?.modifications || quoteData.pricing?.modifications || [],
          total: effectiveConfig?.pricing?.total || quoteData.pricing?.total || 0
        },
        notes: quoteData.notes || '',
        projectName: quoteData.projectName || '',
        location: quoteData.location || quoteData.windowSpecs?.[0]?.location || '',
        _id: quoteId // Store the original quote ID for updating
      };

      console.log('=== EDIT MODE DEBUG START ===');
      console.log('Raw quote data received:', quoteData);
      console.log('Raw configuration data:', rawConfig);
      console.log('Effective config computed:', effectiveConfig);
      console.log('Quote data structure analysis:', {
        hasWindowSpecs: !!quoteData.windowSpecs,
        windowSpecsType: Array.isArray(quoteData.windowSpecs) ? 'array' : typeof quoteData.windowSpecs,
        windowSpecsLength: Array.isArray(quoteData.windowSpecs) ? quoteData.windowSpecs.length : 'not array',
        firstWindowSpec: quoteData.windowSpecs?.[0],
        directWindowSpecs: quoteData.windowSpecs,
        hasRawConfig: !!rawConfig,
        quotePricingStructure: quoteData.pricing,
        quoteConfigStructures: {
          sliding: quoteData.slidingConfig,
          casement: quoteData.casementConfig,
          bay: quoteData.bayConfig,
          awning: quoteData.awningConfig,
          doubleHung: quoteData.doubleHungConfig,
          singleHung: quoteData.singleHungConfig
        }
      });
      console.log('Extracted measurements:', {
        width: rawConfig?.windowSpecs?.width || quoteData.windowSpecs?.[0]?.dimensions?.width,
        height: rawConfig?.windowSpecs?.height || quoteData.windowSpecs?.[0]?.dimensions?.height,
        windowSpecsArray: quoteData.windowSpecs,
        rawConfigSpecs: rawConfig?.windowSpecs
      });
      console.log('wallType extraction:', {
        fromEffectiveConfig: effectiveConfig?.windowSpecs?.wallType,
        fromWindowSpecsArray: quoteData.windowSpecs?.[0]?.specifications?.wallType,
        finalValue: effectiveConfig?.windowSpecs?.wallType || quoteData.windowSpecs?.[0]?.specifications?.wallType || 'brick'
      });
      console.log('Setting edit quotation data:', editQuotationData);
      console.log('editQuotationData.windowSpecs.wallType:', editQuotationData.windowSpecs.wallType);
      console.log('=== EDIT MODE DEBUG END ===');
      setQuotationData(editQuotationData);
      saveQuotationData(editQuotationData);
      
      // Show a notification that we're editing a draft
      if (quoteData.status === 'draft') {
        console.log('Editing draft quotation - all data restored');
      }
      
      // Restore UI State from raw configuration data
      if (effectiveConfig?.selectedClient) {
        setSelectedClient(effectiveConfig.selectedClient);
      } else if (quoteData.clientInfo && quoteData.clientInfo.name) {
        setSelectedClient(quoteData.clientInfo);
      }

      // Restore active tab from saved state or determine based on window type
      if (effectiveConfig?.activeTab) {
        setActiveTab(effectiveConfig.activeTab);
      } else if (selectedWindowType) {
        setActiveTab('configuration');
      }
      
      // Restore any additional UI state
      console.log('Restored UI state:', {
        activeTab: effectiveConfig?.activeTab || 'configuration',
        selectedClient: effectiveConfig?.selectedClient || quoteData.clientInfo,
        calculatedArea: effectiveConfig?.calculatedArea,
        savedTimestamp: effectiveConfig?.savedTimestamp,
        version: effectiveConfig?.version
      });

      // *** FIX: Load all windows from the quote data ***
      if (quoteData.windowSpecs && Array.isArray(quoteData.windowSpecs) && quoteData.windowSpecs.length > 0) {
        console.log('Loading all windows from quote data:', quoteData.windowSpecs);
        console.log('Available rawConfigurationData:', rawConfig);
        console.log('Individual window configs in rawConfig:', rawConfig?.windows);
        
        // Convert quote window specs to the format expected by the windows state
        const loadedWindows = quoteData.windowSpecs.map((windowSpec, index) => {
          
          // Try to get window-specific config from rawConfigurationData if available
          const windowRawConfig = rawConfig?.windows?.[index] || null;
          console.log(`=== Loading Window ${index + 1} ===`);
          console.log(`Window ${index + 1} - Raw Config:`, windowRawConfig);
          console.log(`Window ${index + 1} - WindowSpec:`, windowSpec);
          console.log(`Window ${index + 1} - Type:`, windowSpec.type);
          console.log(`Window ${index + 1} - Dimensions:`, windowSpec.dimensions);
          console.log(`Window ${index + 1} - Specifications:`, windowSpec.specifications);
          
          return {
            id: `window-${index + 1}`,
            name: windowSpec.name || `Window ${index + 1}`,
            type: windowSpec.type || quoteData.selectedWindowType || 'sliding',
            selectedWindowType: WINDOW_TYPES.find(type => 
              type.id === (windowSpec.type || quoteData.selectedWindowType)
            ) || WINDOW_TYPES.find(type => type.id === 'sliding'),
          windowSpecs: {
            // Dimensions
            width: windowSpec.dimensions?.width || '',
            height: windowSpec.dimensions?.height || '',
            quantity: windowSpec.pricing?.quantity || 1,
            
            // Installation details
            location: windowSpec.specifications?.location || windowSpec.location || 'ground-floor',
            wallType: windowSpec.specifications?.wallType || 'brick',
            replacement: windowSpec.specifications?.replacement || 'new-opening',
            installationMethod: windowSpec.specifications?.installationMethod || 'standard',
            finishingWork: windowSpec.specifications?.finishingWork || 'basic',
            cleanup: windowSpec.specifications?.cleanup ?? true,
            
            // Frame and appearance
            frame: windowSpec.specifications?.frameMaterial || windowSpec.specifications?.frame || 'aluminum',
            frameColor: windowSpec.specifications?.frameColor || 'white',
            color: windowSpec.specifications?.frameColor || windowSpec.specifications?.color || 'white',
            
            // Glass specifications
            glass: windowSpec.specifications?.glass || 'single',
            glassTint: windowSpec.specifications?.glassTint || 'clear',
            glassPattern: windowSpec.specifications?.glassPattern || 'clear',
            
            // Hardware and operation
            hardware: windowSpec.specifications?.hardware || 'standard',
            opening: windowSpec.specifications?.openingType || windowSpec.specifications?.opening || 'fixed',
            lockPosition: windowSpec.specifications?.lockPosition || 'right',
            
            // Additional features
            grilles: windowSpec.specifications?.grille?.style || windowSpec.specifications?.grilles || 'none',
            grillePattern: windowSpec.specifications?.grille?.pattern || windowSpec.specifications?.grillePattern || 'grid',
            grillColor: windowSpec.specifications?.grillColor || 'white',
            grilleEnabled: windowSpec.specifications?.grille?.enabled || windowSpec.specifications?.grilleEnabled || false,
            
            // Weather and energy
            weatherStripping: windowSpec.specifications?.weatherStripping || windowSpec.specifications?.weatherSealing || 'standard',
            weatherSealing: windowSpec.specifications?.weatherSealing || windowSpec.specifications?.weatherStripping || 'standard',
            insulation: windowSpec.specifications?.insulation || 'standard',
            energyRating: windowSpec.specifications?.energyRating || 'standard',
            drainage: windowSpec.specifications?.drainage || 'standard',
            
            // Comfort and safety
            screenIncluded: windowSpec.specifications?.screenIncluded || false,
            motorized: windowSpec.specifications?.motorized || false,
            security: windowSpec.specifications?.security || 'standard',
            childSafety: windowSpec.specifications?.childSafety || false,
            tiltAndTurn: windowSpec.specifications?.tiltAndTurn || false,
            smartHome: windowSpec.specifications?.smartHome || false,
            
            // Accessories
            blindsIntegrated: windowSpec.specifications?.blindsIntegrated || false,
            blindsIncluded: windowSpec.specifications?.blindsIncluded || false,
            curtainRail: windowSpec.specifications?.curtainRail || false,
            ventilation: windowSpec.specifications?.ventilation || false,
            trimStyle: windowSpec.specifications?.trimStyle || 'standard'
          },
          // *** ENHANCED WINDOW-TYPE SPECIFIC CONFIGURATIONS WITH RAW CONFIG PRIORITY ***
          slidingConfig: {
            panels: windowRawConfig?.slidingConfig?.panels || 
                   windowSpec.specifications?.slidingDetails?.panels || 
                   windowSpec.specifications?.panels || 
                   quoteData.slidingConfig?.panels || 2,
            tracks: windowRawConfig?.slidingConfig?.tracks ||
                   windowSpec.specifications?.slidingDetails?.tracks || 
                   windowSpec.specifications?.tracks || 
                   quoteData.slidingConfig?.tracks || 2,
            combination: windowRawConfig?.slidingConfig?.combination ||
                        windowSpec.specifications?.slidingDetails?.combination || 
                        quoteData.slidingConfig?.combination || null,
            openingType: windowRawConfig?.slidingConfig?.openingType ||
                        windowSpec.specifications?.slidingDetails?.openingType || 
                        quoteData.slidingConfig?.openingType || 'left-to-right',
            // Additional sliding-specific options
            railType: windowRawConfig?.slidingConfig?.railType ||
                     windowSpec.specifications?.slidingDetails?.railType || 'standard',
            rollerType: windowRawConfig?.slidingConfig?.rollerType ||
                       windowSpec.specifications?.slidingDetails?.rollerType || 'standard'
          },
          casementConfig: {
            panels: windowRawConfig?.casementConfig?.panels ||
                   windowSpec.specifications?.casementDetails?.panels ||
                   quoteData.casementConfig?.panels || 2,
            direction: windowRawConfig?.casementConfig?.direction ||
                      windowSpec.specifications?.casementDetails?.direction || 
                      quoteData.casementConfig?.direction || 'outward',
            hinge: windowRawConfig?.casementConfig?.hinge ||
                  windowSpec.specifications?.casementDetails?.hinge || 
                  quoteData.casementConfig?.hinge || 'left',
            combination: windowRawConfig?.casementConfig?.combination ||
                        windowSpec.specifications?.casementDetails?.combination || 
                        quoteData.casementConfig?.combination || null,
            // Additional casement-specific options
            openingAngle: windowRawConfig?.casementConfig?.openingAngle ||
                         windowSpec.specifications?.casementDetails?.openingAngle || 90,
            chainStay: windowRawConfig?.casementConfig?.chainStay ||
                      windowSpec.specifications?.casementDetails?.chainStay || false
          },
          bayConfig: {
            angle: windowRawConfig?.bayConfig?.angle ||
                  windowSpec.specifications?.bayDetails?.angle || 
                  quoteData.bayConfig?.angle || 30,
            combination: windowRawConfig?.bayConfig?.combination ||
                        windowSpec.specifications?.bayDetails?.combination || 
                        quoteData.bayConfig?.combination || null,
            style: windowRawConfig?.bayConfig?.style ||
                  windowSpec.specifications?.bayDetails?.style || 'traditional',
            // Additional bay-specific options
            projection: windowRawConfig?.bayConfig?.projection ||
                       windowSpec.specifications?.bayDetails?.projection || 'standard',
            sideWindows: windowRawConfig?.bayConfig?.sideWindows ||
                        windowSpec.specifications?.bayDetails?.sideWindows || 2,
            sideWindowType: windowRawConfig?.bayConfig?.sideWindowType ||
                           windowSpec.specifications?.bayDetails?.sideWindowType || 'casement'
          },
          awningConfig: {
            panels: windowRawConfig?.awningConfig?.panels ||
                   windowSpec.specifications?.awningDetails?.panels ||
                   quoteData.awningConfig?.panels || 1,
            combination: windowRawConfig?.awningConfig?.combination ||
                        windowSpec.specifications?.awningDetails?.combination || 
                        quoteData.awningConfig?.combination || null,
            size: windowRawConfig?.awningConfig?.size ||
                 windowSpec.specifications?.awningDetails?.size ||
                 quoteData.awningConfig?.size || 'standard',
            orientation: windowRawConfig?.awningConfig?.orientation ||
                        windowSpec.specifications?.awningDetails?.orientation ||
                        quoteData.awningConfig?.orientation || 'horizontal',
            // Additional awning-specific options
            openingAngle: windowRawConfig?.awningConfig?.openingAngle ||
                         windowSpec.specifications?.awningDetails?.openingAngle || 45,
            supportArm: windowRawConfig?.awningConfig?.supportArm ||
                       windowSpec.specifications?.awningDetails?.supportArm || 'standard'
          },
          doubleHungConfig: {
            combination: windowRawConfig?.doubleHungConfig?.combination ||
                        windowSpec.specifications?.doubleHungDetails?.combination || 
                        quoteData.doubleHungConfig?.combination || null,
            // Additional double hung-specific options
            balanceType: windowRawConfig?.doubleHungConfig?.balanceType ||
                        windowSpec.specifications?.doubleHungDetails?.balanceType || 'spiral',
            tiltFeature: windowRawConfig?.doubleHungConfig?.tiltFeature ||
                        windowSpec.specifications?.doubleHungDetails?.tiltFeature || true
          },
          singleHungConfig: {
            combination: windowRawConfig?.singleHungConfig?.combination ||
                        windowSpec.specifications?.singleHungDetails?.combination || 
                        quoteData.singleHungConfig?.combination || 'sh-standard',
            // Additional single hung-specific options
            balanceType: windowRawConfig?.singleHungConfig?.balanceType ||
                        windowSpec.specifications?.singleHungDetails?.balanceType || 'spiral',
            lockType: windowRawConfig?.singleHungConfig?.lockType ||
                     windowSpec.specifications?.singleHungDetails?.lockType || 'cam'
          },
          pricing: {
            basePrice: windowSpec.pricing?.basePrice || 0,
            unitPrice: windowSpec.pricing?.unitPrice || 0,
            totalPrice: windowSpec.pricing?.totalPrice || windowSpec.pricing?.total || 0,
            tax: windowSpec.pricing?.tax || 0,
            finalTotal: windowSpec.pricing?.finalTotal || 0
          }
        };
        });
        
        setWindows(loadedWindows);
        console.log('=== LOADED WINDOWS WITH FULL CONFIGS ===');
        console.log('Number of windows loaded:', loadedWindows.length);
        loadedWindows.forEach((window, index) => {
          console.log(`=== FINAL LOADED Window ${index + 1} ===`);
          console.log(`Window ${index + 1}:`, {
            name: window.name,
            type: window.type,
            selectedWindowType: window.selectedWindowType,
            hasWindowSpecs: !!window.windowSpecs,
            hasSlidingConfig: !!window.slidingConfig,
            hasCasementConfig: !!window.casementConfig,
            hasBayConfig: !!window.bayConfig,
            hasDoubleHungConfig: !!window.doubleHungConfig,
            hasSingleHungConfig: !!window.singleHungConfig,
            windowSpecs: window.windowSpecs,
            slidingConfig: window.slidingConfig,
            casementConfig: window.casementConfig,
            bayConfig: window.bayConfig,
            doubleHungConfig: window.doubleHungConfig,
            singleHungConfig: window.singleHungConfig
          });
        });
        console.log('=== END WINDOW LOADING DEBUG ===');
        
        // Set the current window to the first one
        if (loadedWindows.length > 0) {
          setCurrentWindowIndex(0);
        }
      } else {
        console.log('No windows found in quote data or windowSpecs is not an array');
      }
    }
  }, [location.state]);

  // Clean up invalid quote IDs on component mount
  useEffect(() => {
    cleanupInvalidQuoteIds();
  }, []);

  // Debug: Log quotationData state changes to track wallType and other fields
  useEffect(() => {
    console.log('=== QUOTATION DATA STATE CHANGED ===');
    console.log('quotationData.windowSpecs.wallType:', quotationData.windowSpecs?.wallType);
    console.log('quotationData.windowSpecs.location:', quotationData.windowSpecs?.location);
    console.log('quotationData.windowSpecs.replacement:', quotationData.windowSpecs?.replacement);
    console.log('Full windowSpecs:', quotationData.windowSpecs);
    console.log('=== END STATE CHANGE ===');
  }, [quotationData.windowSpecs?.wallType, quotationData.windowSpecs?.location, quotationData.windowSpecs?.replacement]);

  // Save quotation data to localStorage whenever it changes
  const saveQuotationData = (data) => {
    try {
      localStorage.setItem('quotationData', JSON.stringify(data));
      console.log('Quotation data saved successfully');
    } catch (error) {
      console.error('Error saving quotation data to localStorage:', error);
    }
  };

  // Enhanced setQuotationData that also saves to localStorage
  const updateQuotationData = (updater) => {
    setQuotationData(prevData => {
      const newData = typeof updater === 'function' ? updater(prevData) : updater;
      saveQuotationData(newData);
      return newData;
    });
  };

  // Window Types as shown in the attachment
  const WINDOW_TYPES = [
    {
      id: 'sliding',
      icon: '🪟',
      name: 'Sliding Windows',
      description: 'Horizontal sliding windows with multiple tracks'
    },
    {
      id: 'casement',
      icon: '🚪',
      name: 'Casement Windows',
      description: 'Side-hinged windows that open outward'
    },
    {
      id: 'bay',
      icon: '🏠',
      name: 'Bay Windows',
      description: 'Protruding windows with multiple angles'
    },
    {
      id: 'fixed',
      icon: '🖼️',
      name: 'Fixed Windows',
      description: 'Non-opening windows for light and view'
    },
    {
      id: 'awning',
      icon: '🌬️',
      name: 'Awning Windows',
      description: 'Top-hinged windows that open outward'
    },
    {
      id: 'picture',
      icon: '🖼️',
      name: 'Picture Windows',
      description: 'Large fixed windows for unobstructed views'
    },
    {
      id: 'double-hung',
      icon: '⬆️',
      name: 'Double Hung Windows',
      description: 'Two vertically sliding sashes'
    },
    {
      id: 'single-hung',
      icon: '⬇️',
      name: 'Single Hung Windows',
      description: 'Bottom sash slides up, top is fixed'
    },
    {
      id: 'pivot',
      icon: '🔄',
      name: 'Pivot Windows',
      description: 'Central pivot rotation mechanism'
    }
  ];

  // Frame Material Colors
  const FRAME_MATERIAL_COLORS = {
    'aluminum': '#C0C0C0',      // Silver-gray for aluminum
    'upvc': '#FFFFFF',          // White for uPVC
    'wooden': '#8B4513',        // Saddle brown for wood
    'steel': '#2F4F4F',         // Dark slate gray for steel
    'composite': '#696969'       // Dim gray for composite
  };

  // Function to get frame color based on material
  const getFrameColor = (material) => {
    return FRAME_MATERIAL_COLORS[material] || '#003366'; // Default color if material not found
  };

  // Sliding Window Combinations - Comprehensive Professional Specifications
  const SLIDING_COMBINATIONS = {
    2: [
      // 🪟 2-Panel Sliding Window Combinations
      { id: '2-ss', name: 'S - S → Both panels slide (2-track system)', pattern: ['S', 'S'], description: 'Most common for bedrooms, small openings' },
      { id: '2-fs', name: 'F - S → One fixed, one sliding (1.5-track)', pattern: ['F', 'S'], description: 'Cost-effective option' },
      { id: '2-sf', name: 'S - F → One sliding, one fixed (mirror)', pattern: ['S', 'F'], description: 'Alternative orientation' }
    ],
    3: [
      // 🪟 3-Panel Sliding Window Combinations
      { id: '3-fsf', name: 'F - S - F → Center panel slides between fixed', pattern: ['F', 'S', 'F'], description: 'Good for medium openings — flexible airflow' },
      { id: '3-sfs', name: 'S - F - S → Two sliding ends, fixed center', pattern: ['S', 'F', 'S'], description: 'Balanced ventilation from both sides' },
      { id: '3-ssf', name: 'S - S - F → Two slide one way, one fixed', pattern: ['S', 'S', 'F'], description: 'Progressive opening configuration' },
      { id: '3-fss', name: 'F - S - S → One fixed, two slide opposite', pattern: ['F', 'S', 'S'], description: 'Wide opening capability' }
    ],
    4: [
      // 🪟 4-Panel Sliding Window Combinations
      { id: '4-fssf', name: 'F - S - S - F → Center-opening (sliders meet middle)', pattern: ['F', 'S', 'S', 'F'], description: 'Popular for balconies and living rooms' },
      { id: '4-sffs', name: 'S - F - F - S → Two sliders on sides, middle fixed', pattern: ['S', 'F', 'F', 'S'], description: 'Side ventilation with central fixed view' },
      { id: '4-ssss', name: 'S - S - S - S → All sliding (4-track system)', pattern: ['S', 'S', 'S', 'S'], description: 'Maximum opening flexibility' },
      { id: '4-ffss', name: 'F - F - S - S → Two fixed + two sliders (one side)', pattern: ['F', 'F', 'S', 'S'], description: 'Open from one side only' },
      { id: '4-ssff', name: 'S - S - F - F → Mirror of above', pattern: ['S', 'S', 'F', 'F'], description: 'Alternative side opening' }
    ],
    5: [
      // 🪟 5-Panel Sliding Window Combinations
      { id: '5-fsfsf', name: 'F - S - F - S - F → Alternate fixed and sliding', pattern: ['F', 'S', 'F', 'S', 'F'], description: 'Used for large spans and balanced aesthetics' },
      { id: '5-sfsfs', name: 'S - F - S - F - S → Alternate starting with sliding', pattern: ['S', 'F', 'S', 'F', 'S'], description: 'Reverse alternate pattern' },
      { id: '5-fsssf', name: 'F - S - S - S - F → Center 3 slide, sides fixed', pattern: ['F', 'S', 'S', 'S', 'F'], description: 'Wide central opening' },
      { id: '5-ssfss', name: 'S - S - F - S - S → Center fixed, 4 sliding', pattern: ['S', 'S', 'F', 'S', 'S'], description: 'Maximum ventilation with central anchor' },
      { id: '5-sssss', name: 'S - S - S - S - S → All sliding (5-track system)', pattern: ['S', 'S', 'S', 'S', 'S'], description: 'Complete opening capability' }
    ],
    6: [
      // 🪟 6-Panel Sliding Window Combinations
      { id: '6-fsfsfs', name: 'F - S - F - S - F - S → Alternate fixed + sliding', pattern: ['F', 'S', 'F', 'S', 'F', 'S'], description: 'Ideal for full-wall openings or premium facades' },
      { id: '6-sfsfsf', name: 'S - F - S - F - S - F → Reverse alternate', pattern: ['S', 'F', 'S', 'F', 'S', 'F'], description: 'Alternative aesthetic pattern' },
      { id: '6-fssssf', name: 'F - S - S - S - S - F → Center-opening wide sliders', pattern: ['F', 'S', 'S', 'S', 'S', 'F'], description: 'Maximum central opening' },
      { id: '6-ffssss', name: 'F - F - S - S - S - S → Two fixed sides, four slide', pattern: ['F', 'F', 'S', 'S', 'S', 'S'], description: 'Progressive opening from one side' },
      { id: '6-ssssss', name: 'S - S - S - S - S - S → All sliding (6-track system)', pattern: ['S', 'S', 'S', 'S', 'S', 'S'], description: 'Ultimate flexibility and opening' }
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

  // Single Hung Window Combinations
  const SINGLE_HUNG_COMBINATIONS = [
    { id: 'sh-standard', name: 'Standard Single Hung (Top Fixed, Bottom Movable)', pattern: ['Fixed', 'Movable'], description: 'Classic single hung with top sash fixed and bottom sash sliding up' },
    { id: 'sh-reverse', name: 'Reverse Single Hung (Top Movable, Bottom Fixed)', pattern: ['Movable', 'Fixed'], description: 'Uncommon variation with top sash movable and bottom sash fixed' },
    { id: 'sh-tilt-in', name: 'Tilt-In Single Hung', pattern: ['Fixed', 'Tilt-In'], description: 'Bottom sash tilts inward for easy cleaning, top sash fixed' },
    { id: 'sh-awning-bottom', name: 'Single Hung with Awning Bottom', pattern: ['Fixed', 'Awning'], description: 'Top sash fixed, bottom sash opens outward like awning' },
    { id: 'sh-hopper-bottom', name: 'Single Hung with Hopper Bottom', pattern: ['Fixed', 'Hopper'], description: 'Top sash fixed, bottom sash opens inward from top' }
  ];

  useEffect(() => {
    loadClients();
    loadInventoryItems();
  }, []);

  useEffect(() => {
    // Initialize quotation number when component mounts and context is ready
    if (!quotationData.quotationNumber && getNextQuotationNumber && companyInfo) {
      try {
        const nextNumber = getNextQuotationNumber();
        updateQuotationData(prev => ({
          ...prev,
          quotationNumber: nextNumber
        }));
      } catch (error) {
        console.error('Error generating quotation number:', error);
        // Fallback to simple number if there's an error
        updateQuotationData(prev => ({
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

  const loadInventoryItems = async () => {
    try {
      const items = await InventoryService.getAllItems();
      console.log('Loaded inventory items:', items.length, 'items');
      const hardwareItems = items.filter(item => item.categoryType === 'hardware');
      console.log('Hardware items:', hardwareItems);
      hardwareItems.forEach(item => {
        console.log(`Hardware item: ${item.name}, specifications:`, item.specifications);
      });
      setInventoryItems(items);
    } catch (error) {
      console.error('Error loading inventory items:', error);
    }
  };

  // Function to map quotation specifications to inventory items
  const getInventoryItemForMaterial = (materialType, materialValue) => {
    return inventoryItems.find(item => {
      switch (materialType) {
        case 'frame':
          return item.categoryType === 'frame_material' && 
                 item.specifications?.frameMaterial === materialValue;
        case 'glass':
          return item.categoryType === 'glass_type' && 
                 item.specifications?.glassType === materialValue;
        case 'hardware':
          return item.categoryType === 'hardware' && 
                 item.specifications?.hardwareType === materialValue;
        default:
          return false;
      }
    });
  };

  const handleClientSelect = (clientId) => {
    const client = clients.find(c => c._id === clientId);
    if (client) {
      setSelectedClient(client);
      updateQuotationData(prev => ({
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
    updateCurrentWindow(prev => ({
      ...prev,
      selectedWindowType: windowType
    }));
  };

  const handleSpecChange = (field, value) => {
    updateCurrentWindow(prev => {
      const newSpecs = { ...prev.windowSpecs, [field]: value };
      return { ...prev, windowSpecs: newSpecs };
    });
  };

  // Helper function to show confirmation dialog
  const showConfirmation = (title, message, onConfirm, type = 'warning', confirmText = 'OK', cancelText = 'Cancel') => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        onConfirm();
      },
      type,
      confirmText,
      cancelText
    });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };

  // Helper function to show notification toast
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  // Window Management Functions
  const createDefaultWindow = () => {
    return {
      id: Date.now() + Math.random(), // Unique ID
      name: `Window ${windows.length + 1}`,
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
      slidingConfig: {
        panels: 2,
        combination: null
      },
      bayConfig: {
        combination: null,
        angle: 30
      },
      doubleHungConfig: {
        combination: null
      },
      singleHungConfig: {
        combination: 'sh-standard'
      },
      casementConfig: {
        direction: 'outward',
        hinge: 'left'
      },
      pricing: {
        unitPrice: 0,
        totalPrice: 0,
        tax: 0,
        finalTotal: 0
      }
    };
  };

  const addNewWindow = () => {
    const newWindow = createDefaultWindow();
    newWindow.name = `Window ${getNextWindowNumber()}`;
    setWindows(prev => [...prev, newWindow]);
    setCurrentWindowIndex(windows.length); // Switch to the new window
    showNotification(`New window added: ${newWindow.name}`, 'success');
  };

  const removeWindow = (windowIndex) => {
    if (windows.length <= 1) {
      showNotification('Cannot remove the last window', 'warning');
      return;
    }
    
    showConfirmation(
      'Remove Window',
      `Are you sure you want to remove "${windows[windowIndex]?.name || `Window ${windowIndex + 1}`}"?`,
      () => {
        setWindows(prev => prev.filter((_, index) => index !== windowIndex));
        // Adjust current window index if needed
        if (currentWindowIndex >= windowIndex && currentWindowIndex > 0) {
          setCurrentWindowIndex(prev => prev - 1);
        }
        showNotification('Window removed successfully', 'success');
      },
      'warning',
      'Remove',
      'Cancel'
    );
  };

  const duplicateWindow = (windowIndex) => {
    const windowToDuplicate = windows[windowIndex];
    const duplicatedWindow = {
      ...windowToDuplicate,
      id: Date.now() + Math.random(),
      name: `${windowToDuplicate.name} (Copy)`
    };
    setWindows(prev => [...prev, duplicatedWindow]);
    setCurrentWindowIndex(windows.length); // Switch to the duplicated window
    showNotification('Window duplicated successfully', 'success');
  };

  const updateWindowName = (windowIndex, newName) => {
    setWindows(prev => 
      prev.map((window, index) => 
        index === windowIndex ? { ...window, name: newName } : window
      )
    );
  };

  const getNextWindowNumber = () => {
    return windows.reduce((max, window) => {
      const match = window.name.match(/Window (\d+)/);
      if (match) {
        const number = parseInt(match[1], 10);
        return number > max ? number : max;
      }
      return max;
    }, 0) + 1;
  };

  const deleteAllWindows = () => {
    showConfirmation(
      'Delete All Windows',
      'Are you sure you want to delete all windows? This will create one new blank window.',
      () => {
        // Create new window starting from Window 1 (reset numbering)
        const newBlankWindow = createDefaultWindow();
        newBlankWindow.name = 'Window 1';
        
        setWindows([newBlankWindow]);
        setCurrentWindowIndex(0);
        showNotification(`All windows deleted. New blank window created: ${newBlankWindow.name}`, 'success');
      },
      'warning',
      'Delete All',
      'Cancel'
    );
  };

  const getCurrentWindow = () => {
    return windows[currentWindowIndex] || createDefaultWindow();
  };

  const updateCurrentWindow = (updater) => {
    setWindows(prev => 
      prev.map((window, index) => 
        index === currentWindowIndex ? updater(window) : window
      )
    );
  };

  // Initialize windows if empty (but not in edit mode)
  useEffect(() => {
    const { editMode } = location.state || {};
    if (windows.length === 0 && !editMode) {
      const defaultWindow = createDefaultWindow();
      // If there's existing quotation data, apply it to the first window
      if (quotationData.selectedWindowType) {
        defaultWindow.selectedWindowType = quotationData.selectedWindowType;
        defaultWindow.windowSpecs = { ...defaultWindow.windowSpecs, ...quotationData.windowSpecs };
        defaultWindow.slidingConfig = { ...defaultWindow.slidingConfig, ...quotationData.slidingConfig };
        defaultWindow.bayConfig = { ...defaultWindow.bayConfig, ...quotationData.bayConfig };
        defaultWindow.doubleHungConfig = { ...defaultWindow.doubleHungConfig, ...quotationData.doubleHungConfig };
        defaultWindow.singleHungConfig = { ...defaultWindow.singleHungConfig, ...quotationData.singleHungConfig };
        defaultWindow.casementConfig = { ...defaultWindow.casementConfig, ...quotationData.casementConfig };
      }
      setWindows([defaultWindow]);
    }
  }, [location.state]);

  // Sync current window data with quotationData for backwards compatibility
  useEffect(() => {
    const currentWindow = getCurrentWindow();
    if (currentWindow && Object.keys(currentWindow).length > 1) {
      setQuotationData(prev => ({
        ...prev,
        selectedWindowType: currentWindow.selectedWindowType,
        windowSpecs: currentWindow.windowSpecs,
        slidingConfig: currentWindow.slidingConfig,
        bayConfig: currentWindow.bayConfig,
        awningConfig: currentWindow.awningConfig,
        doubleHungConfig: currentWindow.doubleHungConfig,
        singleHungConfig: currentWindow.singleHungConfig,
        casementConfig: currentWindow.casementConfig
      }));
    }
  }, [currentWindowIndex, windows]);

  // Universal save function that can save as draft or final
  const handleSaveQuotation = async (status) => {
    try {
      // Guard against React passing the click event as the first argument
      let saveStatus = status;
      if (saveStatus && typeof saveStatus === 'object' && (saveStatus.nativeEvent || saveStatus.target)) {
        saveStatus = undefined;
      }
      // Normalize to allowed statuses (draft, submitted, approved, rejected, archived)
      const allowedStatuses = ['draft', 'submitted', 'approved', 'rejected', 'archived'];
      if (!saveStatus || !allowedStatuses.includes(saveStatus)) {
        // If editing, preserve existing valid status, otherwise default to 'draft'
        const current = quotationData?.status;
        saveStatus = allowedStatuses.includes(current) ? current : 'draft';
      }
      
      // Validate form for non-draft saves
      if (saveStatus !== 'draft') {
        const errors = validateQuotationForm(quotationData);
        if (hasValidationErrors(errors)) {
          setValidationErrors(errors);
          scrollToFirstError();
          showNotification('Please fix the validation errors before saving the quotation.', 'error');
          return;
        }
        setValidationErrors({});
      }
      
      // Minimal validation for drafts, full validation for final saves
      if (saveStatus !== 'draft') {
        if (!quotationData.clientInfo.name) {
          showNotification('Please fill in client name before saving quotation', 'error');
          return;
        }

        if (!quotationData.windowSpecs?.width || !quotationData.windowSpecs?.height) {
          showNotification('Please fill in window specifications (width and height) before saving', 'error');
          return;
        }
      }

      // Only consume stock for final saves, not drafts
      if (saveStatus !== 'draft') {
        await consumeStockForQuotation();
      }
      
      // Save quotation to localStorage (keeping existing functionality)
      const quotations = JSON.parse(localStorage.getItem('quotations') || '[]');
  const isEditMode = quotationData._id;
      
      if (isEditMode) {
        // Update existing quotation in localStorage
        const index = quotations.findIndex(q => q.id === quotationData.quotationNumber);
        if (index >= 0) {
          quotations[index] = {
            ...quotationData,
            id: quotationData.quotationNumber,
            updatedAt: new Date().toISOString(),
            status: saveStatus
          };
        }
      } else {
        // Add new quotation to localStorage
        const newQuotation = {
          ...quotationData,
          id: quotationData.quotationNumber,
          createdAt: new Date().toISOString(),
          status: saveStatus
        };
        quotations.push(newQuotation);
      }
      localStorage.setItem('quotations', JSON.stringify(quotations));

      // Transform data for Quote History database
      const quoteData = transformQuotationToQuoteFormat(quotationData, windows);
      quoteData.status = saveStatus; // Set the appropriate status
      
      // Save to Quote History database
      try {
        let savedQuote;
        if (isEditMode) {
          console.log('Attempting to update existing quote as', status, ':', quotationData._id);
          try {
            savedQuote = await QuoteService.updateQuote(quotationData._id, quoteData);
          } catch (updateError) {
            console.warn('Quote update failed, creating new quote instead:', updateError.message);
            // If update fails (quote not found), create a new one
            savedQuote = await QuoteService.saveQuotation(quoteData);
            console.log('New quote created after update failure:', savedQuote);
          }
        } else {
          console.log('Saving new quote as', status);
          savedQuote = await QuoteService.saveQuotation(quoteData);
        }
        console.log('Quote saved:', savedQuote);
        
        // Check if backend was available
        const backendAvailable = await QuoteService.isBackendAvailable();
        const statusText = saveStatus === 'draft' ? 'draft' : saveStatus;
        if (backendAvailable) {
          showNotification(`${statusText.charAt(0).toUpperCase() + statusText.slice(1)} saved successfully to both local storage and Quote History database!`, 'success');
        } else {
          showNotification(`${statusText.charAt(0).toUpperCase() + statusText.slice(1)} saved to local storage. Backend server is not available.`, 'warning');
        }
      } catch (dbError) {
        console.error('Database save error:', dbError);
        showNotification('Quotation saved to local storage, but failed to save to Quote History database. Please check if the backend server is running.', 'error');
      }

    } catch (error) {
      console.error('Error saving quotation:', error);
      showNotification(`Error saving quotation: ${error.message}`, 'error');
    }
  };

  // Save as Draft function
  const handleSaveDraft = async () => {
    try {
      await handleSaveQuotation('draft');
    } catch (error) {
      console.error('Error saving draft:', error);
      showNotification('Failed to save draft. Please try again.', 'error');
    }
  };

  // Transform QuotationPageADS data to Quote History format
  const transformQuotationToQuoteFormat = (quotationData, windowsArray = []) => {
    // Use windows array if available, otherwise fallback to single window from quotationData
    const activeWindows = windowsArray.length > 0 ? windowsArray : [quotationData];
    
    // Calculate pricing totals for all windows
    let totalUnitPrice = 0;
    let totalQuantity = 0;
    
    const windowSpecs = activeWindows.map((window, index) => {
      const unitPrice = window.pricing?.unitPrice || 0;
      const quantity = parseInt(window.windowSpecs?.quantity) || 1;
      totalUnitPrice += unitPrice;
      totalQuantity += quantity;
      
      // Extract window type as string (handle both object and string formats)
      const windowTypeString = typeof window.selectedWindowType === 'object' 
        ? window.selectedWindowType?.id || 'sliding'
        : window.selectedWindowType || 'sliding';

      return {
        id: `W${index + 1}`,
        name: window.name || `Window ${index + 1}`,
        location: window.windowSpecs?.location || 'Not specified',
        type: windowTypeString,
        
        dimensions: {
          width: parseInt(window.windowSpecs?.width) || 0,
          height: parseInt(window.windowSpecs?.height) || 0
        },
        
        specifications: {
          // COMPREHENSIVE Glass specifications
          glass: window.windowSpecs?.glass || 'single',
          glassType: window.windowSpecs?.glass || 'single',
          glassTint: window.windowSpecs?.glassTint || 'clear',
          glassPattern: window.windowSpecs?.glassPattern || 'clear',
          glassThickness: window.windowSpecs?.glass === 'double' ? 10 : 5,
          
          // COMPREHENSIVE Frame specifications
          frame: {
            material: window.windowSpecs?.frame || 'aluminum',
            color: window.windowSpecs?.frameColor || window.windowSpecs?.color || 'white'
          },
          frameMaterial: window.windowSpecs?.frame || 'aluminum',
          frameColor: window.windowSpecs?.frameColor || window.windowSpecs?.color || 'white',
          
          // Installation Details
          location: window.windowSpecs?.location || 'ground-floor',
          wallType: window.windowSpecs?.wallType || 'brick',
          replacement: window.windowSpecs?.replacement || 'new-opening',
          installationMethod: window.windowSpecs?.installationMethod || 'standard',
          finishingWork: window.windowSpecs?.finishingWork || 'basic',
          cleanup: window.windowSpecs?.cleanup || true,
          
          // Hardware and operation
          lockPosition: window.windowSpecs?.lockPosition || 'right',
          openingType: window.windowSpecs?.opening || 'fixed',
          hardware: window.windowSpecs?.hardware || 'standard',
          
          // Configuration details - USE WINDOW-SPECIFIC CONFIGS NOT GLOBAL
          panels: window.slidingConfig?.panels || window.casementConfig?.panels || window.awningConfig?.panels || 2,
          tracks: window.slidingConfig?.tracks || 2,
          
          // Weather & Energy Features - USE WINDOW-SPECIFIC SPECS
          weatherSealing: window.windowSpecs?.weatherSealing || window.windowSpecs?.weatherStripping || 'standard',
          weatherStripping: window.windowSpecs?.weatherStripping || window.windowSpecs?.weatherSealing || 'standard',
          insulation: window.windowSpecs?.insulation || 'standard',
          energyRating: window.windowSpecs?.energyRating || 'standard',
          drainage: window.windowSpecs?.drainage || 'standard',
          
          // Comfort & Safety Features - USE WINDOW-SPECIFIC SPECS
          screenIncluded: window.windowSpecs?.screenIncluded || false,
          motorized: window.windowSpecs?.motorized || false,
          security: window.windowSpecs?.security || 'standard',
          childSafety: window.windowSpecs?.childSafety || false,
          tiltAndTurn: window.windowSpecs?.tiltAndTurn || false,
          smartHome: window.windowSpecs?.smartHome || false,
          
          // Accessories & Add-ons - USE WINDOW-SPECIFIC SPECS
          blindsIntegrated: window.windowSpecs?.blindsIntegrated || false,
          blindsIncluded: window.windowSpecs?.blindsIncluded || false,
          curtainRail: window.windowSpecs?.curtainRail || false,
          ventilation: window.windowSpecs?.ventilation || false,
          trimStyle: window.windowSpecs?.trimStyle || 'standard',
          
          // COMPREHENSIVE Grille specifications - USE WINDOW-SPECIFIC SPECS
          grille: {
            enabled: window.windowSpecs?.grilles !== 'none',
            style: window.windowSpecs?.grilles || 'none',
            pattern: window.windowSpecs?.grillePattern || 'grid'
          },
          grillColor: window.windowSpecs?.grillColor || 'white',
          
          // Configuration details
          slidingDetails: window.slidingConfig || {},
          casementDetails: window.casementConfig || {},
          bayDetails: window.bayConfig || {},
          awningDetails: window.awningConfig || {},
          doubleHungDetails: window.doubleHungConfig || {},
          singleHungDetails: window.singleHungConfig || {}
        },
        
        pricing: {
          sqFtPrice: 450,
          quantity: quantity,
          unitPrice: unitPrice,
          totalPrice: unitPrice * quantity
        }
      };
    });
    
    // Calculate totals for all windows
    const subtotal = totalUnitPrice;
    const taxRate = 0.18; // 18% GST
    const tax = subtotal * taxRate;
    const discount = 0; // Can be added later if needed
    const grandTotal = subtotal + tax - discount;

    const transformedData = {
      quotationNumber: quotationData.quotationNumber || `QT-${Date.now()}`,
      date: new Date(),
      validUntil: new Date(quotationData.validUntil || Date.now() + 30 * 24 * 60 * 60 * 1000),
      
      clientInfo: {
        name: quotationData.clientInfo?.name || '',
        email: quotationData.clientInfo?.email || '',
        phone: quotationData.clientInfo?.phone || '',
        address: `${quotationData.clientInfo?.address || ''}, ${quotationData.clientInfo?.city || ''}`.trim().replace(/^,\s*/, ''),
        city: quotationData.clientInfo?.city || ''
      },
      
      companyDetails: {
        name: companyInfo?.name || 'ADS SYSTEMS',
        phone: companyInfo?.phone || '9574544012',
        email: companyInfo?.email || 'support@adssystem.co.in',
        website: companyInfo?.website || 'adssystem.co.in',
        gstin: companyInfo?.gstin || '24APJPP8011N1ZK'
      },
      
      windowSpecs: windowSpecs,
      
      selectedWindowType: activeWindows[0]?.selectedWindowType?.id || 'sliding',
      
      // Complete Sliding Configuration
      slidingConfig: {
        panels: quotationData.slidingConfig?.panels || 2,
        combination: quotationData.slidingConfig?.combination || null
      },
      
      // Complete Bay Configuration  
      bayConfig: {
        windows: parseInt(quotationData.bayConfig?.windows || quotationData.bayConfig?.sideWindows || 3),
        angle: quotationData.bayConfig?.angle || 135,
        fixedSides: quotationData.bayConfig?.fixedSides || false
      },
      
      // Complete Casement Configuration
      casementConfig: {
        panels: quotationData.casementConfig?.panels || 2,
        openingType: quotationData.casementConfig?.direction || quotationData.casementConfig?.openingType || 'outward'
      },
      
      // Complete Awning Configuration
      awningConfig: {
        size: quotationData.awningConfig?.size || 'standard',
        orientation: quotationData.awningConfig?.orientation || 'horizontal'
      },
      
      // Complete Double Hung Configuration
      doubleHungConfig: {
        combination: quotationData.doubleHungConfig?.combination || null
      },
      
      // Complete Single Hung Configuration  
      singleHungConfig: {
        combination: quotationData.singleHungConfig?.combination || 'sh-standard'
      },
      
      pricing: {
        subtotal: subtotal,
        tax: tax,
        discount: discount,
        total: grandTotal,
        currency: 'INR'
      },
      
      // Project Information
      projectName: quotationData.projectName || 'Window Project',
      location: quotationData.location || quotationData.windowSpecs?.location || 'Custom Location',
      notes: quotationData.notes || `Project: ${quotationData.projectName || 'Window Project'}`,
      
      // System Information  
      createdBy: 'System User',
      lastModifiedBy: 'System User',
      
      // Complete Raw Configuration Backup (for perfect restoration)
      rawConfigurationData: {
        // Core Configuration Data
        selectedWindowType: quotationData.selectedWindowType,
        slidingConfig: quotationData.slidingConfig,
        casementConfig: quotationData.casementConfig,
        bayConfig: quotationData.bayConfig,
        awningConfig: quotationData.awningConfig,
        // Note: doubleHungConfig and singleHungConfig not supported in backend schema
        doubleHungConfig: quotationData.doubleHungConfig,
        singleHungConfig: quotationData.singleHungConfig,
        
        // *** INDIVIDUAL WINDOW CONFIGURATIONS FOR MULTI-WINDOW SUPPORT ***
        windows: activeWindows.map((window, index) => ({
          id: window.id || `window-${index + 1}`,
          name: window.name || `Window ${index + 1}`,
          selectedWindowType: window.selectedWindowType,
          windowSpecs: window.windowSpecs,
          slidingConfig: window.slidingConfig,
          casementConfig: window.casementConfig,
          bayConfig: window.bayConfig,
          awningConfig: window.awningConfig,
          doubleHungConfig: window.doubleHungConfig,
          singleHungConfig: window.singleHungConfig,
          pricing: window.pricing
        })),
        
        // COMPREHENSIVE Window Specifications (ALL FIELDS)
        windowSpecs: {
          // Dimensions & Basic Info
          width: quotationData.windowSpecs?.width || '',
          height: quotationData.windowSpecs?.height || '',
          quantity: quotationData.windowSpecs?.quantity || 1,
          
          // Installation Details
          location: quotationData.windowSpecs?.location || 'ground-floor',
          wallType: quotationData.windowSpecs?.wallType || 'brick',
          replacement: quotationData.windowSpecs?.replacement || 'new-opening',
          
          // Frame Material & Color
          frame: quotationData.windowSpecs?.frame || 'aluminum',
          frameColor: quotationData.windowSpecs?.frameColor || 'white',
          color: quotationData.windowSpecs?.color || 'white', // Legacy support
          
          // Glass Specifications
          glass: quotationData.windowSpecs?.glass || 'single',
          glassTint: quotationData.windowSpecs?.glassTint || 'clear',
          glassPattern: quotationData.windowSpecs?.glassPattern || 'clear',
          
          // Hardware & Operation
          hardware: quotationData.windowSpecs?.hardware || 'standard',
          opening: quotationData.windowSpecs?.opening || 'fixed',
          lockPosition: quotationData.windowSpecs?.lockPosition || 'right',
          
          // Grille & Aesthetic Features
          grilles: quotationData.windowSpecs?.grilles || 'none',
          grillePattern: quotationData.windowSpecs?.grillePattern || 'grid',
          grillColor: quotationData.windowSpecs?.grillColor || 'white',
          
          // Weather & Energy Features
          weatherSealing: quotationData.windowSpecs?.weatherSealing || quotationData.windowSpecs?.weatherStripping || 'standard',
          weatherStripping: quotationData.windowSpecs?.weatherStripping || quotationData.windowSpecs?.weatherSealing || 'standard',
          insulation: quotationData.windowSpecs?.insulation || 'standard',
          energyRating: quotationData.windowSpecs?.energyRating || 'standard',
          drainage: quotationData.windowSpecs?.drainage || 'standard',
          
          // Comfort & Additional Options
          screenIncluded: quotationData.windowSpecs?.screenIncluded || false,
          motorized: quotationData.windowSpecs?.motorized || false,
          security: quotationData.windowSpecs?.security || 'standard',
          childSafety: quotationData.windowSpecs?.childSafety || false,
          tiltAndTurn: quotationData.windowSpecs?.tiltAndTurn || false,
          smartHome: quotationData.windowSpecs?.smartHome || false,
          
          // Accessories & Add-ons
          blindsIntegrated: quotationData.windowSpecs?.blindsIntegrated || false,
          blindsIncluded: quotationData.windowSpecs?.blindsIncluded || false,
          curtainRail: quotationData.windowSpecs?.curtainRail || false,
          ventilation: quotationData.windowSpecs?.ventilation || false,
          trimStyle: quotationData.windowSpecs?.trimStyle || 'standard',
          
          // Installation Preferences
          installationMethod: quotationData.windowSpecs?.installationMethod || 'standard',
          finishingWork: quotationData.windowSpecs?.finishingWork || 'basic',
          cleanup: quotationData.windowSpecs?.cleanup || true
        },
        
        // Pricing Information
        pricing: quotationData.pricing,
        
        // Complete Form State Backup
        quotationNumber: quotationData.quotationNumber,
        date: quotationData.date,
        validUntil: quotationData.validUntil,
        clientInfo: quotationData.clientInfo,
        notes: quotationData.notes,
        projectName: quotationData.projectName,
        location: quotationData.location,
        
        // UI State for Perfect Restoration
        activeTab: activeTab,
        selectedClient: selectedClient,
        
        // Calculated Values and Dynamic Fields
        calculatedArea: quotationData.windowSpecs?.width && quotationData.windowSpecs?.height ? 
          (parseFloat(quotationData.windowSpecs?.width) * parseFloat(quotationData.windowSpecs?.height)) : 0,
        
        // Timestamp for version tracking
        savedTimestamp: new Date().toISOString(),
        version: '3.0' // Enhanced version for comprehensive capture
      }
    };

    // Debug: Log the final transformed data
    console.log('Transformed data for backend:', transformedData);
    console.log('Raw configuration data being stored:', transformedData.rawConfigurationData);
    
    return transformedData;
  };

  // Handle submit quotation (save + submit)
  const handleSubmitQuotation = async () => {
    // Prevent multiple submissions
    if (isSubmitting) {
      console.log('Submission already in progress, ignoring duplicate request');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // First validate and save
      if (!quotationData.clientInfo.name) {
        showNotification('Please fill in client name before submitting quotation', 'error');
        return;
      }

      if (!quotationData.windowSpecs?.width || !quotationData.windowSpecs?.height) {
        showNotification('Please fill in window specifications (width and height) before submitting', 'error');
        return;
      }

      // Check if we're in edit mode
      const isEditMode = quotationData._id;
      
      if (!isEditMode) {
        // Consume stock for materials used in the quotation (only for new quotes)
        await consumeStockForQuotation();
      }
      
      // Save quotation to localStorage (keeping existing functionality)
      const quotations = JSON.parse(localStorage.getItem('quotations') || '[]');
      
      if (isEditMode) {
        // Update existing quotation in localStorage
        const index = quotations.findIndex(q => q.id === quotationData.quotationNumber);
        if (index >= 0) {
          quotations[index] = {
            ...quotationData,
            id: quotationData.quotationNumber,
            updatedAt: new Date().toISOString(),
            status: 'submitted' // Change status to submitted when submitting
          };
        }
      } else {
        // Add new quotation to localStorage
        const newQuotation = {
          ...quotationData,
          id: quotationData.quotationNumber,
          createdAt: new Date().toISOString(),
          status: 'submitted'
        };
        quotations.push(newQuotation);
      }
      
      localStorage.setItem('quotations', JSON.stringify(quotations));

      // Transform data for Quote History database
      const quoteData = transformQuotationToQuoteFormat(quotationData, windows);
      quoteData.status = 'submitted'; // Ensure submit sets status to submitted
      
      // Submit to Quote History database (create or update)
      try {
        let submittedQuote;
        if (isEditMode) {
          console.log('Attempting to update existing quote:', quotationData._id);
          try {
            submittedQuote = await QuoteService.updateQuote(quotationData._id, quoteData);
            console.log('Quote updated to submitted:', submittedQuote);
          } catch (updateError) {
            console.warn('Quote update failed, creating new quote instead:', updateError.message);
            // If update fails (quote not found), create a new one
            submittedQuote = await QuoteService.submitQuotation(quoteData, 'System User');
            console.log('New quote created after update failure:', submittedQuote);
          }
        } else {
          console.log('Creating new submitted quote');
          submittedQuote = await QuoteService.submitQuotation(quoteData, 'System User');
          console.log('Quote submitted:', submittedQuote);
        }
        
        // Check if backend was available
        const backendAvailable = await QuoteService.isBackendAvailable();
        if (backendAvailable) {
          const action = isEditMode ? 'updated' : 'created and submitted';
          showNotification(`Quotation ${action} successfully! The quotation is now available in Quote History database.`, 'success');
        } else {
          const action = isEditMode ? 'updated' : 'saved and submitted';
          showNotification(`Quotation ${action} to local storage. Backend server is not available.`, 'warning');
        }
        
      } catch (dbError) {
        console.error('Database submit error:', dbError);
        showNotification('Quotation saved locally, but failed to submit to Quote History database. Please check if the backend server is running.', 'error');
      }

    } catch (error) {
      console.error('Error submitting quotation:', error);
      showNotification(`Error submitting quotation: ${error.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const consumeStockForQuotation = async () => {
    const { windowSpecs } = quotationData;
    const quantity = windowSpecs.quantity || 1;
    
    console.log('Stock consumption requested:', {
      frame: windowSpecs.frame,
      glass: windowSpecs.glass,
      hardware: windowSpecs.hardware,
      quantity: quantity,
      quotationNumber: quotationData.quotationNumber
    });

    // TODO: Temporarily disabled inventory consumption due to backend Activity validation issues
    // This will be re-enabled once the backend is fixed
    
    // Define materials to check and consume stock for
    const materialsToConsume = [
      { type: 'frame', value: windowSpecs.frame },
      { type: 'glass', value: windowSpecs.glass },
      { type: 'hardware', value: windowSpecs.hardware }
    ];

    // Check if we have the inventory items mapped (for logging purposes)
    for (const material of materialsToConsume) {
      if (material.value) {
        const inventoryItem = getInventoryItemForMaterial(material.type, material.value);
        
        if (inventoryItem && inventoryItem !== null) {
          console.log(`✓ Found inventory item for ${material.type}: ${material.value} (Available: ${inventoryItem.stock?.currentQuantity || 0})`);
        } else {
          console.log(`⚠ No inventory item found for ${material.type}: ${material.value}`);
        }
      }
    }

    console.log('Note: Stock consumption is temporarily disabled. Quotation saved without inventory update.');
    
    /* TEMPORARILY DISABLED - TO BE RE-ENABLED AFTER BACKEND FIX
    const stockConsumptionPromises = [];

    for (const material of materialsToConsume) {
      if (material.value) {
        const inventoryItem = getInventoryItemForMaterial(material.type, material.value);
        
        if (inventoryItem && inventoryItem !== null) {
          // Check if we have enough stock
          if (inventoryItem.stock?.currentQuantity < quantity) {
            throw new Error(`Insufficient stock for ${material.type}: ${material.value}. Available: ${inventoryItem.stock?.currentQuantity}, Required: ${quantity}`);
          }

          // Consume stock
          const stockData = {
            quantity: quantity,
            reason: `Consumed for quotation ${quotationData.quotationNumber}`,
            notes: `Window type: ${quotationData.selectedWindowType?.name || 'Unknown'}`
          };

          stockConsumptionPromises.push(
            InventoryService.consumeStock(inventoryItem._id, stockData)
          );
        } else {
          console.warn(`No inventory item found for ${material.type}: ${material.value}`);
        }
      }
    }

    // Execute all stock consumption operations
    if (stockConsumptionPromises.length > 0) {
      await Promise.all(stockConsumptionPromises);
      
      // Refresh inventory items to reflect updated quantities
      await loadInventoryItems();
    }
    */
  };

  const openDescriptionModal = (title, description) => {
    setModalContent({ title, description });
    setShowDescriptionModal(true);
  };

  const closeDescriptionModal = () => {
    setShowDescriptionModal(false);
    setModalContent({ title: '', description: '' });
  };

  const handleNewQuotation = () => {
    showConfirmation(
      'Start New Quotation',
      'Are you sure you want to start a new quotation? Any unsaved changes in the current form will be lost.',
      () => {
        // Reset all form data and generate new quotation number
        setSelectedClient(null);
        const newData = {
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
          slidingConfig: {
            panels: 2,
            combination: null
          },
          bayConfig: {
            combination: null,
            angle: 30,
            style: 'traditional'
          },
          doubleHungConfig: {
            combination: null
          },
          casementConfig: {
            direction: 'outward',
            hinge: 'left'
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
        };
        updateQuotationData(newData);
        // Clear localStorage for the new quotation
        localStorage.removeItem('quotationData');
        setValidationErrors({});
      },
      'warning',
      'Yes, Start New',
      'Cancel'
    );
  };

  // Clear auto-saved data function
  const handleClearAutoSavedData = () => {
    showConfirmation(
      'Clear Auto-saved Data',
      'Are you sure you want to clear all auto-saved data? This action cannot be undone and will remove all locally stored quotation information.',
      () => {
        localStorage.removeItem('quotationData');
        showNotification('Auto-saved data has been cleared successfully!', 'success');
        // Optionally refresh the page to show clean state
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      },
      'danger',
      'Yes, Clear Data',
      'Cancel'
    );
  };

  // Safe number formatting helper function
  const safeNumber = (value, defaultValue = 0) => {
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
  };

  const safeFormat = (value, decimals = 2, defaultValue = 0) => {
    const num = safeNumber(value, defaultValue);
    return num.toFixed(decimals);
  };

  // Format glass type for display
  const formatGlassType = (glassType, glassTint = 'Clear') => {
    const glassTypeMap = {
      'single': 'Single Glazed (4mm)',
      'double': 'Double Glazed (4-12-4mm)',
      'triple': 'Triple Glazed',
      'laminated': 'Laminated Glass',
      'toughened': 'Toughened Glass',
      'low-e': 'Low-E Glass'
    };
    
    const formattedType = glassTypeMap[glassType] || glassType;
    // Capitalize first letter of tint
    const tint = glassTint ? glassTint.charAt(0).toUpperCase() + glassTint.slice(1).toLowerCase() : 'Clear';
    
    return `${formattedType} - ${tint}`;
  };

  // Calculate totals across all windows
  const calculateCombinedTotals = () => {
    let totalComponents = 0;
    let totalArea = 0;
    let basicValue = 0;
    let transportationCost = 0;
    let loadingCost = 0;
    let totalProjectCost = 0;
    let gstAmount = 0;
    let grandTotal = 0;

    // If we have multiple windows, calculate combined totals
    if (windows.length > 0) {
      windows.forEach(window => {
        const windowPrice = safeNumber(window.pricing?.unitPrice, 5000);
        const windowQuantity = safeNumber(window.windowSpecs?.quantity, 1);
        const windowWidth = safeNumber(window.windowSpecs?.width, 1000);
        const windowHeight = safeNumber(window.windowSpecs?.height, 1000);
        const windowTransport = safeNumber(window.pricing?.transportationCost, 1000);
        const windowLoading = safeNumber(window.pricing?.loadingCost, 1000);
        const windowTaxRate = safeNumber(window.pricing?.taxRate, 18);

        // Calculate window area in sq.ft
        const windowArea = (windowWidth * windowHeight * windowQuantity) / 92903;
        
        // Add to totals
        totalComponents += windowQuantity;
        totalArea += windowArea;
        basicValue += (windowPrice * windowQuantity);
        transportationCost += windowTransport;
        loadingCost += windowLoading;
      });
    } else {
      // Single window mode - use quotationData
      const windowPrice = safeNumber(quotationData.pricing?.unitPrice, 5000);
      const windowQuantity = safeNumber(quotationData.windowSpecs?.quantity, 1);
      const windowWidth = safeNumber(quotationData.windowSpecs?.width, 1000);
      const windowHeight = safeNumber(quotationData.windowSpecs?.height, 1000);
      const windowTransport = safeNumber(quotationData.pricing?.transportationCost, 1000);
      const windowLoading = safeNumber(quotationData.pricing?.loadingCost, 1000);

      totalComponents = windowQuantity;
      totalArea = (windowWidth * windowHeight * windowQuantity) / 92903;
      basicValue = (windowPrice * windowQuantity);
      transportationCost = windowTransport;
      loadingCost = windowLoading;
    }

    // Calculate project cost and GST
    totalProjectCost = basicValue + transportationCost + loadingCost;
    const gstRate = safeNumber(quotationData.pricing?.taxRate || getCurrentWindow()?.pricing?.taxRate, 18);
    gstAmount = (totalProjectCost * gstRate) / 100;
    grandTotal = totalProjectCost + gstAmount;

    return {
      totalComponents,
      totalArea,
      basicValue,
      totalProjectCost,
      transportationCost,
      loadingCost,
      gstAmount,
      gstRate,
      grandTotal,
      avgPriceWithoutGST: totalArea > 0 ? basicValue / totalArea : 0,
      avgPriceWithGST: totalArea > 0 ? grandTotal / totalArea : 0
    };
  };

  // Pricing Functions
  const handlePricingChange = (field, value) => {
    // Validate input values
    if (isNaN(value) || value < 0) {
      showNotification(`Please enter a valid positive number for ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`, 'error');
      return;
    }

    // Specific validations for different fields
    if (field === 'taxRate' && value > 100) {
      showNotification('Tax rate cannot exceed 100%', 'error');
      return;
    }

    if (field === 'taxRate' && value < 0) {
      showNotification('Tax rate cannot be negative', 'error');
      return;
    }

    try {
      // Update both quotationData and current window
      const updatedQuotationData = {
        ...quotationData,
        pricing: {
          ...quotationData.pricing,
          [field]: value
        }
      };
      
      updateQuotationData(updatedQuotationData);

      // Also update current window if we're in multi-window mode
      if (windows.length > 0) {
        updateCurrentWindow(prev => ({
          ...prev,
          pricing: {
            ...prev.pricing,
            [field]: value
          }
        }));
      }
    } catch (error) {
      console.error('Error updating pricing:', error);
      showNotification('Error updating pricing. Please check your input values.', 'error');
    }
  };

  const handleQuantityChange = (quantity) => {
    // Validate quantity
    if (isNaN(quantity) || quantity < 1) {
      showNotification('Quantity must be at least 1', 'error');
      return;
    }

    if (quantity > 1000) {
      showNotification('Quantity cannot exceed 1000 units', 'error');
      return;
    }

    try {
      // Update both quotationData and current window
      const updatedQuotationData = {
        ...quotationData,
        windowSpecs: {
          ...quotationData.windowSpecs,
          quantity: quantity
        }
      };
      
      updateQuotationData(updatedQuotationData);

      // Also update current window if we're in multi-window mode
      if (windows.length > 0) {
        updateCurrentWindow(prev => ({
          ...prev,
          windowSpecs: {
            ...prev.windowSpecs,
            quantity: quantity
          }
        }));
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      showNotification('Error updating quantity. Please check your input values.', 'error');
    }
  };

  const autoPopulatePricing = () => {
    const currentWindow = getCurrentWindow();
    const selectedType = quotationData.selectedWindowType || currentWindow?.selectedWindowType;
    
    if (!selectedType) {
      showNotification('Please select a window type first', 'warning');
      return;
    }

    // Base pricing logic based on window specifications
    const windowSpecs = quotationData.windowSpecs || currentWindow?.windowSpecs || {};
    const windowType = selectedType;
    
    // Calculate base price based on area and window type
    const width = windowSpecs.width || 1000; // default width in mm
    const height = windowSpecs.height || 1000; // default height in mm
    const area = (width * height) / 92903; // convert to square feet
    
    // Base price per square foot by window type (in INR)
    const basePricePerSqft = {
      'Awning': 550,
      'Bi-Fold': 850,
      'Casement': 500,
      'Double Hung': 600,
      'Fixed': 400,
      'Louvre': 480,
      'Sliding': 520,
      'Tilt & Turn': 750
    };
    
    const typeBasePrice = basePricePerSqft[windowType.name] || 500;
    const calculatedUnitPrice = typeBasePrice * area;
    
    // Calculate material costs based on frame and glass types
    const frameType = windowSpecs.frameType || 'Aluminium';
    const glassType = windowSpecs.glassType || 'Clear';
    
    const frameCostMultiplier = {
      'Aluminium': 1.0,
      'Timber': 1.3,
      'UPVC': 0.9,
      'Steel': 1.2
    };
    
    const glassCostMultiplier = {
      'Clear': 1.0,
      'Tinted': 1.1,
      'Frosted': 1.1,
      'Laminated': 1.4,
      'Double Glazed': 1.8,
      'Low-E': 2.0
    };
    
    const frameMultiplier = frameCostMultiplier[frameType] || 1.0;
    const glassMultiplier = glassCostMultiplier[glassType] || 1.0;
    
    const adjustedUnitPrice = calculatedUnitPrice * frameMultiplier * glassMultiplier;
    
    // Set default transportation and loading costs
    const defaultTransportationCost = 1000;
    const defaultLoadingCost = 1000;
    
    const updatedPricing = {
      unitPrice: Math.round(adjustedUnitPrice * 100) / 100,
      transportationCost: defaultTransportationCost,
      loadingCost: defaultLoadingCost,
      taxRate: 18 // Default GST rate
    };
    
    // Update both quotationData and current window
    const updatedQuotationData = {
      ...quotationData,
      pricing: {
        ...quotationData.pricing,
        ...updatedPricing
      }
    };
    
    updateQuotationData(updatedQuotationData);
    
    // Also update current window if we're in multi-window mode
    if (windows.length > 0) {
      updateCurrentWindow(prev => ({
        ...prev,
        pricing: {
          ...prev.pricing,
          ...updatedPricing
        }
      }));
    }
    
    showNotification('Pricing auto-populated based on window configuration', 'success');
  };

  const recalculatePricing = () => {
    // Since we're using real-time calculations in the display, just show notification
    showNotification('Pricing totals updated', 'success');
  };

  const generatePDF = async () => {
    // Validate that we have the necessary data
    // Check if we have windows with specifications filled out
    if (!windows || windows.length === 0) {
      showNotification('Please add at least one window to generate PDF', 'error');
      return;
    }

    const validWindows = windows.filter(win => win.windowSpecs?.width && win.windowSpecs?.height);
    if (validWindows.length === 0) {
      showNotification('Please fill in window specifications (width and height) for at least one window to generate PDF', 'error');
      return;
    }

    if (!quotationData.clientInfo || !quotationData.clientInfo.name) {
      showNotification('Please fill in client information before generating PDF', 'error');
      return;
    }

    try {
      // Capture diagrams for each window individually by switching to each window
      const windowDiagrams = {};
      
      // Save current window index
      const originalIndex = currentWindowIndex;
      
      // Capture diagram for each window
      for (let i = 0; i < windows.length; i++) {
        // Switch to window i to capture its diagram
        setCurrentWindowIndex(i);
        
        // Wait a bit for the UI to update
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Capture the diagram for this window
        const diagramElement = document.querySelector('.window-diagram-container');
        
        if (diagramElement) {
          try {
            // Import html2canvas dynamically
            const html2canvas = (await import('html2canvas')).default;
            
            const canvas = await html2canvas(diagramElement, {
              backgroundColor: '#ffffff',
              scale: 4, // Ultra high quality capture
              logging: false,
              useCORS: true,
              allowTaint: false,
              removeContainer: true,
              imageTimeout: 0,
              windowWidth: diagramElement.scrollWidth,
              windowHeight: diagramElement.scrollHeight,
              scrollY: -window.scrollY,
              scrollX: -window.scrollX,
              onclone: (clonedDoc) => {
                // Ensure SVG elements render properly
                const svgElements = clonedDoc.querySelectorAll('svg');
                svgElements.forEach(svg => {
                  svg.style.maxWidth = 'none';
                  svg.style.maxHeight = 'none';
                  svg.style.overflow = 'visible';
                });
                
                const container = clonedDoc.querySelector('.window-diagram-container');
                if (container) {
                  container.style.padding = '10px';
                  container.style.overflow = 'visible';
                }
              }
            });
            
            windowDiagrams[i] = canvas.toDataURL('image/png');
            console.log(`✓ Captured diagram for Window ${i + 1}`);
          } catch (error) {
            console.warn(`Could not capture diagram for Window ${i + 1}:`, error);
            windowDiagrams[i] = null;
          }
        }
      }
      
      // Restore original window selection
      setCurrentWindowIndex(originalIndex);
      
      console.log(`✓ Captured diagrams for ${Object.keys(windowDiagrams).length} windows`);
      
      // Create window configurations from ALL windows (including current + windows array)
      const createWindowConfig = (winData, index, diagramSnapshot) => {
        return {
          id: `W${index + 1}`,
          code: `W${index + 1}`,
          type: winData.selectedWindowType || 'sliding',
          name: `${winData.selectedWindowType || 'Window'} - ${winData.windowSpecs?.location || 'Custom'}`,
          location: winData.windowSpecs?.location || `Location ${index + 1}`,
          dimensions: {
            width: parseInt(winData.windowSpecs?.width) || 1000,
            height: parseInt(winData.windowSpecs?.height) || 1000,
            radius: winData.bayConfig?.angle || 0
          },
          specifications: {
            glass: winData.windowSpecs?.glass || 'single',
            glassType: winData.windowSpecs?.glass || 'single',
            glassTint: winData.windowSpecs?.glassTint || 'clear',
            glassThickness: winData.windowSpecs?.glass === 'double' ? 10 : 5,
            lockPosition: 'right',
            openingType: winData.windowSpecs.opening || 'fixed',
            fixedPanels: [],
            grille: {
              enabled: winData.windowSpecs.grilles !== 'none',
              style: winData.windowSpecs.grilles || 'none',
              pattern: 'grid'
            },
            grilles: winData.windowSpecs.grilles || 'none',
            grillColor: winData.windowSpecs.grillColor || 'white',
            frame: {
              material: winData.windowSpecs.frame || 'aluminum',
              color: winData.windowSpecs.frameColor || winData.windowSpecs.color || 'white',
              customColor: ''
            },
            frameMaterial: winData.windowSpecs.frame || 'aluminum',
            frameColor: winData.windowSpecs.frameColor || winData.windowSpecs.color || 'white',
            hardware: winData.windowSpecs.hardware || 'standard',
            panels: winData.slidingConfig?.panels || 2,
            tracks: 1,
            screenIncluded: winData.windowSpecs.screenIncluded || false,
            motorized: winData.windowSpecs.motorized || false,
            security: winData.windowSpecs.security || 'standard'
          },
          // Store complete configuration for accurate diagram rendering
          slidingConfig: winData.slidingConfig,
          bayConfig: winData.bayConfig,
          casementConfig: winData.casementConfig,
          doubleHungConfig: winData.doubleHungConfig,
          singleHungConfig: winData.singleHungConfig,
          // Include the captured diagram snapshot for this specific window
          diagramSnapshot: diagramSnapshot,
          pricing: {
            basePrice: winData.pricing?.unitPrice || 5000,
            sqFtPrice: 450,
            quantity: parseInt(winData.windowSpecs?.quantity) || 1,
            customPricing: false
          },
          computedValues: {
            sqFtPerWindow: ((winData.windowSpecs?.width * winData.windowSpecs?.height) / 92903) || 0,
            totalPrice: winData.pricing?.totalPrice || 0,
            weight: ((winData.windowSpecs?.width * winData.windowSpecs?.height) / 92903) * 15 || 0
          }
        };
      };

      // Collect ALL windows from the windows array (ONLY source of truth)
      const allWindowConfigs = [];
      
      // Process ONLY the windows array - no fallback to quotationData to prevent duplication
      windows.forEach((win, idx) => {
        const windowConfig = createWindowConfig(win, idx, windowDiagrams[idx]);
        allWindowConfigs.push(windowConfig);
        console.log(`✓ PDF: Added Window ${idx + 1} - Location: ${win.windowSpecs?.location || 'N/A'}, Size: ${win.windowSpecs?.width}x${win.windowSpecs?.height}`);
      });

      console.log(`✓ PDF Generation: Processing ${allWindowConfigs.length} windows from windows array (NO quotationData used)`);

      // Transform QuotationPageADS data to match the PDF generator's expected format
      const pdfData = {
        quotationNumber: quotationData.quotationNumber || 'QT-' + Date.now(),
        project: quotationData.projectName || 'Window Project',
        date: new Date(quotationData.date).toLocaleDateString('en-GB') || new Date().toLocaleDateString('en-GB'),
        companyDetails: {
          name: companyInfo?.name || 'ADS SYSTEMS',
          phone: companyInfo?.phone || '9574544012',
          email: companyInfo?.email || 'support@adssystem.co.in',
          website: companyInfo?.website || 'adssystem.co.in',
          gstin: companyInfo?.gstin || '24APJPP8011N1ZK'
        },
        clientDetails: {
          name: quotationData.clientInfo.name || '',
          address: `${quotationData.clientInfo.address || ''}\n${quotationData.clientInfo.city || ''}\nPhone: ${quotationData.clientInfo.phone || ''}\nEmail: ${quotationData.clientInfo.email || ''}`
        },
        windowSpecs: allWindowConfigs, // ALL windows array
        pricing: {
          // Calculate totals from all windows
          subtotal: allWindowConfigs.reduce((sum, win) => sum + (win.pricing?.basePrice * win.pricing?.quantity || 0), 0),
          transportation: quotationData.pricing?.transportation || 0,
          loading: quotationData.pricing?.loading || 0,
          taxRate: quotationData.pricing?.taxRate || 18,
          tax: 0, // Will be calculated in PDF generator
          grandTotal: 0 // Will be calculated in PDF generator
        }
      };

      // Generate the PDF using PERFECT format generator (no duplication, exact match)
      const result = await generatePerfectQuotationPDF(pdfData);
      
      if (result.success) {
        showNotification(`PDF generated successfully: ${result.fileName}`, 'success');
      } else {
        showNotification(`Error generating PDF: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      showNotification('An error occurred while generating the PDF. Please try again.', 'error');
    }
  };

  // Function to generate key-value format descriptions for window configurations
  const getWindowDescription = (windowType, config, specs) => {
    const frameMaterialLabels = {
      'aluminum': 'Aluminum',
      'upvc': 'uPVC', 
      'wooden': 'Wooden',
      'steel': 'Steel',
      'composite': 'Composite'
    };
    
    const glassTypeLabels = {
      'single': 'Single Glazed',
      'double': 'Double Glazed', 
      'triple': 'Triple Glazed',
      'laminated': 'Laminated',
      'tempered': 'Tempered'
    };
    
    const grillLabels = {
      'none': 'No Grills',
      'colonial': 'Colonial (Traditional Grid)',
      'prairie': 'Prairie (4-Pane Style)',
      'diamond': 'Diamond Pattern',
      'georgian': 'Georgian Bars',
      'custom-grid': 'Custom Grid Pattern',
      'between-glass': 'Between Glass Grills',
      'snap-in': 'Snap-in Removable'
    };
    
    let configDetails = [];
    
    // Only add basic specifications if they have non-default values
    if (windowType && windowType.name) {
      configDetails.push(`Window Type: ${windowType.name}`);
    }
    
    if (specs.frame && specs.frame !== 'aluminum') {
      configDetails.push(`Frame Material: ${frameMaterialLabels[specs.frame]}`);
    }
    
    if (specs.glass && specs.glass !== 'single') {
      configDetails.push(`Glass Type: ${glassTypeLabels[specs.glass]}`);
    }
    
    if (specs.grilles && specs.grilles !== 'none') {
      configDetails.push(`Grill Options: ${grillLabels[specs.grilles]}`);
    }
    
    if (specs.width && specs.height && (specs.width !== '1200' || specs.height !== '1500')) {
      configDetails.push(`Dimensions: ${specs.width}mm × ${specs.height}mm`);
    }
    
    if (specs.quantity && specs.quantity > 1) {
      configDetails.push(`Quantity: ${specs.quantity}`);
    }
    
    // Window-specific configurations
    switch (windowType.id) {
      case 'sliding':
        const panels = config?.panels || 2;
        configDetails.push(`Number of Panels: ${panels}`);
        const combination = config?.combination;
        if (combination && SLIDING_COMBINATIONS[panels]) {
          const selectedCombo = SLIDING_COMBINATIONS[panels].find(combo => combo.id === combination);
          if (selectedCombo) {
            configDetails.push(`Configuration: ${selectedCombo.name}`);
            configDetails.push(`Pattern: ${selectedCombo.pattern.join(' - ')}`);
          }
        }
        break;
        
      case 'bay':
        const angle = config?.angle || 30;
        configDetails.push(`Angle: ${angle}°`);
        const bayCombo = config?.combination;
        if (bayCombo) {
          const bayConfig = BAY_COMBINATIONS.find(c => c.id === bayCombo);
          if (bayConfig) {
            configDetails.push(`Configuration: ${bayConfig.name}`);
            configDetails.push(`Panel Types: ${bayConfig.pattern.join(' - ')}`);
          }
        }
        break;
        
      case 'double-hung':
        const dhCombo = config?.combination;
        if (dhCombo) {
          const dhConfig = DOUBLE_HUNG_COMBINATIONS.find(c => c.id === dhCombo);
          if (dhConfig) {
            configDetails.push(`Configuration: ${dhConfig.name}`);
            configDetails.push(`Top Sash: ${dhConfig.pattern[0]}`);
            configDetails.push(`Bottom Sash: ${dhConfig.pattern[1]}`);
          }
        } else {
          configDetails.push(`Configuration: Standard Double Hung`);
        }
        break;
        
      case 'casement':
        configDetails.push(`Operation: Side-hinged, outward opening`);
        break;
        
      case 'awning':
        configDetails.push(`Operation: Top-hinged, outward opening`);
        break;
        
      case 'picture':
        configDetails.push(`Operation: Fixed (non-opening)`);
        break;
    }
    
    return configDetails.join('\n');
  };

  // Dynamic Window Shape Component - Enhanced with All Configuration Options
  const WindowDiagram = ({ 
    windowType, 
    specs, 
    slidingConfig, 
    bayConfig, 
    doubleHungConfig, 
    singleHungConfig,
    casementConfig,
    onShowDescription 
  }) => {
    if (!windowType) return null;

    // Enhanced frame color mapping with new materials
    const getEnhancedFrameColor = (material, color = 'white') => {
      const materialColors = {
        aluminum: {
          white: '#F5F5F5',
          black: '#2C2C2C',
          brown: '#8B4513',
          grey: '#808080',
          bronze: '#CD7F32',
          'wood-grain': '#D2B48C',
          custom: '#E6E6FA'
        },
        upvc: {
          white: '#FFFFFF',
          black: '#1C1C1C',
          brown: '#8B4513',
          grey: '#A9A9A9',
          bronze: '#CD7F32',
          'wood-grain': '#DEB887',
          custom: '#F0F8FF'
        },
        wooden: {
          white: '#FFF8DC',
          black: '#3C3C3C',
          brown: '#8B4513',
          grey: '#DCDCDC',
          bronze: '#B87333',
          'wood-grain': '#D2B48C',
          custom: '#F5DEB3'
        },
        steel: {
          white: '#F8F8FF',
          black: '#2F2F2F',
          brown: '#A0522D',
          grey: '#708090',
          bronze: '#B87333',
          'wood-grain': '#DDD',
          custom: '#E0E0E0'
        },
        composite: {
          white: '#FFFAF0',
          black: '#2E2E2E',
          brown: '#A0522D',
          grey: '#B0B0B0',
          bronze: '#B87333',
          'wood-grain': '#D2B48C',
          custom: '#F0F0F0'
        },
        fiberglass: {
          white: '#FFFFF0',
          black: '#2B2B2B',
          brown: '#8B4513',
          grey: '#A0A0A0',
          bronze: '#B87333',
          'wood-grain': '#DEB887',
          custom: '#F5F5DC'
        }
      };
      
      return materialColors[material]?.[color] || materialColors[material]?.white || '#F5F5F5';
    };

    // Enhanced glass color mapping with types and tints
    const getGlassColor = (glassType, tint = 'clear') => {
      const glassColors = {
        single: {
          clear: '#E6F3FF',
          bronze: '#F4E4BC',
          grey: '#E6E6E6',
          blue: '#E0F0FF',
          green: '#E6F7E6',
          reflective: '#C0C0C0'
        },
        double: {
          clear: '#E8F4FD',
          bronze: '#F6E6BE',
          grey: '#E8E8E8',
          blue: '#E2F2FF',
          green: '#E8F9E8',
          reflective: '#C2C2C2'
        },
        triple: {
          clear: '#EAF5FE',
          bronze: '#F8E8C0',
          grey: '#EAEAEA',
          blue: '#E4F4FF',
          green: '#EAFBEA',
          reflective: '#C4C4C4'
        },
        'low-e': {
          clear: '#E6F9FF',
          bronze: '#F4EAC2',
          grey: '#E6EAE6',
          blue: '#E0F6FF',
          green: '#E6FDE6',
          reflective: '#C0C6C0'
        },
        laminated: {
          clear: '#E4F1FE',
          bronze: '#F2E2BA',
          grey: '#E4E4E4',
          blue: '#DEF0FE',
          green: '#E4F5E4',
          reflective: '#BEBEBE'
        },
        tempered: {
          clear: '#E2EFFD',
          bronze: '#F0E0B8',
          grey: '#E2E2E2',
          blue: '#DCEEFE',
          green: '#E2F3E2',
          reflective: '#BCBCBC'
        },
        acoustic: {
          clear: '#E0EDFC',
          bronze: '#EEDEB6',
          grey: '#E0E0E0',
          blue: '#DAECFD',
          green: '#E0F1E0',
          reflective: '#BABABA'
        }
      };
      
      return glassColors[glassType]?.[tint] || glassColors[glassType]?.clear || '#E6F3FF';
    };

    // Get hardware color mapping
    const getHardwareColor = (hardware = 'standard') => {
      const hardwareColors = {
        standard: '#FFFFFF',
        'brushed-chrome': '#C0C0C0',
        'polished-chrome': '#E5E5E5',
        'brushed-nickel': '#C4B59A',
        'oil-rubbed-bronze': '#654321',
        black: '#2C2C2C'
      };
      
      return hardwareColors[hardware] || '#FFFFFF';
    };

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
    
    // Ensure minimum dimensions to prevent negative values in calculations
    width = Math.max(width, 100);
    height = Math.max(height, 80);

    // Safe calculation function to prevent negative dimensions
    const safeCalc = (value, minValue = 1) => Math.max(value, minValue);

    // Function to render grills/grids on glass panels with enhanced styling
    const renderGrills = (panelX, panelY, panelWidth, panelHeight, grillType, grillColor = 'white') => {
      if (!grillType || grillType === 'none') return null;
      
      // Get grill color based on selection or default
      const getGrillDisplayColor = (color) => {
        const grillColors = {
          white: "#FFFFFF",
          black: "#2C2C2C",
          bronze: "#CD7F32",
          'match-frame': getEnhancedFrameColor(specs.frame, specs.frameColor),
          custom: "#999999"
        };
        return grillColors[color] || "#666666";
      };
      
      const actualGrillColor = getGrillDisplayColor(grillColor);
      const grillWidth = 1.5;
      
      switch (grillType) {
        case 'colonial':
          // Traditional grid pattern (3x2 or 4x3 depending on size)
          const cols = panelWidth > 80 ? 4 : 3;
          const rows = panelHeight > 120 ? 3 : 2;
          const cellWidth = panelWidth / cols;
          const cellHeight = panelHeight / rows;
          
          return (
            <g>
              {/* Vertical lines */}
              {Array.from({length: cols - 1}, (_, i) => (
                <line 
                  key={`v${i}`}
                  x1={panelX + (i + 1) * cellWidth} 
                  y1={panelY} 
                  x2={panelX + (i + 1) * cellWidth} 
                  y2={panelY + panelHeight} 
                  stroke={actualGrillColor} 
                  strokeWidth={grillWidth}
                />
              ))}
              {/* Horizontal lines */}
              {Array.from({length: rows - 1}, (_, i) => (
                <line 
                  key={`h${i}`}
                  x1={panelX} 
                  y1={panelY + (i + 1) * cellHeight} 
                  x2={panelX + panelWidth} 
                  y2={panelY + (i + 1) * cellHeight} 
                  stroke={actualGrillColor} 
                  strokeWidth={grillWidth}
                />
              ))}
            </g>
          );
          
        case 'prairie':
          // 4-pane style (2x2 grid)
          return (
            <g>
              <line x1={panelX + panelWidth/2} y1={panelY} x2={panelX + panelWidth/2} y2={panelY + panelHeight} stroke={actualGrillColor} strokeWidth={grillWidth}/>
              <line x1={panelX} y1={panelY + panelHeight/2} x2={panelX + panelWidth} y2={panelY + panelHeight/2} stroke={actualGrillColor} strokeWidth={grillWidth}/>
            </g>
          );
          
        case 'diamond':
          // Diamond pattern
          const centerX = panelX + panelWidth/2;
          const centerY = panelY + panelHeight/2;
          return (
            <g>
              <line x1={centerX} y1={panelY} x2={panelX + panelWidth} y2={centerY} stroke={actualGrillColor} strokeWidth={grillWidth}/>
              <line x1={panelX + panelWidth} y1={centerY} x2={centerX} y2={panelY + panelHeight} stroke={actualGrillColor} strokeWidth={grillWidth}/>
              <line x1={centerX} y1={panelY + panelHeight} x2={panelX} y2={centerY} stroke={actualGrillColor} strokeWidth={grillWidth}/>
              <line x1={panelX} y1={centerY} x2={centerX} y2={panelY} stroke={actualGrillColor} strokeWidth={grillWidth}/>
            </g>
          );
          
        case 'georgian':
          // Georgian bars (6-pane style)
          return (
            <g>
              <line x1={panelX + panelWidth/3} y1={panelY} x2={panelX + panelWidth/3} y2={panelY + panelHeight} stroke={actualGrillColor} strokeWidth={grillWidth}/>
              <line x1={panelX + 2*panelWidth/3} y1={panelY} x2={panelX + 2*panelWidth/3} y2={panelY + panelHeight} stroke={actualGrillColor} strokeWidth={grillWidth}/>
              <line x1={panelX} y1={panelY + panelHeight/2} x2={panelX + panelWidth} y2={panelY + panelHeight/2} stroke={actualGrillColor} strokeWidth={grillWidth}/>
            </g>
          );
          
        case 'custom-grid':
          // Simple 3x3 grid
          return (
            <g>
              <line x1={panelX + panelWidth/3} y1={panelY} x2={panelX + panelWidth/3} y2={panelY + panelHeight} stroke={actualGrillColor} strokeWidth={grillWidth}/>
              <line x1={panelX + 2*panelWidth/3} y1={panelY} x2={panelX + 2*panelWidth/3} y2={panelY + panelHeight} stroke={actualGrillColor} strokeWidth={grillWidth}/>
              <line x1={panelX} y1={panelY + panelHeight/3} x2={panelX + panelWidth} y2={panelY + panelHeight/3} stroke={actualGrillColor} strokeWidth={grillWidth}/>
              <line x1={panelX} y1={panelY + 2*panelHeight/3} x2={panelX + panelWidth} y2={panelY + 2*panelHeight/3} stroke={actualGrillColor} strokeWidth={grillWidth}/>
            </g>
          );
          
        case 'decorative':
          // Decorative muntins pattern
          return (
            <g>
              <ellipse cx={panelX + panelWidth/2} cy={panelY + panelHeight/2} rx={panelWidth/4} ry={panelHeight/4} fill="none" stroke={actualGrillColor} strokeWidth={grillWidth}/>
              <line x1={panelX + panelWidth/2} y1={panelY} x2={panelX + panelWidth/2} y2={panelY + panelHeight} stroke={actualGrillColor} strokeWidth={grillWidth}/>
              <line x1={panelX} y1={panelY + panelHeight/2} x2={panelX + panelWidth} y2={panelY + panelHeight/2} stroke={actualGrillColor} strokeWidth={grillWidth}/>
            </g>
          );
          
        case 'between-glass':
        case 'snap-in':
          // Same visual as colonial but with lighter appearance to indicate they're between glass or removable
          const lightGrillColor = actualGrillColor + "80"; // Add transparency
          return (
            <g>
              <line x1={panelX + panelWidth/2} y1={panelY} x2={panelX + panelWidth/2} y2={panelY + panelHeight} stroke={lightGrillColor} strokeWidth={grillWidth} strokeDasharray="3,2"/>
              <line x1={panelX} y1={panelY + panelHeight/2} x2={panelX + panelWidth} y2={panelY + panelHeight/2} stroke={lightGrillColor} strokeWidth={grillWidth} strokeDasharray="3,2"/>
            </g>
          );
          
        default:
          return null;
      }
    };

    const renderSlidingWindow = (config) => {
      const frameThickness = 8;
      const frameColor = getEnhancedFrameColor(specs.frame, specs.frameColor);
      const glassColor = getGlassColor(specs.glass, specs.glassTint);
      const hardwareColor = getHardwareColor(specs.hardware);
      const slidingColor = glassColor; // Use same glass color but with different opacity
      const fixedColor = glassColor;
      
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
          {/* Enhanced outer frame with material texture */}
          <defs>
            <linearGradient id="frameGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={frameColor} stopOpacity="1.2"/>
              <stop offset="50%" stopColor={frameColor} stopOpacity="1"/>
              <stop offset="100%" stopColor={frameColor} stopOpacity="0.8"/>
            </linearGradient>
            
            {/* Glass pattern for different types */}
            <pattern id="glassPattern" patternUnits="userSpaceOnUse" width="20" height="20">
              {specs.glassPattern === 'frosted' && (
                <rect width="20" height="20" fill={glassColor} opacity="0.8"/>
              )}
              {specs.glassPattern === 'etched' && (
                <>
                  <rect width="20" height="20" fill={glassColor}/>
                  <circle cx="10" cy="10" r="3" fill="white" opacity="0.3"/>
                </>
              )}
              {specs.glassPattern === 'textured' && (
                <>
                  <rect width="20" height="20" fill={glassColor}/>
                  <path d="M0,10 Q10,5 20,10 Q10,15 0,10" fill="white" opacity="0.2"/>
                </>
              )}
              {(!specs.glassPattern || specs.glassPattern === 'clear') && (
                <rect width="20" height="20" fill={glassColor}/>
              )}
            </pattern>
          </defs>
          
          <rect x="10" y="10" width={width-20} height={height-20} fill="url(#frameGradient)" stroke={frameColor} strokeWidth="2"/>
          
          {/* Render each panel with enhanced features */}
          {pattern.map((panelType, index) => {
            const panelX = 18 + (index * panelWidth);
            const isSliding = panelType === 'S';
            const panelColor = isSliding ? slidingColor : fixedColor;
            
            return (
              <g key={index}>
                {/* Enhanced glass panel with pattern */}
                <rect 
                  x={panelX + (index > 0 ? 1 : 0)} 
                  y="18" 
                  width={panelWidth - (index > 0 && index < panels - 1 ? 2 : 1)} 
                  height={height-36} 
                  fill="url(#glassPattern)"
                  stroke="#ccc" 
                  strokeWidth="1"
                />
                
                {/* Glass performance indicator */}
                {specs.glass === 'double' && (
                  <rect 
                    x={panelX + (index > 0 ? 1 : 0) + 2} 
                    y="20" 
                    width={panelWidth - (index > 0 && index < panels - 1 ? 2 : 1) - 4} 
                    height={2} 
                    fill="rgba(0,100,255,0.3)"
                  />
                )}
                {specs.glass === 'triple' && (
                  <>
                    <rect x={panelX + (index > 0 ? 1 : 0) + 2} y="20" width={panelWidth - (index > 0 && index < panels - 1 ? 2 : 1) - 4} height={1} fill="rgba(0,100,255,0.3)"/>
                    <rect x={panelX + (index > 0 ? 1 : 0) + 2} y="22" width={panelWidth - (index > 0 && index < panels - 1 ? 2 : 1) - 4} height={1} fill="rgba(0,100,255,0.3)"/>
                  </>
                )}
                
                {/* Enhanced grills with grill color */}
                {renderGrills(
                  panelX + (index > 0 ? 1 : 0) + 2, 
                  20, 
                  panelWidth - (index > 0 && index < panels - 1 ? 2 : 1) - 4, 
                  height-40, 
                  specs.grilles,
                  specs.grillColor
                )}
                
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
                
                {/* Enhanced handle for sliding panels with hardware color */}
                {isSliding && (
                  <>
                    <circle 
                      cx={panelX + panelWidth - 15} 
                      cy={height/2} 
                      r="4" 
                      fill={hardwareColor}
                      stroke="#666"
                      strokeWidth="1"
                    />
                    <circle 
                      cx={panelX + panelWidth - 15} 
                      cy={height/2} 
                      r="2" 
                      fill="#666"
                    />
                  </>
                )}
                
                {/* Panel type label and movement indicator */}
                <text 
                  x={panelX + panelWidth/2} 
                  y={height/2 - 15} 
                  textAnchor="middle" 
                  fontSize="12" 
                  fill={isSliding ? "#e74c3c" : "#95a5a6"} 
                  fontWeight="bold"
                >
                  {panelType}
                </text>
                
                {/* Movement indicator for sliding panels */}
                {isSliding && (
                  <text 
                    x={panelX + panelWidth/2} 
                    y={height/2 + 5} 
                    textAnchor="middle" 
                    fontSize="16" 
                    fill="#e74c3c"
                  >
                    ⬌
                  </text>
                )}
                
                {/* Fixed panel indicator */}
                {!isSliding && (
                  <text 
                    x={panelX + panelWidth/2} 
                    y={height/2 + 5} 
                    textAnchor="middle" 
                    fontSize="14" 
                    fill="#95a5a6"
                  >
                    ▪
                  </text>
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
                
                {/* Feature indicators */}
                {specs.screenIncluded && (
                  <rect 
                    x={panelX + (index > 0 ? 1 : 0) + 1} 
                    y="17" 
                    width={panelWidth - (index > 0 && index < panels - 1 ? 2 : 1) - 2} 
                    height={height-34} 
                    fill="none"
                    stroke="#666"
                    strokeWidth="0.5"
                    strokeDasharray="2,2"
                  />
                )}
                
                {specs.blindsIntegrated && (
                  <g>
                    {Array.from({length: 5}, (_, i) => (
                      <rect 
                        key={i}
                        x={panelX + (index > 0 ? 1 : 0) + 4} 
                        y={25 + i * (height-50)/5} 
                        width={panelWidth - (index > 0 && index < panels - 1 ? 2 : 1) - 8} 
                        height="2" 
                        fill="rgba(150,150,150,0.6)"
                      />
                    ))}
                  </g>
                )}
                
                {specs.motorized && isSliding && (
                  <rect 
                    x={panelX + panelWidth - 20} 
                    y={height-25} 
                    width="8" 
                    height="4" 
                    fill="#FF6B6B"
                    rx="1"
                  />
                )}
              </g>
            );
          })}
          
          {/* Enhanced bottom track for all sliding windows */}
          <rect x="14" y={height-16} width={width-28} height="2" fill="#999"/>
          
          {/* Security indicator */}
          {specs.security && specs.security !== 'standard' && (
            <g>
              <circle cx={width-30} cy="25" r="6" fill="#FFD700" stroke="#FFA500" strokeWidth="1"/>
              <text x={width-30} y="28" textAnchor="middle" fontSize="8" fill="#B8860B" fontWeight="bold">🔒</text>
            </g>
          )}
          
          {/* Smart home indicator */}
          {specs.smartHome && (
            <g>
              <circle cx={width-50} cy="25" r="6" fill="#4CAF50" stroke="#2E7D32" strokeWidth="1"/>
              <text x={width-50} y="28" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">📱</text>
            </g>
          )}
        </g>
      );
    };

    const renderBayWindowSVG = (combination, angle = 30) => {
      // Professional color scheme
      const frameColor = getFrameColor(specs.frame);
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
      const frameColor = getFrameColor(specs.frame);
      const glassColor = "#E6F3FF";
      
      if (!combination) {
        // Default double hung window
        return (
          <g>
            <rect x="10" y="10" width={width-20} height={height-20} fill={frameColor} stroke={frameColor} strokeWidth="2"/>
            <rect x="18" y="18" width={safeCalc(width-36)} height={safeCalc((height-36)/2-4)} fill={glassColor} stroke="#ccc" strokeWidth="1"/>
            <rect x="18" y={18+(height-36)/2+4} width={safeCalc(width-36)} height={safeCalc((height-36)/2-4)} fill={glassColor} stroke="#ccc" strokeWidth="1"/>
            <rect x="10" y={height/2-2} width={width-20} height="4" fill={frameColor}/>
            {/* Grills on top sash */}
            {renderGrills(20, 20, safeCalc(width-40), safeCalc((height-36)/2-8), specs.grilles)}
            {/* Grills on bottom sash */}
            {renderGrills(20, 18+(height-36)/2+8, safeCalc(width-40), safeCalc((height-36)/2-8), specs.grilles)}

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

          {/* Grills on top sash */}
          {renderGrills(20, 20, width-40, (height-36)/2-8, specs.grilles)}
          
          {/* Grills on bottom sash */}
          {renderGrills(20, 18+(height-36)/2+8, width-40, (height-36)/2-8, specs.grilles)}

          {/* Sash labels */}
          <text x={width/2} y={height/4+15} textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">
            Top: {config.pattern[0]}
          </text>
          <text x={width/2} y={height*3/4+15} textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">
            Bottom: {config.pattern[1]}
          </text>

          {/* Movement indicators - following reference image pattern */}
          {(config.pattern[0] === 'Sliding' || config.pattern[0] === 'Tilt-In') && (
            <text x={width/2} y={height/4+18} textAnchor="middle" fontSize="16" fill="#e74c3c">↓</text>
          )}
          {config.pattern[0] === 'Split' && (
            <text x={width/2} y={height/4+18} textAnchor="middle" fontSize="12" fill="#e74c3c">⊞</text>
          )}

          {(config.pattern[1] === 'Sliding' || config.pattern[1] === 'Tilt-In') && (
            <text x={width/2} y={height*3/4+18} textAnchor="middle" fontSize="16" fill="#e74c3c">↑</text>
          )}
          {config.pattern[1] === 'Split' && (
            <text x={width/2} y={height*3/4+18} textAnchor="middle" fontSize="12" fill="#e74c3c">⊞</text>
          )}

          {/* Show both arrows for standard double hung (both sashes move) */}
          {config.id === 'dh-both-sliding' && (
            <>
              <text x={width/2} y={height/4+18} textAnchor="middle" fontSize="16" fill="#e74c3c">↓</text>
              <text x={width/2} y={height*3/4+18} textAnchor="middle" fontSize="16" fill="#e74c3c">↑</text>
            </>
          )}


        </g>
      );
    };

    // Enhanced Single Hung Window Renderer
    const renderSingleHungWindowSVG = (combination) => {
      const frameColor = getEnhancedFrameColor(specs.frame, specs.frameColor);
      const glassColor = getGlassColor(specs.glass, specs.glassTint);
      const hardwareColor = getHardwareColor(specs.hardware);
      
      const config = SINGLE_HUNG_COMBINATIONS.find(c => c.id === combination) || SINGLE_HUNG_COMBINATIONS[0];
      
      const sashColors = {
        'Fixed': '#e8f4fd',      // Light blue for fixed
        'Movable': '#c3e9ff',    // Slightly darker blue for movable
        'Tilt-In': '#a8d8ff',    // Medium blue for tilt-in
        'Awning': '#ff9999',     // Light red for awning
        'Hopper': '#99ff99'      // Light green for hopper
      };

      return (
        <g>
          {/* Window frame with enhanced styling */}
          <rect x="10" y="10" width={width-20} height={height-20} fill={frameColor} stroke={frameColor} strokeWidth="3"/>
          
          {/* Top sash */}
          <rect 
            x="16" 
            y="16" 
            width={width-32} 
            height={(height-32)/2-4} 
            fill={sashColors[config.pattern[0]] || glassColor} 
            stroke={config.pattern[0] === 'Fixed' ? "#999" : "#333"} 
            strokeWidth={config.pattern[0] === 'Fixed' ? "1" : "2"}
          />
          
          {/* Bottom sash */}
          <rect 
            x="18" 
            y={20+(height-32)/2} 
            width={width-36} 
            height={(height-32)/2-8} 
            fill={sashColors[config.pattern[1]] || glassColor} 
            stroke={config.pattern[1] === 'Fixed' ? "#999" : "#333"} 
            strokeWidth={config.pattern[1] === 'Fixed' ? "1" : "2"}
          />
          
          {/* Meeting rail (middle horizontal divider) */}
          <rect x="14" y={16+(height-32)/2-2} width={width-28} height="4" fill={frameColor}/>
          
          {/* Enhanced grills on both sashes */}
          {renderGrills(18, 18, width-36, (height-32)/2-8, specs.grilles, specs.grillColor)}
          {renderGrills(20, 22+(height-32)/2, width-40, (height-32)/2-12, specs.grilles, specs.grillColor)}
          
          {/* Sash labels for clarity */}
          <text x={width/2} y={height/4+5} textAnchor="middle" fontSize="9" fill="#333" fontWeight="bold">
            Top: {config.pattern[0]}
          </text>
          <text x={width/2} y={height*3/4+5} textAnchor="middle" fontSize="9" fill="#333" fontWeight="bold">
            Bottom: {config.pattern[1]}
          </text>
          
          {/* Movement indicators based on the reference image */}
          {config.pattern[0] === 'Movable' && (
            <>
              <text x={width/2} y={height/4+18} textAnchor="middle" fontSize="14" fill="#e74c3c">↓</text>
              <text x={width/2} y={height/4+30} textAnchor="middle" fontSize="14" fill="#e74c3c">↑</text>
            </>
          )}
          
          {config.pattern[1] === 'Movable' && (
            <text x={width/2} y={height*3/4+18} textAnchor="middle" fontSize="16" fill="#e74c3c">↑</text>
          )}
          
          {config.pattern[1] === 'Tilt-In' && (
            <text x={width/2} y={height*3/4+18} textAnchor="middle" fontSize="14" fill="#3498db">⤴</text>
          )}
          
          {config.pattern[1] === 'Awning' && (
            <text x={width/2} y={height*3/4+18} textAnchor="middle" fontSize="14" fill="#f39c12">↗</text>
          )}
          
          {config.pattern[1] === 'Hopper' && (
            <text x={width/2} y={height*3/4+18} textAnchor="middle" fontSize="14" fill="#27ae60">↘</text>
          )}
          
          {/* Hardware elements */}
          {/* Sash lock on meeting rail */}
          <rect x={width-28} y={16+(height-32)/2-1} width="8" height="2" fill={hardwareColor} stroke="#444" strokeWidth="0.5"/>
          
          {/* Bottom sash hardware based on type */}
          {config.pattern[1] === 'Movable' && (
            <>
              <circle cx="25" cy={height-25} r="2" fill={hardwareColor} stroke="#666" strokeWidth="1"/>
              <circle cx={width-25} cy={height-25} r="2" fill={hardwareColor} stroke="#666" strokeWidth="1"/>
            </>
          )}
          
          {config.pattern[1] === 'Tilt-In' && (
            <>
              <rect x="22" y={height-28} width="6" height="3" fill={hardwareColor} stroke="#666" strokeWidth="1"/>
              <rect x={width-28} y={height-28} width="6" height="3" fill={hardwareColor} stroke="#666" strokeWidth="1"/>
            </>
          )}
          
          {/* Weatherstripping indication on movable parts */}
          {config.pattern[1] !== 'Fixed' && (
            <line x1="18" y1={20+(height-32)/2} x2={width-18} y2={20+(height-32)/2} stroke="#444" strokeWidth="0.5" strokeDasharray="2,2"/>
          )}
        </g>
      );
    };

    // Enhanced Casement Window Renderer
    const renderCasementWindow = (config) => {
      const frameColor = getEnhancedFrameColor(specs.frame, specs.frameColor);
      const glassColor = getGlassColor(specs.glass, specs.glassTint);
      const hardwareColor = getHardwareColor(specs.hardware);
      const direction = config?.direction || 'outward';
      const hinge = config?.hinge || 'left';
      
      return (
        <g>
          {/* Enhanced outer frame with material gradient */}
          <defs>
            <linearGradient id="casementFrameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={frameColor} stopOpacity="1.2"/>
              <stop offset="50%" stopColor={frameColor} stopOpacity="1"/>
              <stop offset="100%" stopColor={frameColor} stopOpacity="0.8"/>
            </linearGradient>
            
            {/* Glass pattern for different types */}
            <pattern id="casementGlassPattern" patternUnits="userSpaceOnUse" width="20" height="20">
              {specs.glassPattern === 'frosted' && (
                <rect width="20" height="20" fill={glassColor} opacity="0.8"/>
              )}
              {specs.glassPattern === 'etched' && (
                <>
                  <rect width="20" height="20" fill={glassColor}/>
                  <circle cx="10" cy="10" r="3" fill="white" opacity="0.3"/>
                </>
              )}
              {(!specs.glassPattern || specs.glassPattern === 'clear') && (
                <rect width="20" height="20" fill={glassColor}/>
              )}
            </pattern>
          </defs>
          
          <rect x="10" y="10" width={width-20} height={height-20} fill="url(#casementFrameGrad)" stroke={frameColor} strokeWidth="2"/>
          
          {/* Enhanced glass area */}
          <rect x="18" y="18" width={width-36} height={height-36} fill="url(#casementGlassPattern)" stroke="#ccc" strokeWidth="1"/>
          
          {/* Glass performance indicator */}
          {specs.glass === 'double' && (
            <rect x="20" y="20" width={width-40} height="2" fill="rgba(0,100,255,0.3)"/>
          )}
          {specs.glass === 'triple' && (
            <>
              <rect x="20" y="20" width={width-40} height="1" fill="rgba(0,100,255,0.3)"/>
              <rect x="20" y="22" width={width-40} height="1" fill="rgba(0,100,255,0.3)"/>
            </>
          )}
          
          {/* Enhanced grills with proper color */}
          {renderGrills(20, 20, width-40, height-40, specs.grilles, specs.grillColor)}
          
          {/* Enhanced hinges based on position */}
          {hinge === 'left' && (
            <>
              <rect x="12" y="25" width="4" height="10" fill={hardwareColor} stroke="#666" strokeWidth="1"/>
              <rect x="12" y={height/2-5} width="4" height="10" fill={hardwareColor} stroke="#666" strokeWidth="1"/>
              <rect x="12" y={height-35} width="4" height="10" fill={hardwareColor} stroke="#666" strokeWidth="1"/>
            </>
          )}
          {hinge === 'right' && (
            <>
              <rect x={width-16} y="25" width="4" height="10" fill={hardwareColor} stroke="#666" strokeWidth="1"/>
              <rect x={width-16} y={height/2-5} width="4" height="10" fill={hardwareColor} stroke="#666" strokeWidth="1"/>
              <rect x={width-16} y={height-35} width="4" height="10" fill={hardwareColor} stroke="#666" strokeWidth="1"/>
            </>
          )}
          {hinge === 'top' && (
            <>
              <rect x="25" y="12" width="10" height="4" fill={hardwareColor} stroke="#666" strokeWidth="1"/>
              <rect x={width/2-5} y="12" width="10" height="4" fill={hardwareColor} stroke="#666" strokeWidth="1"/>
              <rect x={width-35} y="12" width="10" height="4" fill={hardwareColor} stroke="#666" strokeWidth="1"/>
            </>
          )}
          {hinge === 'bottom' && (
            <>
              <rect x="25" y={height-16} width="10" height="4" fill={hardwareColor} stroke="#666" strokeWidth="1"/>
              <rect x={width/2-5} y={height-16} width="10" height="4" fill={hardwareColor} stroke="#666" strokeWidth="1"/>
              <rect x={width-35} y={height-16} width="10" height="4" fill={hardwareColor} stroke="#666" strokeWidth="1"/>
            </>
          )}
          
          {/* Enhanced handle/crank based on hinge position */}
          {(hinge === 'left' || hinge === 'right') && (
            <>
              <circle 
                cx={hinge === 'left' ? width-25 : 25} 
                cy={height/2} 
                r="5" 
                fill={hardwareColor} 
                stroke="#666" 
                strokeWidth="1"
              />
              <circle 
                cx={hinge === 'left' ? width-25 : 25} 
                cy={height/2} 
                r="3" 
                fill="#666"
              />
              <line 
                x1={hinge === 'left' ? width-25 : 25} 
                y1={height/2} 
                x2={hinge === 'left' ? width-20 : 30} 
                y2={height/2-5} 
                stroke="#666" 
                strokeWidth="2"
              />
            </>
          )}
          
          {/* Direction indicator */}
          <g>
            <circle cx={width-35} cy="35" r="8" fill="rgba(52, 152, 219, 0.8)" stroke="#2980b9" strokeWidth="1"/>
            <text x={width-35} y="38" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">
              {direction === 'outward' ? '→' : '←'}
            </text>
          </g>
          
          {/* Feature indicators */}
          {specs.screenIncluded && (
            <rect 
              x="17" 
              y="17" 
              width={width-34} 
              height={height-34} 
              fill="none"
              stroke="#666"
              strokeWidth="0.5"
              strokeDasharray="2,2"
            />
          )}
          
          {specs.tiltAndTurn && (
            <g>
              <circle cx="35" cy="35" r="6" fill="#9b59b6" stroke="#8e44ad" strokeWidth="1"/>
              <text x="35" y="38" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">T&T</text>
            </g>
          )}
          
          {specs.motorized && (
            <rect x={width-30} y={height-25} width="15" height="6" fill="#e74c3c" rx="2"/>
          )}
          
          {/* Security indicator */}
          {specs.security && specs.security !== 'standard' && (
            <g>
              <circle cx={width-30} cy="55" r="6" fill="#f39c12" stroke="#e67e22" strokeWidth="1"/>
              <text x={width-30} y="58" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">🔒</text>
            </g>
          )}
        </g>
      );
    };

    const renderShape = () => {
      const frameThickness = 8;
      const frameColor = getEnhancedFrameColor(specs.frame, specs.frameColor);
      const glassColor = getGlassColor(specs.glass, specs.glassTint);
      const hardwareColor = getHardwareColor(specs.hardware);
      
      switch (windowType.id) {
        case 'single-hung':
          return renderSingleHungWindowSVG(singleHungConfig?.combination);
          
        case 'double-hung':
        case 'Double Hung Windows':
          return renderDoubleHungWindowSVG(doubleHungConfig?.combination);
          
        case 'sliding':
        case 'Sliding Windows':
          return renderSlidingWindow(slidingConfig);
          
        case 'casement':
        case 'Casement Windows':
          return renderCasementWindow(casementConfig);
          
        case 'awning':
          return (
            <g>
              {/* Enhanced outer frame */}
              <rect x="10" y="10" width={width-20} height={height-20} fill={frameColor} stroke={frameColor} strokeWidth="2"/>
              {/* Enhanced glass area */}
              <rect x="18" y="18" width={width-36} height={height-36} fill={glassColor} stroke="#ccc" strokeWidth="1"/>
              {/* Enhanced grills */}
              {renderGrills(20, 20, width-40, height-40, specs.grilles, specs.grillColor)}
              {/* Enhanced top hinges with hardware color */}
              <rect x="25" y="12" width="10" height="4" fill={hardwareColor} stroke="#666" strokeWidth="1"/>
              <rect x={width/2-5} y="12" width="10" height="4" fill={hardwareColor} stroke="#666" strokeWidth="1"/>
              <rect x={width-35} y="12" width="10" height="4" fill={hardwareColor} stroke="#666" strokeWidth="1"/>
              {/* Enhanced bottom handle/operator */}
              <circle cx={width/2} cy={height-25} r="5" fill={hardwareColor} stroke="#666" strokeWidth="1"/>
              <circle cx={width/2} cy={height-25} r="3" fill="#666"/>
              <line x1={width/2} y1={height-25} x2={width/2} y2={height-15} stroke="#666" strokeWidth="2"/>
              
              {/* Feature indicators */}
              {specs.screenIncluded && (
                <rect x="17" y="17" width={width-34} height={height-34} fill="none" stroke="#666" strokeWidth="0.5" strokeDasharray="2,2"/>
              )}
            </g>
          );
          
        case 'bay':
        case 'Bay Windows':
          return renderBayWindowSVG(bayConfig?.combination, bayConfig?.angle || 30);
          
        case 'bow':
          return (
            <g>
              {/* Enhanced curved bow window effect with multiple angled sections */}
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
              {/* Grills on glass */}
              {renderGrills(22, 22, width-44, height-44, specs.grilles)}
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
    
    const getConfigDescription = () => {
      if (windowType.id === 'sliding') {
        return getWindowDescription(windowType, slidingConfig, specs);
      } else if (windowType.id === 'bay' || windowType.name === 'Bay Windows') {
        return getWindowDescription(windowType, bayConfig, specs);
      } else if (windowType.id === 'double-hung' || windowType.name === 'Double Hung Windows') {
        return getWindowDescription(windowType, doubleHungConfig, specs);
      } else {
        return getWindowDescription(windowType, null, specs);
      }
    };
    
    return (
      <div className="window-diagram-container">
        <svg 
          width={svgWidth} 
          height={svgHeight} 
          className="window-diagram" 
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ display: 'block', overflow: 'visible', margin: '5px' }}
        >
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
      {/* Mode Selector - Only visible on quotation page */}
      <ModeSelector />
      
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
        <div className="title-header">
          <h1 className="quotation-main-title">WINDOW QUOTATION</h1>
          <div className="auto-save-indicator">
            <span className="save-icon">💾</span>
            <span className="save-text">Auto-saving enabled</span>
          </div>
        </div>
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
            <label>Client Name <span style={{color: 'red'}}>*</span></label>
            <input 
              type="text" 
              value={quotationData.clientInfo.name}
              onChange={(e) => setQuotationData(prev => ({
                ...prev, 
                clientInfo: {...prev.clientInfo, name: e.target.value}
              }))}
              className={validationErrors.clientName ? 'error' : ''}
            />
            {validationErrors.clientName && (
              <div className="error-message">{validationErrors.clientName}</div>
            )}
          </div>
          <div className="form-group">
            <label>Phone <span style={{color: 'red'}}>*</span></label>
            <input 
              type="text" 
              value={quotationData.clientInfo.phone}
              onChange={(e) => setQuotationData(prev => ({
                ...prev, 
                clientInfo: {...prev.clientInfo, phone: e.target.value}
              }))}
              className={validationErrors.clientPhone ? 'error' : ''}
              placeholder="e.g., +1234567890"
            />
            {validationErrors.clientPhone && (
              <div className="error-message">{validationErrors.clientPhone}</div>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Address</label>
            <input 
              type="text" 
              value={quotationData.clientInfo.address}
              onChange={(e) => setQuotationData(prev => ({
                ...prev, 
                clientInfo: {...prev.clientInfo, address: e.target.value}
              }))}
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              value={quotationData.clientInfo.email}
              onChange={(e) => setQuotationData(prev => ({
                ...prev, 
                clientInfo: {...prev.clientInfo, email: e.target.value}
              }))}
              className={validationErrors.clientEmail ? 'error' : ''}
              placeholder="e.g., client@example.com"
            />
            {validationErrors.clientEmail && (
              <div className="error-message">{validationErrors.clientEmail}</div>
            )}
          </div>
        </div>
      </div>

      {/* Window Builder Section */}
      <div className="window-builder">
        <div className="window-builder-title">
          <span className="window-builder-icon">🏗️</span>
          <h2>Window Builder</h2>
        </div>

        {/* Window Management Section - Moved above tabs for better layout */}
        <div className="form-section window-management-section">
          <h4 className="section-heading">
            <span className="section-icon">🏢</span>
            Window Management
            <div className="window-management-actions">
              <button 
                className="add-window-btn"
                onClick={addNewWindow}
                title="Add New Window"
              >
                ➕ Add Window
              </button>
              <button 
                className="delete-all-windows-btn"
                onClick={deleteAllWindows}
                title="Delete All Windows"
              >
                🗑️ Delete All
              </button>
            </div>
          </h4>
          
          {/* Window Tabs */}
          <div className="windows-tab-container">
            <div className="windows-tabs">
              {windows.map((window, index) => (
                <div 
                  key={window.id}
                  className={`window-tab ${index === currentWindowIndex ? 'active' : ''}`}
                  onClick={() => setCurrentWindowIndex(index)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="window-tab-content">
                    <span className="window-icon">🪟</span>
                    <input
                      type="text"
                      value={window.name}
                      onChange={(e) => updateWindowName(index, e.target.value)}
                      onBlur={(e) => {
                        if (!e.target.value.trim()) {
                          updateWindowName(index, `Window ${index + 1}`);
                        }
                      }}
                      className="window-name-input"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  
                  <div className="window-actions">
                    <button 
                      className="action-btn duplicate-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateWindow(index);
                      }}
                      title="Duplicate Window"
                    >
                      📋
                    </button>
                    <button 
                      className="action-btn remove-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeWindow(index);
                      }}
                      title="Remove Window"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Window Summary */}
            <div className="window-summary">
              <span className="window-count">
                {windows.length} Window{windows.length !== 1 ? 's' : ''} Total
              </span>
              <span className="current-window-indicator">
                Configuring: {getCurrentWindow().name}
              </span>
            </div>
          </div>
        </div>

        <div className="builder-layout">
          {/* Left Panel - Window Selection */}
          <div className="builder-left-panel">
            {/* Tabbed Configuration Interface */}
            <div className="config-tabs-container">
              <div className="config-tabs">
                <button 
                  className={`tab-button ${activeTab === 'configuration' ? 'active' : ''}`}
                  onClick={() => setActiveTab('configuration')}
                >
                  ⚙️ Configuration
                </button>
                <button 
                  className={`tab-button ${activeTab === 'measurements' ? 'active' : ''}`}
                  onClick={() => setActiveTab('measurements')}
                >
                  📏 Measurements
                </button>
                <button 
                  className={`tab-button ${activeTab === 'materials' ? 'active' : ''}`}
                  onClick={() => setActiveTab('materials')}
                >
                  🏗️ Materials
                </button>
                <button 
                  className={`tab-button ${activeTab === 'features' ? 'active' : ''}`}
                  onClick={() => setActiveTab('features')}
                >
                  ✨ Features
                </button>
              </div>

              <div className="tab-content">
                {/* Configuration Tab */}
                {activeTab === 'configuration' && (
                  <div className="tab-panel">
                    {/* Window Type Selection */}
                    <div className="form-section">
                      <h4 className="section-heading">
                        <span className="section-icon">🪟</span>
                        Window Type Selection
                      </h4>
                      <div className="form-field">
                        <label className="field-label">Select Window Type</label>
                        <select 
                          value={getCurrentWindow().selectedWindowType?.id || ''} 
                          onChange={(e) => {
                            const windowType = WINDOW_TYPES.find(type => type.id === e.target.value);
                            if (windowType) handleWindowTypeSelect(windowType);
                          }}
                          className="field-select"
                        >
                          <option value="">Choose a window type...</option>
                          {WINDOW_TYPES.map(windowType => (
                            <option key={windowType.id} value={windowType.id}>
                              {windowType.name}
                            </option>
                          ))}
                        </select>
                        {getCurrentWindow().selectedWindowType && (
                          <div className="field-description">
                            {getCurrentWindow().selectedWindowType.description}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Dynamic Window Configurations */}
                    {getCurrentWindow().selectedWindowType?.name === 'Sliding Windows' && (
                      <div className="form-section">
                        <h4 className="section-heading">
                          <span className="section-icon">⬌</span>
                          Sliding Configuration
                        </h4>
                        <div className="form-grid">
                          <div className="form-field">
                            <label className="field-label">Number of Panels</label>
                            <select
                              value={getCurrentWindow().slidingConfig?.panels || 2}
                              onChange={(e) => {
                                const panels = parseInt(e.target.value);
                                updateCurrentWindow(prev => ({
                                  ...prev,
                                  slidingConfig: {
                                    ...prev.slidingConfig,
                                    panels: panels,
                                    combination: null // Reset combination when panel count changes
                                  }
                                }));
                              }}
                              className="field-select"
                            >
                              <option value={2}>2 Panels</option>
                              <option value={3}>3 Panels</option>
                              <option value={4}>4 Panels</option>
                              <option value={5}>5 Panels</option>
                              <option value={6}>6 Panels</option>
                            </select>
                            <small className="field-hint">Select the number of sliding panels</small>
                          </div>
                          
                          <div className="form-field">
                            <label className="field-label">Panel Operation</label>
                            <select
                              value={getCurrentWindow().slidingConfig?.combination || ''}
                              onChange={(e) => {
                                updateCurrentWindow(prev => ({
                                  ...prev,
                                  slidingConfig: {
                                    ...prev.slidingConfig,
                                    combination: e.target.value
                                  }
                                }));
                              }}
                              className="field-select"
                            >
                              <option value="">Select configuration...</option>
                              {SLIDING_COMBINATIONS[getCurrentWindow().slidingConfig?.panels || 2]?.map(combo => (
                                <option key={combo.id} value={combo.id}>
                                  {combo.name}
                                </option>
                              ))}
                            </select>
                            <small className="field-hint">
                              {getCurrentWindow().slidingConfig?.combination && 
                               SLIDING_COMBINATIONS[getCurrentWindow().slidingConfig?.panels || 2]?.find(c => c.id === getCurrentWindow().slidingConfig?.combination)?.description}
                            </small>
                          </div>
                        </div>
                      </div>
                    )}

                    {getCurrentWindow().selectedWindowType?.name === 'Bay Windows' && (
                      <div className="form-section">
                        <h4 className="section-heading">
                          <span className="section-icon">🏠</span>
                          Bay Window Configuration
                        </h4>
                        <div className="form-grid">
                          <div className="form-field">
                            <label className="field-label">Bay Angle</label>
                            <select
                              value={getCurrentWindow().bayConfig?.angle || 30}
                              onChange={(e) => {
                                updateCurrentWindow(prev => ({
                                  ...prev,
                                  bayConfig: {
                                    ...prev.bayConfig,
                                    angle: parseInt(e.target.value)
                                  }
                                }));
                              }}
                              className="field-select"
                            >
                              <option value={30}>30° - Traditional Bay</option>
                              <option value={45}>45° - Wide Opening</option>
                              <option value={60}>60° - Maximum View</option>
                              <option value={90}>90° - Square Bay</option>
                            </select>
                            <small className="field-hint">Angle determines the bay window projection</small>
                          </div>
                          
                          <div className="form-field">
                            <label className="field-label">Bay Style</label>
                            <select
                              value={getCurrentWindow().bayConfig?.style || 'traditional'}
                              onChange={(e) => {
                                updateCurrentWindow(prev => ({
                                  ...prev,
                                  bayConfig: {
                                    ...prev.bayConfig,
                                    style: e.target.value
                                  }
                                }));
                              }}
                              className="field-select"
                            >
                              <option value="traditional">Traditional 3-Panel</option>
                              <option value="five-panel">5-Panel Bay</option>
                              <option value="curved">Curved Bay</option>
                              <option value="box">Box Bay</option>
                            </select>
                            <small className="field-hint">Select bay window architectural style</small>
                          </div>
                        </div>
                      </div>
                    )}

                    {quotationData.selectedWindowType?.name === 'Casement Windows' && (
                      <div className="form-section">
                        <h4 className="section-heading">
                          <span className="section-icon">🔄</span>
                          Casement Configuration
                        </h4>
                        <div className="form-grid">
                          <div className="form-field">
                            <label className="field-label">Opening Direction</label>
                            <select
                              value={getCurrentWindow().casementConfig?.direction || 'outward'}
                              onChange={(e) => {
                                updateCurrentWindow(prev => ({
                                  ...prev,
                                  casementConfig: {
                                    ...prev.casementConfig,
                                    direction: e.target.value
                                  }
                                }));
                              }}
                              className="field-select"
                            >
                              <option value="outward">Outward Opening</option>
                              <option value="inward">Inward Opening</option>
                            </select>
                            <small className="field-hint">Direction window opens</small>
                          </div>
                          
                          <div className="form-field">
                            <label className="field-label">Hinge Position</label>
                            <select
                              value={getCurrentWindow().casementConfig?.hinge || 'left'}
                              onChange={(e) => {
                                updateCurrentWindow(prev => ({
                                  ...prev,
                                  casementConfig: {
                                    ...prev.casementConfig,
                                    hinge: e.target.value
                                  }
                                }));
                              }}
                              className="field-select"
                            >
                              <option value="left">Left Hinged</option>
                              <option value="right">Right Hinged</option>
                              <option value="top">Top Hinged (Awning)</option>
                              <option value="bottom">Bottom Hinged (Hopper)</option>
                            </select>
                            <small className="field-hint">Position of window hinges</small>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Single Hung Configuration */}
                    {quotationData.selectedWindowType?.name === 'Single Hung Windows' && (
                      <div className="form-section">
                        <h4 className="section-heading">
                          <span className="section-icon">↕</span>
                          Single Hung Configuration
                        </h4>
                        <div className="form-grid">
                          <div className="form-field">
                            <label className="field-label">Window Type</label>
                            <select
                              value={getCurrentWindow().singleHungConfig?.combination || 'sh-standard'}
                              onChange={(e) => {
                                updateCurrentWindow(prev => ({
                                  ...prev,
                                  singleHungConfig: {
                                    ...prev.singleHungConfig,
                                    combination: e.target.value
                                  }
                                }));
                              }}
                              className="field-select"
                            >
                              {SINGLE_HUNG_COMBINATIONS.map(combo => (
                                <option key={combo.id} value={combo.id}>
                                  {combo.name}
                                </option>
                              ))}
                            </select>
                            <small className="field-hint">
                              {SINGLE_HUNG_COMBINATIONS.find(c => c.id === getCurrentWindow().singleHungConfig?.combination)?.description || 'Select single hung configuration'}
                            </small>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Double Hung Configuration */}
                    {quotationData.selectedWindowType?.name === 'Double Hung Windows' && (
                      <div className="form-section">
                        <h4 className="section-heading">
                          <span className="section-icon">↕</span>
                          Double Hung Configuration
                        </h4>
                        <div className="form-grid">
                          <div className="form-field">
                            <label className="field-label">Sash Operation</label>
                            <select
                              value={getCurrentWindow().doubleHungConfig?.combination || ''}
                              onChange={(e) => {
                                updateCurrentWindow(prev => ({
                                  ...prev,
                                  doubleHungConfig: {
                                    ...prev.doubleHungConfig,
                                    combination: e.target.value
                                  }
                                }));
                              }}
                              className="field-select"
                            >
                              <option value="">Select configuration...</option>
                              {DOUBLE_HUNG_COMBINATIONS.map(combo => (
                                <option key={combo.id} value={combo.id}>
                                  {combo.name}
                                </option>
                              ))}
                            </select>
                            <small className="field-hint">Choose how both sashes operate</small>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Measurements Tab */}
                {activeTab === 'measurements' && (
                  <div className="tab-panel">
                    <div className="form-section">
                      <h4 className="section-heading">
                        <span className="section-icon">📏</span>
                        Window Dimensions
                      </h4>
                      <div className="form-grid">
                        <div className="form-field">
                          <label className="field-label">Width (mm) <span style={{color: 'red'}}>*</span></label>
                          <div className="input-with-unit">
                            <input 
                              type="number" 
                              value={quotationData.windowSpecs.width}
                              onChange={(e) => handleSpecChange('width', e.target.value)}
                              placeholder="1200"
                              min="300"
                              max="3000"
                              className={`field-input ${validationErrors.width ? 'error' : ''}`}
                            />
                            <span className="input-unit">mm</span>
                          </div>
                          {validationErrors.width ? (
                            <div className="error-message">{validationErrors.width}</div>
                          ) : (
                            <small className="field-hint">Range: 300mm - 3000mm</small>
                          )}
                        </div>
                        
                        <div className="form-field">
                          <label className="field-label">Height (mm) <span style={{color: 'red'}}>*</span></label>
                          <div className="input-with-unit">
                            <input 
                              type="number" 
                              value={quotationData.windowSpecs.height}
                              onChange={(e) => handleSpecChange('height', e.target.value)}
                              placeholder="1500"
                              min="300"
                              max="2500"
                              className={`field-input ${validationErrors.height ? 'error' : ''}`}
                            />
                            <span className="input-unit">mm</span>
                          </div>
                          {validationErrors.height ? (
                            <div className="error-message">{validationErrors.height}</div>
                          ) : (
                            <small className="field-hint">Range: 300mm - 2500mm</small>
                          )}
                        </div>
                      </div>
                      
                      {quotationData.windowSpecs?.width && quotationData.windowSpecs?.height && (
                        <div className="dimension-preview">
                          <div className="preview-label">Window Area:</div>
                          <div className="preview-value">
                            {safeFormat((safeNumber(quotationData.windowSpecs?.width, 0) * safeNumber(quotationData.windowSpecs?.height, 0)) / 1000000)} m²
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="form-section">
                      <h4 className="section-heading">
                        <span className="section-icon">🔢</span>
                        Quantity & Installation
                      </h4>
                      <div className="form-grid">
                        <div className="form-field">
                          <label className="field-label">Number of Units</label>
                          <input 
                            type="number" 
                            value={quotationData.windowSpecs?.quantity || 1}
                            onChange={(e) => handleSpecChange('quantity', parseInt(e.target.value))}
                            min="1"
                            max="50"
                            className="field-input"
                          />
                          <small className="field-hint">Maximum 50 units per quote</small>
                        </div>
                        
                        <div className="form-field">
                          <label className="field-label">Installation Location</label>
                          <select
                            value={quotationData.windowSpecs.location || 'ground-floor'}
                            onChange={(e) => handleSpecChange('location', e.target.value)}
                            className="field-select"
                          >
                            <option value="ground-floor">Ground Floor</option>
                            <option value="first-floor">First Floor</option>
                            <option value="second-floor">Second Floor</option>
                            <option value="high-rise">High Rise (3+ floors)</option>
                          </select>
                          <small className="field-hint">Affects installation pricing</small>
                        </div>
                      </div>
                    </div>

                    <div className="form-section">
                      <h4 className="section-heading">
                        <span className="section-icon">🏗️</span>
                        Installation Details
                      </h4>
                      <div className="form-grid">
                        <div className="form-field">
                          <label className="field-label">Wall Type</label>
                          <select
                            value={quotationData.windowSpecs.wallType || 'brick'}
                            onChange={(e) => handleSpecChange('wallType', e.target.value)}
                            className="field-select"
                          >
                            <option value="brick">Brick Wall</option>
                            <option value="concrete">Concrete Wall</option>
                            <option value="wood-frame">Wood Frame</option>
                            <option value="steel-frame">Steel Frame</option>
                            <option value="cavity">Cavity Wall</option>
                          </select>
                          <small className="field-hint">Type of wall for installation</small>
                        </div>
                        
                        <div className="form-field">
                          <label className="field-label">Existing Window</label>
                          <select
                            value={quotationData.windowSpecs.replacement || 'new-opening'}
                            onChange={(e) => handleSpecChange('replacement', e.target.value)}
                            className="field-select"
                          >
                            <option value="new-opening">New Opening</option>
                            <option value="replace-existing">Replace Existing</option>
                            <option value="retrofit">Retrofit Installation</option>
                          </select>
                          <small className="field-hint">Installation type affects labor cost</small>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Materials Tab */}
                {activeTab === 'materials' && (
                  <div className="tab-panel">
                    <div className="form-section">
                      <h4 className="section-heading">
                        <span className="section-icon">🏗️</span>
                        Frame Material
                      </h4>
                      <div className="form-field">
                        <label className="field-label">Material Type</label>
                        <div className="material-selector">
                          <select 
                            value={quotationData.windowSpecs.frame}
                            onChange={(e) => handleSpecChange('frame', e.target.value)}
                            className="field-select"
                          >
                            <option value="aluminum">Aluminum</option>
                            <option value="upvc">uPVC (Vinyl)</option>
                            <option value="wooden">Wooden</option>
                            <option value="steel">Steel</option>
                            <option value="composite">Composite</option>
                            <option value="fiberglass">Fiberglass</option>
                          </select>
                          <div 
                            className="material-color-preview" 
                            style={{ backgroundColor: getFrameColor(quotationData.windowSpecs.frame) }}
                            title={`Preview color for ${quotationData.windowSpecs.frame}`}
                          ></div>
                        </div>
                        <div className="material-info">
                          {quotationData.windowSpecs.frame === 'aluminum' && (
                            <small>Durable, lightweight, low maintenance. Good for modern designs.</small>
                          )}
                          {quotationData.windowSpecs.frame === 'upvc' && (
                            <small>Energy efficient, weather resistant, excellent insulation properties.</small>
                          )}
                          {quotationData.windowSpecs.frame === 'wooden' && (
                            <small>Natural beauty, excellent insulation, requires regular maintenance.</small>
                          )}
                          {quotationData.windowSpecs.frame === 'steel' && (
                            <small>Very strong, slim profiles, suitable for large openings.</small>
                          )}
                          {quotationData.windowSpecs.frame === 'composite' && (
                            <small>Combines benefits of wood and PVC, low maintenance.</small>
                          )}
                          {quotationData.windowSpecs.frame === 'fiberglass' && (
                            <small>Extremely durable, energy efficient, minimal expansion/contraction.</small>
                          )}
                        </div>
                      </div>

                      <div className="form-field">
                        <label className="field-label">Frame Color/Finish</label>
                        <select
                          value={quotationData.windowSpecs.frameColor || 'white'}
                          onChange={(e) => handleSpecChange('frameColor', e.target.value)}
                          className="field-select"
                        >
                          <option value="white">White</option>
                          <option value="black">Black</option>
                          <option value="brown">Brown</option>
                          <option value="grey">Grey</option>
                          <option value="bronze">Bronze</option>
                          <option value="wood-grain">Wood Grain</option>
                          <option value="custom">Custom Color</option>
                        </select>
                        <small className="field-hint">Frame finish affects appearance and cost</small>
                      </div>
                    </div>

                    <div className="form-section">
                      <h4 className="section-heading">
                        <span className="section-icon">🔬</span>
                        Glass Specification
                      </h4>
                      <div className="form-grid">
                        <div className="form-field">
                          <label className="field-label">Glass Type</label>
                          <select 
                            value={quotationData.windowSpecs.glass}
                            onChange={(e) => handleSpecChange('glass', e.target.value)}
                            className="field-select"
                          >
                            <option value="single">Single Glazed (4mm)</option>
                            <option value="double">Double Glazed (4-12-4mm)</option>
                            <option value="triple">Triple Glazed (4-12-4-12-4mm)</option>
                            <option value="laminated">Laminated Safety Glass</option>
                            <option value="tempered">Tempered Safety Glass</option>
                            <option value="low-e">Low-E Energy Efficient</option>
                            <option value="acoustic">Acoustic Insulation</option>
                          </select>
                          <small className="field-hint">Glass type affects energy efficiency and sound insulation</small>
                        </div>

                        <div className="form-field">
                          <label className="field-label">Glass Tint</label>
                          <select
                            value={quotationData.windowSpecs.glassTint || 'clear'}
                            onChange={(e) => handleSpecChange('glassTint', e.target.value)}
                            className="field-select"
                          >
                            <option value="clear">Clear</option>
                            <option value="bronze">Bronze Tint</option>
                            <option value="grey">Grey Tint</option>
                            <option value="blue">Blue Tint</option>
                            <option value="green">Green Tint</option>
                            <option value="reflective">Reflective</option>
                          </select>
                          <small className="field-hint">Tinted glass reduces glare and heat</small>
                        </div>
                      </div>

                      <div className="glass-performance">
                        <h5>Glass Performance Ratings</h5>
                        <div className="performance-grid">
                          <div className="performance-item">
                            <span className="performance-label">U-Value:</span>
                            <span className="performance-value">
                              {quotationData.windowSpecs.glass === 'single' ? '5.7' : 
                               quotationData.windowSpecs.glass === 'double' ? '2.8' :
                               quotationData.windowSpecs.glass === 'triple' ? '1.6' : '2.5'} W/m²K
                            </span>
                          </div>
                          <div className="performance-item">
                            <span className="performance-label">Sound Reduction:</span>
                            <span className="performance-value">
                              {quotationData.windowSpecs.glass === 'single' ? '25' : 
                               quotationData.windowSpecs.glass === 'double' ? '35' :
                               quotationData.windowSpecs.glass === 'acoustic' ? '45' : '40'} dB
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="form-section">
                      <h4 className="section-heading">
                        <span className="section-icon">🔧</span>
                        Hardware & Accessories
                      </h4>
                      <div className="form-grid">
                        <div className="form-field">
                          <label className="field-label">Hardware Finish</label>
                          <select
                            value={quotationData.windowSpecs.hardware || 'standard'}
                            onChange={(e) => handleSpecChange('hardware', e.target.value)}
                            className="field-select"
                          >
                            <option value="standard">Standard White</option>
                            <option value="brushed-chrome">Brushed Chrome</option>
                            <option value="polished-chrome">Polished Chrome</option>
                            <option value="brushed-nickel">Brushed Nickel</option>
                            <option value="oil-rubbed-bronze">Oil Rubbed Bronze</option>
                            <option value="black">Matte Black</option>
                          </select>
                          <small className="field-hint">Hardware includes handles, locks, and hinges</small>
                        </div>

                        <div className="form-field">
                          <label className="field-label">Security Features</label>
                          <select
                            value={quotationData.windowSpecs.security || 'standard'}
                            onChange={(e) => handleSpecChange('security', e.target.value)}
                            className="field-select"
                          >
                            <option value="standard">Standard Locks</option>
                            <option value="multi-point">Multi-Point Locking</option>
                            <option value="security-glass">Security Glass</option>
                            <option value="reinforced">Reinforced Frame</option>
                            <option value="smart-locks">Smart Lock System</option>
                          </select>
                          <small className="field-hint">Enhanced security options available</small>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Features Tab */}
                {activeTab === 'features' && (
                  <div className="tab-panel">
                    <div className="form-section">
                      <h4 className="section-heading">
                        <span className="section-icon">📐</span>
                        Grill & Decorative Options
                      </h4>
                      <div className="form-field">
                        <label className="field-label">Grill Pattern</label>
                        <select 
                          value={quotationData.windowSpecs.grilles}
                          onChange={(e) => handleSpecChange('grilles', e.target.value)}
                          className="field-select"
                        >
                          <option value="none">No Grills</option>
                          <option value="colonial">Colonial Grid (Traditional)</option>
                          <option value="prairie">Prairie Style (4-Pane)</option>
                          <option value="diamond">Diamond Pattern</option>
                          <option value="georgian">Georgian Bars</option>
                          <option value="custom-grid">Custom Grid Pattern</option>
                          <option value="between-glass">Between Glass Grills</option>
                          <option value="snap-in">Snap-in Removable</option>
                          <option value="decorative">Decorative Muntins</option>
                        </select>
                        <small className="field-hint">Grills add architectural character to windows</small>
                      </div>

                      {quotationData.windowSpecs.grilles !== 'none' && (
                        <div className="form-field">
                          <label className="field-label">Grill Color</label>
                          <select
                            value={quotationData.windowSpecs.grillColor || 'white'}
                            onChange={(e) => handleSpecChange('grillColor', e.target.value)}
                            className="field-select"
                          >
                            <option value="white">White</option>
                            <option value="black">Black</option>
                            <option value="bronze">Bronze</option>
                            <option value="match-frame">Match Frame Color</option>
                            <option value="custom">Custom Color</option>
                          </select>
                          <small className="field-hint">Grill color can match or contrast frame</small>
                        </div>
                      )}
                    </div>

                    <div className="form-section">
                      <h4 className="section-heading">
                        <span className="section-icon">🌤️</span>
                        Weather & Energy Features
                      </h4>
                      <div className="form-grid">
                        <div className="form-field">
                          <label className="field-label">Weather Stripping</label>
                          <select
                            value={quotationData.windowSpecs.weatherStripping || 'standard'}
                            onChange={(e) => handleSpecChange('weatherStripping', e.target.value)}
                            className="field-select"
                          >
                            <option value="standard">Standard Seal</option>
                            <option value="premium">Premium Seal</option>
                            <option value="triple-seal">Triple Seal System</option>
                            <option value="compression">Compression Seal</option>
                          </select>
                          <small className="field-hint">Better sealing improves energy efficiency</small>
                        </div>

                        <div className="form-field">
                          <label className="field-label">Drainage System</label>
                          <select
                            value={quotationData.windowSpecs.drainage || 'standard'}
                            onChange={(e) => handleSpecChange('drainage', e.target.value)}
                            className="field-select"
                          >
                            <option value="standard">Standard Weep Holes</option>
                            <option value="sloped-sill">Sloped Sill Design</option>
                            <option value="internal-drain">Internal Drainage</option>
                            <option value="pressure-equalized">Pressure Equalized</option>
                          </select>
                          <small className="field-hint">Prevents water infiltration and damage</small>
                        </div>
                      </div>
                    </div>

                    <div className="form-section">
                      <h4 className="section-heading">
                        <span className="section-icon">🏠</span>
                        Comfort & Convenience Features
                      </h4>
                      <div className="checkbox-grid">
                        <div className="checkbox-field">
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={quotationData.windowSpecs.screenIncluded || false}
                              onChange={(e) => handleSpecChange('screenIncluded', e.target.checked)}
                            />
                            <span className="checkmark"></span>
                            Include Screen Mesh
                          </label>
                          <small>Insect protection screen</small>
                        </div>

                        <div className="checkbox-field">
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={quotationData.windowSpecs.blindsIntegrated || false}
                              onChange={(e) => handleSpecChange('blindsIntegrated', e.target.checked)}
                            />
                            <span className="checkmark"></span>
                            Integrated Blinds
                          </label>
                          <small>Built-in between glass blinds</small>
                        </div>

                        <div className="checkbox-field">
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={quotationData.windowSpecs.tiltAndTurn || false}
                              onChange={(e) => handleSpecChange('tiltAndTurn', e.target.checked)}
                            />
                            <span className="checkmark"></span>
                            Tilt & Turn Function
                          </label>
                          <small>Easy cleaning and ventilation</small>
                        </div>

                        <div className="checkbox-field">
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={quotationData.windowSpecs.childSafety || false}
                              onChange={(e) => handleSpecChange('childSafety', e.target.checked)}
                            />
                            <span className="checkmark"></span>
                            Child Safety Locks
                          </label>
                          <small>Restricts window opening</small>
                        </div>

                        <div className="checkbox-field">
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={quotationData.windowSpecs.motorized || false}
                              onChange={(e) => handleSpecChange('motorized', e.target.checked)}
                            />
                            <span className="checkmark"></span>
                            Motorized Operation
                          </label>
                          <small>Electric window operation</small>
                        </div>

                        <div className="checkbox-field">
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={quotationData.windowSpecs.smartHome || false}
                              onChange={(e) => handleSpecChange('smartHome', e.target.checked)}
                            />
                            <span className="checkmark"></span>
                            Smart Home Integration
                          </label>
                          <small>IoT connectivity and automation</small>
                        </div>
                      </div>
                    </div>

                    <div className="form-section">
                      <h4 className="section-heading">
                        <span className="section-icon">🎨</span>
                        Aesthetic Enhancements
                      </h4>
                      <div className="form-grid">
                        <div className="form-field">
                          <label className="field-label">Window Trim Style</label>
                          <select
                            value={quotationData.windowSpecs.trimStyle || 'standard'}
                            onChange={(e) => handleSpecChange('trimStyle', e.target.value)}
                            className="field-select"
                          >
                            <option value="standard">Standard Trim</option>
                            <option value="colonial">Colonial Style</option>
                            <option value="craftsman">Craftsman Style</option>
                            <option value="modern">Modern Minimal</option>
                            <option value="decorative">Decorative Molding</option>
                            <option value="custom">Custom Design</option>
                          </select>
                          <small className="field-hint">Interior and exterior trim appearance</small>
                        </div>

                        <div className="form-field">
                          <label className="field-label">Glass Pattern</label>
                          <select
                            value={quotationData.windowSpecs.glassPattern || 'clear'}
                            onChange={(e) => handleSpecChange('glassPattern', e.target.value)}
                            className="field-select"
                          >
                            <option value="clear">Clear Glass</option>
                            <option value="frosted">Frosted Glass</option>
                            <option value="etched">Etched Pattern</option>
                            <option value="stained">Stained Glass</option>
                            <option value="textured">Textured Glass</option>
                            <option value="privacy">Privacy Pattern</option>
                          </select>
                          <small className="field-hint">Decorative glass options for privacy and style</small>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
                    singleHungConfig={quotationData.singleHungConfig}
                    casementConfig={quotationData.casementConfig}
                    onShowDescription={openDescriptionModal}
                  />
                </div>
                <div className="preview-info">
                  <div className="preview-details">
                    <h4>{quotationData.selectedWindowType.name}</h4>
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



      {/* Detailed Window Specifications Section */}
      {(quotationData.selectedWindowType || (windows.length > 0 && getCurrentWindow()?.selectedWindowType)) && (
        <div className="detailed-specifications">
          {/* Window Details Header */}
          <div className="window-details-header">
            <table className="details-table">
              <tbody>
                <tr>
                  <td className="label-cell"><strong>Code :</strong></td>
                  <td className="value-cell">{quotationData.windowCode || getCurrentWindow()?.windowCode || 'W' + (currentWindowIndex + 1)}</td>
                  <td className="label-cell"><strong>Size :</strong></td>
                  <td className="value-cell">
                    W = {safeFormat(quotationData.windowSpecs?.width || getCurrentWindow()?.windowSpecs?.width, 2, 1000)}; H = {safeFormat(quotationData.windowSpecs?.height || getCurrentWindow()?.windowSpecs?.height, 2, 1000)}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell"><strong>Name :</strong></td>
                  <td className="value-cell">{(quotationData.selectedWindowType?.name || getCurrentWindow()?.selectedWindowType?.name || 'WINDOW')}</td>
                  <td className="label-cell"><strong>Profile System :</strong></td>
                  <td className="value-cell">
                    ADS SYSTEM - {(quotationData.windowSpecs?.frameType || getCurrentWindow()?.windowSpecs?.frameType || 'ALUMINIUM')} {(quotationData.selectedWindowType?.name || getCurrentWindow()?.selectedWindowType?.name || 'WINDOW').toUpperCase()} SERIES
                  </td>
                </tr>
                <tr>
                  <td className="label-cell"><strong>Location :</strong></td>
                  <td className="value-cell">{((quotationData.windowSpecs?.location || getCurrentWindow()?.windowSpecs?.location || 'ROOM 1')).toUpperCase()}</td>
                  <td className="label-cell"><strong>Glass :</strong></td>
                  <td className="value-cell">
                    {formatGlassType(
                      quotationData.windowSpecs?.glass || getCurrentWindow()?.windowSpecs?.glass || 'single',
                      quotationData.windowSpecs?.glassTint || getCurrentWindow()?.windowSpecs?.glassTint || 'Clear'
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Computed Values Section */}
          <div className="computed-values">
            <div className="section-header">Computed Values</div>
            <table className="computed-table">
              <tbody>
                <tr>
                  <td className="computed-label">Sq.Ft. per window</td>
                  <td className="computed-value">
                    {safeFormat((safeNumber(quotationData.windowSpecs?.width || getCurrentWindow()?.windowSpecs?.width, 1000) * safeNumber(quotationData.windowSpecs?.height || getCurrentWindow()?.windowSpecs?.height, 1000)) / 92903)} Sq.Ft.
                  </td>
                </tr>
                <tr>
                  <td className="computed-label">Value per Sq.Ft.</td>
                  <td className="computed-value">
                    {safeFormat(safeNumber(quotationData.pricing?.unitPrice || getCurrentWindow()?.pricing?.unitPrice, 5000) / ((safeNumber(quotationData.windowSpecs?.width || getCurrentWindow()?.windowSpecs?.width, 1000) * safeNumber(quotationData.windowSpecs?.height || getCurrentWindow()?.windowSpecs?.height, 1000)) / 92903))} INR
                  </td>
                </tr>
                <tr>
                  <td className="computed-label">Unit Price</td>
                  <td className="computed-value">{safeFormat(quotationData.pricing?.unitPrice || getCurrentWindow()?.pricing?.unitPrice, 2, 5000)} INR</td>
                </tr>
                <tr>
                  <td className="computed-label">Quantity</td>
                  <td className="computed-value">{safeNumber(quotationData.windowSpecs?.quantity || getCurrentWindow()?.windowSpecs?.quantity, 1)} Pcs</td>
                </tr>
                <tr>
                  <td className="computed-label">Value</td>
                  <td className="computed-value">{safeFormat(safeNumber(quotationData.pricing?.unitPrice || getCurrentWindow()?.pricing?.unitPrice, 5000) * safeNumber(quotationData.windowSpecs?.quantity || getCurrentWindow()?.windowSpecs?.quantity, 1))} INR</td>
                </tr>
                <tr>
                  <td className="computed-label">Weight</td>
                  <td className="computed-value">
                    {safeFormat((safeNumber(quotationData.windowSpecs?.width || getCurrentWindow()?.windowSpecs?.width, 1000) * safeNumber(quotationData.windowSpecs?.height || getCurrentWindow()?.windowSpecs?.height, 1000) * 0.000015) * safeNumber(quotationData.windowSpecs?.quantity || getCurrentWindow()?.windowSpecs?.quantity, 1))} KG
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Profile and Accessories Section */}
          <div className="profile-accessories">
            <table className="profile-table">
              <thead>
                <tr>
                  <th className="profile-header">Profile</th>
                  <th className="accessories-header">Accessories</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="profile-details">
                    <div><strong>Profile Color :</strong> {(quotationData.windowSpecs?.frameColor || getCurrentWindow()?.windowSpecs?.frameColor || 'MILL FINISH').toUpperCase()}</div>
                    <div><strong>MeshType :</strong> {quotationData.windowSpecs?.meshType || getCurrentWindow()?.windowSpecs?.meshType || 'No'}</div>
                    <div><strong>Guide Rail :</strong> Sld Guidrail 14Mm X 8Mm</div>
                    <div><strong>Sliding Sash :</strong> Sld Handle Sash 27Mm X 55Mm</div>
                    <div><strong>Sliding Sash :</strong> Sld Interlock Sash 38Mm X 20Mm</div>
                    <div><strong>Sliding Sash :</strong> Sld Top Bottom Sash 24Mm X 58Mm</div>
                    <div><strong>Track :</strong> Sld 3 Track 108Mm X 43Mm</div>
                  </td>
                  <td className="accessories-details">
                    <div><strong>Locking :</strong> {quotationData.windowSpecs?.lockType || getCurrentWindow()?.windowSpecs?.lockType || 'NA'}</div>
                    <div><strong>Handle color :</strong> {(quotationData.windowSpecs?.handleColor || getCurrentWindow()?.windowSpecs?.handleColor || 'BLACK').toUpperCase()}</div>
                    <div><strong>Handle Type :</strong> {quotationData.windowSpecs?.handleType || getCurrentWindow()?.windowSpecs?.handleType || 'S1-Concealed Lock'}</div>
                    <div><strong>Handle</strong></div>
                    <div><strong>Handle Type :</strong> {quotationData.windowSpecs?.handleType2 || getCurrentWindow()?.windowSpecs?.handleType2 || 'S2-Concealed Lock'}</div>
                    <div><strong>Handle</strong></div>
                    <div><strong>Roller :</strong> {quotationData.windowSpecs?.rollerType || getCurrentWindow()?.windowSpecs?.rollerType || 'Single Wheel Adjustable Roller'}</div>
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="remarks-section">
              <strong>Remarks :</strong> {quotationData.remarks || getCurrentWindow()?.remarks || ''}
            </div>
          </div>

          {/* Quote Total Section */}
          <div className="quote-total">
            <div className="section-header">Quote Total</div>
            <table className="quote-total-table">
              <tbody>
                <tr>
                  <td className="total-label">No. of Components</td>
                  <td className="total-value">{calculateCombinedTotals().totalComponents} Pcs</td>
                </tr>
                <tr>
                  <td className="total-label">Total Area</td>
                  <td className="total-value">
                    {safeFormat(calculateCombinedTotals().totalArea)} Sq.Ft.
                  </td>
                </tr>
                <tr>
                  <td className="total-label">Basic Value</td>
                  <td className="total-value">{safeFormat(calculateCombinedTotals().basicValue)} INR</td>
                </tr>
                <tr>
                  <td className="total-label">Sub Total</td>
                  <td className="total-value">{safeFormat(calculateCombinedTotals().basicValue)} INR</td>
                </tr>
                <tr>
                  <td className="total-label">Transportation Cost</td>
                  <td className="total-value">{safeFormat(calculateCombinedTotals().transportationCost, 0)} INR</td>
                </tr>
                <tr>
                  <td className="total-label">Loading And Unloading</td>
                  <td className="total-value">{safeFormat(calculateCombinedTotals().loadingCost, 0)} INR</td>
                </tr>
                <tr>
                  <td className="total-label">Total Project Cost</td>
                  <td className="total-value">
                    {safeFormat(calculateCombinedTotals().totalProjectCost)} INR
                  </td>
                </tr>
                <tr>
                  <td className="total-label">Gst @{calculateCombinedTotals().gstRate}%</td>
                  <td className="total-value">
                    {safeFormat(calculateCombinedTotals().gstAmount)} INR
                  </td>
                </tr>
                <tr className="grand-total-row">
                  <td className="total-label"><strong>Grand Total</strong></td>
                  <td className="total-value">
                    <strong>
                      {safeFormat(calculateCombinedTotals().grandTotal)} INR
                    </strong>
                  </td>
                </tr>
                <tr>
                  <td className="total-label">Average Price per Sq.Ft. without GST</td>
                  <td className="total-value">
                    {safeFormat(calculateCombinedTotals().avgPriceWithoutGST)} INR
                  </td>
                </tr>
                <tr>
                  <td className="total-label">Average Price per Sq.Ft.</td>
                  <td className="total-value">
                    {safeFormat(calculateCombinedTotals().avgPriceWithGST)} INR
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Manual Pricing Adjustments */}
          <div className="manual-pricing-form">
            <div className="form-title">Manual Pricing Adjustments</div>
            
            <div className="pricing-form-grid">
              <div className="pricing-form-group">
                <label htmlFor="unitPrice">Unit Price (INR)</label>
                <input
                  type="number"
                  id="unitPrice"
                  value={quotationData.pricing?.unitPrice || getCurrentWindow()?.pricing?.unitPrice || ''}
                  onChange={(e) => handlePricingChange('unitPrice', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  className="pricing-input"
                />
              </div>

              <div className="pricing-form-group">
                <label htmlFor="quantity">Quantity</label>
                <input
                  type="number"
                  id="quantity"
                  value={quotationData.windowSpecs?.quantity || getCurrentWindow()?.windowSpecs?.quantity || 1}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                  min="1"
                  className="pricing-input"
                />
              </div>

              <div className="pricing-form-group">
                <label htmlFor="transportationCost">Transportation Cost (INR)</label>
                <input
                  type="number"
                  id="transportationCost"
                  value={quotationData.pricing?.transportationCost || getCurrentWindow()?.pricing?.transportationCost || ''}
                  onChange={(e) => handlePricingChange('transportationCost', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="1"
                  className="pricing-input"
                />
              </div>

              <div className="pricing-form-group">
                <label htmlFor="loadingCost">Loading & Unloading Cost (INR)</label>
                <input
                  type="number"
                  id="loadingCost"
                  value={quotationData.pricing?.loadingCost || getCurrentWindow()?.pricing?.loadingCost || ''}
                  onChange={(e) => handlePricingChange('loadingCost', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="1"
                  className="pricing-input"
                />
              </div>

              <div className="pricing-form-group">
                <label htmlFor="taxRate">GST Rate (%)</label>
                <input
                  type="number"
                  id="taxRate"
                  value={quotationData.pricing?.taxRate || getCurrentWindow()?.pricing?.taxRate || 18}
                  onChange={(e) => handlePricingChange('taxRate', parseFloat(e.target.value) || 18)}
                  min="0"
                  max="100"
                  step="0.1"
                  className="pricing-input"
                />
              </div>

              <div className="pricing-form-group">
                <label htmlFor="windowCode">Window Code</label>
                <input
                  type="text"
                  id="windowCode"
                  value={quotationData.windowCode || getCurrentWindow()?.windowCode || ''}
                  onChange={(e) => {
                    setQuotationData(prev => ({...prev, windowCode: e.target.value}));
                    if (windows.length > 0) {
                      updateCurrentWindow(prev => ({...prev, windowCode: e.target.value}));
                    }
                  }}
                  className="pricing-input"
                  placeholder={`e.g., W${currentWindowIndex + 1}`}
                />
              </div>
            </div>

            <div className="pricing-actions">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={autoPopulatePricing}
              >
                Auto-Populate from Configuration
              </button>
              <button 
                type="button" 
                className="btn-primary"
                onClick={recalculatePricing}
              >
                Recalculate Total
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="quotation-actions">
        <button className="btn-success" onClick={handleNewQuotation}>
          New Quotation
        </button>
        <button className="btn-draft" onClick={handleSaveDraft}>
          Save as Draft
        </button>
        <button 
          className="btn-info" 
          onClick={handleSubmitQuotation}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Save & Submit'}
        </button>
        <button className="btn-secondary" onClick={generatePDF}>
          Generate PDF
        </button>
        <button className="btn-warning" onClick={handleClearAutoSavedData}>
          Clear Auto-saved Data
        </button>
      </div>

      {/* Description Modal */}
      {showDescriptionModal && (
        <div className="modal-overlay" onClick={closeDescriptionModal}>
          <div className="description-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modalContent.title}</h3>
              <button className="modal-close" onClick={closeDescriptionModal}>
                ×
              </button>
            </div>
            <div className="modal-content">
              <div className="config-details">
                {modalContent.description.split('\n').map((detail, index) => {
                  const [key, value] = detail.split(': ');
                  return (
                    <div key={index} className="config-item">
                      <span className="config-key">{key}:</span>
                      <span className="config-value">{value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeDescriptionModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirmDialog}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        type={confirmDialog.type}
      />

      {/* Notification Toast */}
      {notification.show && (
        <div className={`notification-toast notification-${notification.type}`}>
          <div className="notification-content">
            <span className="notification-icon">
              {notification.type === 'success' && '✓'}
              {notification.type === 'error' && '✕'}
              {notification.type === 'warning' && '⚠'}
              {notification.type === 'info' && 'ℹ'}
            </span>
            <span className="notification-message">{notification.message}</span>
          </div>
          <button 
            className="notification-close" 
            onClick={() => setNotification(prev => ({ ...prev, show: false }))}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default QuotationPage;