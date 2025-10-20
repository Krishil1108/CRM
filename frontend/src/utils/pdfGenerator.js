import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Professional PDF Generator for Window Quotations
 * This module provides a clean, modular PDF generation functionality
 * that captures the current state of quotation data without interfering
 * with the existing UI or data flow.
 */

class QuotationPDFGenerator {
  constructor() {
    this.pdf = null;
    this.pageWidth = 210; // A4 width in mm
    this.pageHeight = 297; // A4 height in mm
    this.margin = 25.4; // 1 inch margins on all sides (25.4mm)
    this.currentY = this.margin;
    this.lineHeight = 7;
    this.lineSpacing = 1.3; // 1.3x line spacing for better readability
    this.sectionGap = 12; // Gap between major sections
    this.colors = {
      primary: [26, 82, 118], // Professional dark blue
      secondary: [41, 128, 185], // Medium blue
      accent: [231, 76, 60], // Red for highlights
      text: [44, 62, 80], // Dark gray for text
      lightGray: [245, 245, 245], // Very light gray for backgrounds
      borderGray: [220, 220, 220], // Light gray for borders
      white: [255, 255, 255],
      gold: [218, 165, 32] // Gold for premium look
    };
  }

  /**
   * Main function to generate PDF from quotation data
   * @param {Object} quotationData - The quotation data object
   * @param {Array} quotationData.windowSpecs - Array of window specifications
   * @param {Object} quotationData.clientDetails - Client information
   * @param {Object} quotationData.companyDetails - Company information
   */
  async generatePDF(quotationData) {
    try {
      this.pdf = new jsPDF('p', 'mm', 'a4');
      this.currentY = this.margin;
      this.quotationData = quotationData; // Store for access in other methods

      // Generate the PDF content
      this.addHeader(quotationData);
      this.addQuoteInfo(quotationData);
      this.addSectionDivider(); // Visual separator
      this.addClientDetails(quotationData);
      this.addSectionDivider(); // Visual separator
      this.addIntroduction();
      
      // Add window specifications
      for (let i = 0; i < quotationData.windowSpecs.length; i++) {
        if (i > 0) {
          this.pdf.addPage();
          this.currentY = this.margin;
          this.addHeader(quotationData);
          this.addQuoteInfo(quotationData);
        }
        await this.addWindowSpecification(quotationData.windowSpecs[i], i);
      }

      // Add totals on a new page
      this.pdf.addPage();
      this.currentY = this.margin;
      this.addHeader(quotationData);
      this.addQuoteInfo(quotationData);
      this.addQuoteTotals(quotationData);
      this.addTermsAndConditions();
      
      // Add page numbers to all pages
      this.addPageNumbers();
      
      // Save the PDF
      const fileName = `Quotation_${quotationData.quotationNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
      this.pdf.save(fileName);
      
      return { success: true, fileName };
    } catch (error) {
      console.error('Error generating PDF:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add professional header with company branding
   */
  addHeader(quotationData) {
    // Safety check - use stored quotationData if not provided
    if (!quotationData) {
      quotationData = this.quotationData || {};
    }
    
    const companyDetails = quotationData?.companyDetails || {
      name: 'ADS SYSTEMS',
      phone: '9574544012',
      email: 'support@adssystem.co.in',
      website: 'adssystem.co.in',
      gstin: '24APJPP8011N1ZK'
    };
    
    // Header background with gradient effect (simulated with two rectangles)
    this.pdf.setFillColor(...this.colors.primary);
    this.pdf.rect(0, 0, this.pageWidth, 35, 'F');
    
    // Gold accent bar at top
    this.pdf.setFillColor(...this.colors.gold);
    this.pdf.rect(0, 0, this.pageWidth, 2, 'F');
    
    // Company Logo Area (left side)
    this.pdf.setFillColor(...this.colors.white);
    this.pdf.rect(this.margin - 5, 8, 45, 20, 'F');
    
    // ADS Logo Text
    this.pdf.setTextColor(...this.colors.primary);
    this.pdf.setFontSize(28);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('ADS', this.margin, 18);
    
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text('SYSTEMS', this.margin, 24);
    
    // Main Title (center-right area)
    this.pdf.setTextColor(...this.colors.white);
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Finvent Windows & Doors', this.margin + 50, 13);
    
    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text('Quotation System', this.margin + 50, 20);
    
    // Contact details (right side) - using ASCII-safe text labels
    this.pdf.setFontSize(8);
    const rightX = this.pageWidth - this.margin;
    this.pdf.text(`Phone: ${companyDetails.phone || 'N/A'}`, rightX, 10, { align: 'right' });
    this.pdf.text(`Email: ${companyDetails.email || 'N/A'}`, rightX, 15, { align: 'right' });
    this.pdf.text(`Web: ${companyDetails.website || 'N/A'}`, rightX, 20, { align: 'right' });
    this.pdf.text(`GSTIN: ${companyDetails.gstin || 'N/A'}`, rightX, 25, { align: 'right' });
    
    // Bottom border line
    this.pdf.setDrawColor(...this.colors.gold);
    this.pdf.setLineWidth(0.5);
    this.pdf.line(this.margin, 35, this.pageWidth - this.margin, 35);
    
    this.currentY = 42;
  }

  /**
   * Add quotation information line
   */
  addQuoteInfo(quotationData) {
    // Safety check
    if (!quotationData) {
      quotationData = this.quotationData || {};
    }
    
    // Info box with border
    this.pdf.setDrawColor(...this.colors.borderGray);
    this.pdf.setLineWidth(0.3);
    this.pdf.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 12, 2, 2, 'S');
    
    // Background
    this.pdf.setFillColor(...this.colors.lightGray);
    this.pdf.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 12, 2, 2, 'F');
    
    this.pdf.setTextColor(...this.colors.text);
    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'bold');
    
    // Three column layout
    const col1X = this.margin + 5;
    const col2X = this.margin + 65;
    const col3X = this.margin + 125;
    
    this.pdf.text('Quote No:', col1X, this.currentY + 4);
    this.pdf.text('Project:', col2X, this.currentY + 4);
    this.pdf.text('Date:', col3X, this.currentY + 4);
    
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text(String(quotationData.quotationNumber || 'N/A'), col1X, this.currentY + 9);
    this.pdf.text(String(quotationData.project || 'N/A'), col2X, this.currentY + 9);
    this.pdf.text(String(quotationData.date || 'N/A'), col3X, this.currentY + 9);
    
    this.currentY += 17;
  }

  /**
   * Add client details section
   */
  addClientDetails(quotationData) {
    // Safety check
    if (!quotationData) {
      quotationData = this.quotationData || {};
    }
    
    const clientDetails = quotationData?.clientDetails || {};
    
    // Section header
    this.pdf.setFillColor(...this.colors.secondary);
    this.pdf.rect(this.margin, this.currentY, 30, 6, 'F');
    this.pdf.setTextColor(...this.colors.white);
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('To:', this.margin + 3, this.currentY + 4.5);
    
    this.currentY += 8;
    
    // Client info box
    this.pdf.setDrawColor(...this.colors.borderGray);
    this.pdf.setLineWidth(0.3);
    
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(...this.colors.text);
    
    if (clientDetails.name) {
      this.pdf.text(String(clientDetails.name), this.margin + 3, this.currentY);
      this.currentY += 6;
    }
    
    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'normal');
    
    if (clientDetails.address) {
      const addressLines = String(clientDetails.address).split('\n');
      addressLines.forEach(line => {
        if (line.trim()) {
          this.pdf.text(line.trim(), this.margin + 3, this.currentY);
          this.currentY += 5;
        }
      });
    }
    
    this.currentY += 3;
  }

  /**
   * Add introduction text
   */
  addIntroduction() {
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor(...this.colors.text);
    
    const introText = [
      'Dear Sir/Madam,',
      '',
      'We are delighted that you are considering our range of Windows and Doors for your premises.',
      'Our products have gained rapid acceptance across India for their superior protection from',
      'noise, heat, rain, dust, and pollution.',
      '',
      'This proposal suggests designs that enhance comfort and aesthetics while improving your',
      'building\'s facade. Our offer includes:',
      '',
      '1. Window design, specifications, and pricing',
      '2. Terms and conditions',
      '',
      'We look forward to serving you.',
    ];
    
    introText.forEach(line => {
      this.pdf.text(line, this.margin, this.currentY);
      this.currentY += 5;
    });
    
    this.currentY += 5;
  }

  /**
   * Add window specification with diagram
   */
  async addWindowSpecification(spec, index) {
    // Check if we need a new page (more conservative check for diagram space)
    if (this.currentY > this.pageHeight - 140) {
      this.pdf.addPage();
      this.currentY = this.margin;
      this.addHeader(this.quotationData);
      this.addQuoteInfo(this.quotationData);
    }

    // Section title with gold accent
    this.pdf.setFillColor(...this.colors.primary);
    this.pdf.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 10, 'F');
    
    this.pdf.setFillColor(...this.colors.gold);
    this.pdf.rect(this.margin, this.currentY, 4, 10, 'F');
    
    this.pdf.setTextColor(...this.colors.white);
    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'bold');
    
    // Extract readable name - handle object, string, or undefined
    let windowName = 'Custom Window';
    if (typeof spec.name === 'string') {
      windowName = spec.name;
    } else if (spec.name && typeof spec.name === 'object') {
      // If name is an object, try to extract meaningful info
      windowName = spec.name.location || spec.name.type || 'Custom Window';
    } else if (spec.location) {
      windowName = spec.location;
    } else if (spec.type || spec.selectedWindowType) {
      const type = this.formatWindowType(spec.type || spec.selectedWindowType);
      windowName = type;
    }
    
    this.pdf.text(`Window Specification ${index + 1}: ${windowName}`, this.margin + 8, this.currentY + 7);
    
    this.currentY += 15;

    // New Layout: Left = Diagram Only, Right = Specs + Pricing stacked
    const leftColX = this.margin;
    const leftColWidth = (this.pageWidth - 2 * this.margin) * 0.46; // Reduced to 46% for better fit
    const rightColX = this.margin + leftColWidth + 8; // More gap
    const rightColWidth = (this.pageWidth - 2 * this.margin) * 0.54 - 8; // Right 54% for specs + pricing
    
    const startY = this.currentY;
    const leftStartY = this.currentY;
    
    // Check if we have enough space for the diagram (increased safety margin)
    const estimatedDiagramHeight = 90; // Increased estimated height needed
    if (this.currentY + estimatedDiagramHeight > this.pageHeight - this.margin - 25) {
      // Not enough space, start on new page
      this.pdf.addPage();
      this.currentY = this.margin;
      this.addHeader(this.quotationData);
      this.addQuoteInfo(this.quotationData);
      
      // Redraw section title
      this.pdf.setFillColor(...this.colors.primary);
      this.pdf.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 10, 'F');
      this.pdf.setFillColor(...this.colors.gold);
      this.pdf.rect(this.margin, this.currentY, 4, 10, 'F');
      this.pdf.setTextColor(...this.colors.white);
      this.pdf.setFontSize(12);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(`Window Specification ${index + 1}: ${windowName}`, this.margin + 8, this.currentY + 7);
      this.currentY += 15;
    }
    
    const actualStartY = this.currentY;
    
    // LEFT COLUMN: Diagram ONLY (with proper space management)
    await this.addWindowDiagramEnhanced(spec, leftColX, leftColWidth);
    
    // Store the Y position after diagram
    const afterDiagramY = this.currentY;
    
    // Reset Y to start for right column
    this.currentY = actualStartY;
    
    // RIGHT COLUMN TOP: Basic Info Table
    this.addBasicInfoTableEnhanced(spec, rightColX, rightColWidth);
    
    // RIGHT COLUMN MIDDLE: Specifications in two-column grid
    this.addSpecificationsTableEnhanced(spec, rightColX, rightColWidth);
    
    // RIGHT COLUMN BOTTOM: Computed Values & Pricing
    this.addComputedValuesEnhanced(spec, rightColX, rightColWidth, this.currentY);
    
    // Set currentY to the maximum of both columns with extra spacing
    this.currentY = Math.max(afterDiagramY, this.currentY) + 8;
  }

  /**
   * Add basic information table
   */
  addBasicInfoTable(spec) {
    const startY = this.currentY;
    const tableWidth = this.pageWidth - 2 * this.margin;
    const colWidth = tableWidth / 4;
    
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(...this.colors.text);
    
    // Safely extract values and convert to strings
    const id = String(spec.id || 'N/A');
    const type = this.formatWindowType(spec.type);
    const name = String(spec.name || 'N/A');
    const location = String(spec.location || 'N/A');
    const width = spec.dimensions && spec.dimensions.width ? `${spec.dimensions.width} mm` : '0 mm';
    const height = spec.dimensions && spec.dimensions.height ? `${spec.dimensions.height} mm` : '0 mm';
    
    const rows = [
      ['ID:', id, 'Type:', type],
      ['Name:', name, 'Location:', location],
      ['Width:', width, 'Height:', height]
    ];
    
    rows.forEach((row, rowIndex) => {
      const y = startY + (rowIndex * 7);
      
      // Draw cell backgrounds
      this.pdf.setFillColor(...this.colors.lightGray);
      this.pdf.rect(this.margin, y, colWidth, 7, 'F');
      this.pdf.rect(this.margin + colWidth * 2, y, colWidth, 7, 'F');
      
      // Draw borders
      this.pdf.setDrawColor(200, 200, 200);
      this.pdf.rect(this.margin, y, tableWidth, 7, 'S');
      
      // Add text - ensure all values are strings
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(String(row[0]), this.margin + 2, y + 5);
      this.pdf.text(String(row[2]), this.margin + colWidth * 2 + 2, y + 5);
      
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(String(row[1]), this.margin + colWidth + 2, y + 5);
      this.pdf.text(String(row[3]), this.margin + colWidth * 3 + 2, y + 5);
    });
    
    this.currentY = startY + (rows.length * 7) + 5;
  }

  /**
   * Add basic information table (enhanced)
   */
  addBasicInfoTableEnhanced(spec, startX, columnWidth) {
    // Extract dimensions safely - handle both old and new data structures
    const width = spec.dimensions?.width || spec.width || 0;
    const height = spec.dimensions?.height || spec.height || 0;
    const windowType = spec.type || spec.selectedWindowType || 'N/A';
    const openingType = spec.specifications?.openingType || spec.openingType || 'N/A';
    
    const tableData = [
      ['Window Type', this.formatWindowType(windowType)],
      ['Opening Type', String(openingType)],
      ['Dimensions', `${this.formatNumber(width)} × ${this.formatNumber(height)} mm`]
    ];
    
    this.pdf.setFillColor(245, 245, 245);
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.setLineWidth(0.1);
    
    const rowHeight = 7;
    const labelWidth = columnWidth * 0.4;
    const valueWidth = columnWidth * 0.6;
    
    tableData.forEach((row, index) => {
      const y = this.currentY + index * rowHeight;
      
      // Label cell
      this.pdf.rect(startX, y, labelWidth, rowHeight, 'S');
      this.pdf.setFillColor(240, 240, 240);
      this.pdf.rect(startX, y, labelWidth, rowHeight, 'F');
      this.pdf.setFontSize(9);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setTextColor(60, 60, 60);
      this.pdf.text(row[0], startX + 2, y + 5);
      
      // Value cell
      this.pdf.rect(startX + labelWidth, y, valueWidth, rowHeight, 'S');
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setTextColor(40, 40, 40);
      this.pdf.text(row[1], startX + labelWidth + 2, y + 5);
    });
    
    this.currentY += tableData.length * rowHeight + 5;
  }

  /**
   * Add window diagram visualization
   */
  async addWindowDiagram(spec) {
    // Create a temporary div to render the window shape
    const diagramDiv = document.createElement('div');
    diagramDiv.style.position = 'absolute';
    diagramDiv.style.left = '-9999px';
    diagramDiv.style.width = '300px';
    diagramDiv.style.height = '250px';
    diagramDiv.style.background = 'white';
    diagramDiv.style.padding = '20px';
    
    // Generate SVG for the window
    const svg = this.generateWindowSVG(spec);
    diagramDiv.innerHTML = svg;
    
    document.body.appendChild(diagramDiv);
    
    try {
      // Capture the diagram as canvas
      const canvas = await html2canvas(diagramDiv, {
        backgroundColor: '#ffffff',
        scale: 2
      });
      
      // Add to PDF
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 80;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Center the image
      const imgX = (this.pageWidth - imgWidth) / 2;
      this.pdf.addImage(imgData, 'PNG', imgX, this.currentY, imgWidth, imgHeight);
      
      this.currentY += imgHeight + 5;
    } catch (error) {
      console.error('Error adding diagram:', error);
      // Add placeholder text if diagram fails
      this.pdf.setFontSize(9);
      this.pdf.setTextColor(150, 150, 150);
      this.pdf.text('[Window Diagram]', this.pageWidth / 2, this.currentY, { align: 'center' });
      this.currentY += 10;
    } finally {
      document.body.removeChild(diagramDiv);
    }
  }

  /**
   * Generate SVG for window shape
   */
  generateWindowSVG(spec) {
    const { width, height } = spec.dimensions || { width: 1000, height: 1000 };
    const scale = Math.min(250 / Math.max(width, height), 0.25);
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;
    
    return `
      <svg width="300" height="250" xmlns="http://www.w3.org/2000/svg">
        <rect x="25" y="10" width="${scaledWidth}" height="${scaledHeight}" 
              fill="rgba(173, 216, 230, 0.3)" stroke="#333" stroke-width="3"/>
        <text x="150" y="230" text-anchor="middle" font-size="12" fill="#666">
          ${width} × ${height} mm
        </text>
      </svg>
    `;
  }

  /**
   * Add specifications table
   */
  addSpecificationsTable(spec) {
    const startY = this.currentY;
    const tableWidth = this.pageWidth - 2 * this.margin;
    
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(...this.colors.secondary);
    this.pdf.text('Specifications:', this.margin, this.currentY);
    this.currentY += 7;
    
    const specs = spec.specifications || {};
    
    // Safely extract values
    const glassType = this.formatGlassType(specs.glass);
    const frameMaterial = this.formatFrameMaterial(specs.frame?.material);
    const frameColor = String(specs.frame?.color || 'N/A');
    const lockPosition = String(specs.lockPosition || 'N/A');
    const panels = String(specs.panels || 'N/A');
    const tracks = String(specs.tracks || 'N/A');
    const grille = specs.grille?.enabled ? 
      `${String(specs.grille.style || 'standard')} - ${String(specs.grille.pattern || 'grid')}` : 
      'No grille';
    
    const specRows = [
      ['Glass Type:', glassType],
      ['Frame Material:', frameMaterial],
      ['Frame Color:', frameColor],
      ['Lock Position:', lockPosition],
      ['Panels:', panels],
      ['Tracks:', tracks],
      ['Grille:', grille]
    ];
    
    this.pdf.setFontSize(9);
    
    specRows.forEach((row, index) => {
      const y = this.currentY + (index * 6);
      
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setTextColor(...this.colors.text);
      this.pdf.text(String(row[0]), this.margin + 5, y);
      
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(String(row[1]), this.margin + 50, y);
    });
    
    this.currentY += (specRows.length * 6) + 5;
  }

  /**
   * Add computed values in a clean table format
   */
  addComputedValues(spec) {
    const startY = this.currentY;
    const tableWidth = this.pageWidth - 2 * this.margin;
    
    // Title
    this.pdf.setFillColor(...this.colors.secondary);
    this.pdf.rect(this.margin, this.currentY, tableWidth, 7, 'F');
    this.pdf.setTextColor(...this.colors.white);
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Computed Values & Pricing', this.margin + 3, this.currentY + 5);
    
    this.currentY += 10;
    
    const computed = spec.computedValues || {};
    const pricing = spec.pricing || {};
    
    const valueRows = [
      ['Square Feet per Window:', `${computed.sqFtPerWindow?.toFixed(3) || '0.000'} Sq.Ft.`],
      ['Base Price:', `Rs. ${pricing.basePrice?.toFixed(2) || '0.00'}`],
      ['Price per Sq.Ft:', `Rs. ${pricing.sqFtPrice?.toFixed(2) || '0.00'}`],
      ['Quantity:', `${pricing.quantity || 1} Pcs`],
      ['Total Price:', `Rs. ${computed.totalPrice?.toFixed(2) || '0.00'}`],
      ['Approximate Weight:', `${computed.weight?.toFixed(2) || '0.00'} KG`]
    ];
    
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(...this.colors.text);
    
    valueRows.forEach((row, index) => {
      const y = this.currentY + (index * 7);
      
      // Alternating row colors
      if (index % 2 === 0) {
        this.pdf.setFillColor(...this.colors.lightGray);
        this.pdf.rect(this.margin, y, tableWidth, 7, 'F');
      }
      
      // Draw border
      this.pdf.setDrawColor(200, 200, 200);
      this.pdf.rect(this.margin, y, tableWidth, 7, 'S');
      
      // Add text
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(row[0], this.margin + 3, y + 5);
      
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(row[1], this.margin + tableWidth - 3, y + 5, { align: 'right' });
    });
    
    this.currentY += (valueRows.length * 7) + 5;
  }

  /**
   * Add window diagram visualization (enhanced) - Captures real diagram with all configurations
   */
  async addWindowDiagramEnhanced(spec, startX, columnWidth) {
    // Calculate available space to ensure diagram fits without cutting
    const availableHeight = this.pageHeight - this.currentY - this.margin - 25; // Reserve extra space for footer and buffer
    
    // First, try to use the pre-captured diagram snapshot if available
    if (spec.diagramSnapshot) {
      try {
        const imgWidth = columnWidth - 4; // Minimal padding
        // Smart dynamic height with better balance
        let imgHeight = Math.min(
          70, // Slightly larger for better visibility
          imgWidth * 0.90, // Match original aspect ratio
          availableHeight * 0.70 // Conservative 70% usage
        );
        
        // Add the diagram image directly (as it appears in app)
        this.pdf.addImage(spec.diagramSnapshot, 'PNG', startX + 2, this.currentY, imgWidth, imgHeight);
        
        this.currentY += imgHeight + 10; // Spacing after diagram
        return;
      } catch (error) {
        console.warn('Error using pre-captured diagram snapshot, falling back to SVG generation:', error);
      }
    }
    
    // Fallback: Try to find and capture the actual WindowDiagram element on the page
    const diagramElement = document.querySelector('.window-diagram-container');
    
    if (diagramElement) {
      try {
        // Clone the diagram to avoid modifying the original
        const clonedDiagram = diagramElement.cloneNode(true);
        clonedDiagram.style.position = 'absolute';
        clonedDiagram.style.left = '-9999px';
        clonedDiagram.style.background = 'white';
        clonedDiagram.style.padding = '15px';
        clonedDiagram.style.border = '1px solid #ccc';
        clonedDiagram.style.borderRadius = '5px';
        
        document.body.appendChild(clonedDiagram);
        
        const canvas = await html2canvas(clonedDiagram, {
          backgroundColor: '#ffffff',
          scale: 4, // Ultra high quality capture
          logging: false,
          useCORS: true,
          allowTaint: false,
          removeContainer: true
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = columnWidth - 4; // Minimal padding
        const availableHeight = this.pageHeight - this.currentY - this.margin - 15;
        // Smart dynamic height with better balance
        let imgHeight = Math.min(
          (canvas.height * imgWidth) / canvas.width,
          70, // Slightly larger for better visibility
          availableHeight * 0.70 // Conservative 70% usage
        );
        
        // Add the diagram image directly (as it appears in app)
        this.pdf.addImage(imgData, 'PNG', startX + 2, this.currentY, imgWidth, imgHeight);
        this.currentY += imgHeight + 10;
        
        document.body.removeChild(clonedDiagram);
        return;
      } catch (error) {
        console.error('Error capturing live diagram:', error);
      }
    }
    
    // Second fallback: Generate SVG with complete configuration
    const diagramDiv = document.createElement('div');
    diagramDiv.style.position = 'absolute';
    diagramDiv.style.left = '-9999px';
    diagramDiv.style.width = `${columnWidth * 3}px`;
    diagramDiv.style.height = '220px'; // More height for SVG rendering
    diagramDiv.style.background = 'white';
    diagramDiv.style.padding = '15px';
    diagramDiv.style.border = '1px solid #ddd';
    diagramDiv.style.borderRadius = '5px';
    
    const svg = this.generateCompleteWindowSVG(spec);
    diagramDiv.innerHTML = svg;
    
    document.body.appendChild(diagramDiv);
    
    try {
      const canvas = await html2canvas(diagramDiv, {
        backgroundColor: '#ffffff',
        scale: 4, // Ultra high quality
        logging: false,
        allowTaint: false,
        removeContainer: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = columnWidth - 4; // Minimal padding
      const availableHeight = this.pageHeight - this.currentY - this.margin - 15;
      // Smart dynamic height with better balance
      let imgHeight = Math.min(
        (canvas.height * imgWidth) / canvas.width,
        70, // Slightly larger for better visibility
        availableHeight * 0.70 // Conservative 70% usage
      );
      
      // Add the diagram image directly (as it appears in app)
      this.pdf.addImage(imgData, 'PNG', startX + 2, this.currentY, imgWidth, imgHeight);
      this.currentY += imgHeight + 10;
    } catch (error) {
      console.error('Error adding diagram:', error);
      this.pdf.setFontSize(9);
      this.pdf.setTextColor(150, 150, 150);
      this.pdf.text('[Window Diagram]', startX + columnWidth / 2, this.currentY, { align: 'center' });
      this.currentY += 10;
    } finally {
      document.body.removeChild(diagramDiv);
    }
  }

  /**
   * Generate complete SVG for window shape with full configuration details
   */
  generateCompleteWindowSVG(spec) {
    const width = spec.dimensions?.width || spec.width || 1000;
    const height = spec.dimensions?.height || spec.height || 1000;
    const windowType = spec.type || spec.selectedWindowType || 'sliding';
    
    // Get specifications
    const specifications = spec.specifications || {};
    const glassType = specifications.glass || spec.glassType || 'single';
    const frameMaterial = specifications.frame?.material || spec.frameMaterial || 'aluminum';
    const frameColor = specifications.frame?.color || spec.frameColor || 'white';
    const grillType = specifications.grille?.style || spec.grilles || 'none';
    const panels = specifications.panels || spec.panels || 2;
    
    // Enhanced colors based on material and type
    const getFrameColor = () => {
      const materialColors = {
        aluminum: { white: '#F5F5F5', black: '#2C2C2C', brown: '#8B4513', grey: '#808080' },
        upvc: { white: '#FFFFFF', black: '#1C1C1C', brown: '#8B4513', grey: '#A9A9A9' },
        wooden: { white: '#FFF8DC', black: '#3C3C3C', brown: '#8B4513', grey: '#DCDCDC' }
      };
      return materialColors[frameMaterial]?.[frameColor] || '#F5F5F5';
    };
    
    const getGlassColor = () => {
      const glassColors = {
        single: '#E6F3FF',
        double: '#E8F4FD',
        triple: '#EAF5FE',
        'low-e': '#E6F9FF'
      };
      return glassColors[glassType] || '#E6F3FF';
    };
    
    const scale = Math.min(180 / Math.max(width, height), 0.18);
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;
    const frameThickness = 5;
    const actualFrameColor = getFrameColor();
    const actualGlassColor = getGlassColor();
    
    // Render grills function
    const renderGrills = (x, y, w, h) => {
      if (!grillType || grillType === 'none') return '';
      
      const grillColor = '#FFFFFF';
      const grillWidth = 1.2;
      
      switch (grillType) {
        case 'colonial':
          const cols = w > 80 ? 4 : 3;
          const rows = h > 120 ? 3 : 2;
          const cellWidth = w / cols;
          const cellHeight = h / rows;
          let grillsSVG = '';
          
          // Vertical lines
          for (let i = 1; i < cols; i++) {
            grillsSVG += `<line x1="${x + i * cellWidth}" y1="${y}" x2="${x + i * cellWidth}" y2="${y + h}" stroke="${grillColor}" stroke-width="${grillWidth}"/>`;
          }
          
          // Horizontal lines
          for (let i = 1; i < rows; i++) {
            grillsSVG += `<line x1="${x}" y1="${y + i * cellHeight}" x2="${x + w}" y2="${y + i * cellHeight}" stroke="${grillColor}" stroke-width="${grillWidth}"/>`;
          }
          
          return grillsSVG;
          
        case 'prairie':
          return `
            <line x1="${x + w/2}" y1="${y}" x2="${x + w/2}" y2="${y + h}" stroke="${grillColor}" stroke-width="${grillWidth}"/>
            <line x1="${x}" y1="${y + h/2}" x2="${x + w}" y2="${y + h/2}" stroke="${grillColor}" stroke-width="${grillWidth}"/>
          `;
          
        case 'georgian':
          return `
            <line x1="${x + w/3}" y1="${y}" x2="${x + w/3}" y2="${y + h}" stroke="${grillColor}" stroke-width="${grillWidth}"/>
            <line x1="${x + 2*w/3}" y1="${y}" x2="${x + 2*w/3}" y2="${y + h}" stroke="${grillColor}" stroke-width="${grillWidth}"/>
            <line x1="${x}" y1="${y + h/2}" x2="${x + w}" y2="${y + h/2}" stroke="${grillColor}" stroke-width="${grillWidth}"/>
          `;
          
        default:
          return '';
      }
    };
    
    // Generate SVG based on window type
    let windowSVG = '';
    
    if (windowType === 'sliding' || windowType === 'Sliding Windows') {
      const panelWidth = (scaledWidth - frameThickness * 2) / panels;
      
      windowSVG = `
        <!-- Outer frame -->
        <rect x="20" y="10" width="${scaledWidth}" height="${scaledHeight}" fill="${actualFrameColor}" stroke="${actualFrameColor}" stroke-width="2" rx="2"/>
        
        <!-- Panels -->
        ${Array.from({length: panels}, (_, i) => {
          const panelX = 20 + frameThickness + (i * panelWidth);
          const panelY = 10 + frameThickness;
          const panelH = scaledHeight - 2 * frameThickness;
          
          return `
            <!-- Panel ${i + 1} -->
            <rect x="${panelX}" y="${panelY}" width="${panelWidth - 1}" height="${panelH}" fill="${actualGlassColor}" stroke="#ccc" stroke-width="1"/>
            ${renderGrills(panelX + 2, panelY + 2, panelWidth - 5, panelH - 4)}
            
            <!-- Panel separator -->
            ${i < panels - 1 ? `<rect x="${panelX + panelWidth - 1}" y="${panelY}" width="2" height="${panelH}" fill="${actualFrameColor}"/>` : ''}
            
            <!-- Handle -->
            <circle cx="${panelX + panelWidth - 10}" cy="${panelY + panelH/2}" r="3" fill="#666" stroke="#333" stroke-width="0.5"/>
            
            <!-- Movement indicator -->
            <text x="${panelX + panelWidth/2}" y="${panelY + panelH/2}" text-anchor="middle" font-size="10" fill="#e74c3c" font-weight="bold">S</text>
          `;
        }).join('')}
        
        <!-- Bottom track -->
        <rect x="22" y="${10 + scaledHeight - frameThickness - 2}" width="${scaledWidth - 4}" height="2" fill="#999"/>
      `;
      
    } else if (windowType === 'casement' || windowType === 'Casement Windows') {
      windowSVG = `
        <!-- Outer frame -->
        <rect x="20" y="10" width="${scaledWidth}" height="${scaledHeight}" fill="${actualFrameColor}" stroke="${actualFrameColor}" stroke-width="2" rx="2"/>
        
        <!-- Glass -->
        <rect x="${20 + frameThickness}" y="${10 + frameThickness}" width="${scaledWidth - 2*frameThickness}" height="${scaledHeight - 2*frameThickness}" fill="${actualGlassColor}" stroke="#ccc" stroke-width="1"/>
        
        ${renderGrills(20 + frameThickness + 2, 10 + frameThickness + 2, scaledWidth - 2*frameThickness - 4, scaledHeight - 2*frameThickness - 4)}
        
        <!-- Hinges (left side) -->
        <rect x="22" y="25" width="4" height="8" fill="#666" rx="1"/>
        <rect x="22" y="${10 + scaledHeight/2 - 4}" width="4" height="8" fill="#666" rx="1"/>
        <rect x="22" y="${10 + scaledHeight - 33}" width="4" height="8" fill="#666" rx="1"/>
        
        <!-- Handle (right side) -->
        <circle cx="${20 + scaledWidth - 15}" cy="${10 + scaledHeight/2}" r="4" fill="#666" stroke="#333" stroke-width="1"/>
        <line x1="${20 + scaledWidth - 15}" y1="${10 + scaledHeight/2}" x2="${20 + scaledWidth - 12}" y2="${10 + scaledHeight/2 - 4}" stroke="#333" stroke-width="2"/>
      `;
      
    } else if (windowType === 'bay' || windowType === 'Bay Windows') {
      const angle = spec.bayConfig?.angle || 30;
      const angleRad = (angle * Math.PI) / 180;
      const cos = Math.cos(angleRad);
      const sin = Math.sin(angleRad);
      
      const centerX = scaledWidth / 2 + 20;
      const centerY = 15;
      const centerWidth = scaledWidth * 0.5;
      const sideWidth = scaledWidth * 0.25;
      const panelHeight = scaledHeight - 20;
      const depth = sideWidth * sin * 0.8;
      
      windowSVG = `
        <!-- Left angled panel -->
        <polygon points="${centerX - centerWidth/2 - depth},${centerY + depth} ${centerX - centerWidth/2},${centerY} ${centerX - centerWidth/2},${centerY + panelHeight} ${centerX - centerWidth/2 - depth},${centerY + panelHeight + depth}" fill="${actualFrameColor}" stroke="${actualFrameColor}" stroke-width="2"/>
        <polygon points="${centerX - centerWidth/2 - depth + frameThickness},${centerY + depth + frameThickness} ${centerX - centerWidth/2 - frameThickness},${centerY + frameThickness} ${centerX - centerWidth/2 - frameThickness},${centerY + panelHeight - frameThickness} ${centerX - centerWidth/2 - depth + frameThickness},${centerY + panelHeight + depth - frameThickness}" fill="${actualGlassColor}" stroke="#ccc" stroke-width="1"/>
        
        <!-- Center flat panel -->
        <rect x="${centerX - centerWidth/2}" y="${centerY}" width="${centerWidth}" height="${panelHeight}" fill="${actualFrameColor}" stroke="${actualFrameColor}" stroke-width="2"/>
        <rect x="${centerX - centerWidth/2 + frameThickness}" y="${centerY + frameThickness}" width="${centerWidth - 2*frameThickness}" height="${panelHeight - 2*frameThickness}" fill="${actualGlassColor}" stroke="#ccc" stroke-width="1"/>
        
        <!-- Right angled panel -->
        <polygon points="${centerX + centerWidth/2 - frameThickness},${centerY} ${centerX + centerWidth/2 + depth},${centerY + depth} ${centerX + centerWidth/2 + depth},${centerY + panelHeight + depth} ${centerX + centerWidth/2 - frameThickness},${centerY + panelHeight}" fill="${actualFrameColor}" stroke="${actualFrameColor}" stroke-width="2"/>
        <polygon points="${centerX + centerWidth/2},${centerY + frameThickness} ${centerX + centerWidth/2 + depth - frameThickness},${centerY + depth + frameThickness} ${centerX + centerWidth/2 + depth - frameThickness},${centerY + panelHeight + depth - frameThickness} ${centerX + centerWidth/2},${centerY + panelHeight - frameThickness}" fill="${actualGlassColor}" stroke="#ccc" stroke-width="1"/>
        
        <!-- Panel labels -->
        <text x="${centerX - centerWidth/2 - depth/2}" y="8" text-anchor="middle" font-size="9" fill="#333" font-weight="bold">1/4</text>
        <text x="${centerX}" y="8" text-anchor="middle" font-size="9" fill="#333" font-weight="bold">1/2</text>
        <text x="${centerX + centerWidth/2 + depth/2}" y="8" text-anchor="middle" font-size="9" fill="#333" font-weight="bold">1/4</text>
        
        <!-- Angle indicator -->
        <text x="${centerX - centerWidth/2 - depth - 15}" y="${centerY + panelHeight/2}" font-size="8" fill="#666">${angle}°</text>
      `;
      
    } else {
      // Default simple window
      windowSVG = `
        <rect x="20" y="10" width="${scaledWidth}" height="${scaledHeight}" fill="${actualFrameColor}" stroke="${actualFrameColor}" stroke-width="2" rx="2"/>
        <rect x="${20 + frameThickness}" y="${10 + frameThickness}" width="${scaledWidth - 2*frameThickness}" height="${scaledHeight - 2*frameThickness}" fill="${actualGlassColor}" stroke="#ccc" stroke-width="1"/>
        ${renderGrills(20 + frameThickness + 2, 10 + frameThickness + 2, scaledWidth - 2*frameThickness - 4, scaledHeight - 2*frameThickness - 4)}
      `;
    }
    
    return `
      <svg width="${scaledWidth + 40}" height="${scaledHeight + 50}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="windowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${actualGlassColor};stop-opacity:0.8" />
            <stop offset="100%" style="stop-color:${actualGlassColor};stop-opacity:1" />
          </linearGradient>
          <filter id="shadowEffect" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.2)"/>
          </filter>
        </defs>
        
        <g filter="url(#shadowEffect)">
          ${windowSVG}
        </g>
        
        <!-- Dimensions label -->
        <rect x="${(scaledWidth + 40) / 2 - 50}" y="${scaledHeight + 30}" width="100" height="16" fill="rgba(26,82,118,0.1)" stroke="#1a5276" stroke-width="1" rx="3"/>
        <text x="${(scaledWidth + 40) / 2}" y="${scaledHeight + 41}" text-anchor="middle" font-size="10" fill="#1a5276" font-weight="bold">
          ${width} × ${height} mm
        </text>
        
        <!-- Material & Glass Type indicators -->
        <text x="5" y="${scaledHeight + 20}" font-size="7" fill="#555">${this.formatFrameMaterial(frameMaterial)}</text>
        <text x="5" y="${scaledHeight + 30}" font-size="7" fill="#555">${this.formatGlassType(glassType)}</text>
      </svg>
    `;
  }

  /**
   * Add specifications table (enhanced with two-column grid)
   */
  addSpecificationsTableEnhanced(spec, startX, columnWidth) {
    // Extract specifications safely from either old or new data structure
    const specifications = spec.specifications || {};
    const glassType = specifications.glass || spec.glassType || 'single';
    const frameMaterial = specifications.frame?.material || spec.frameMaterial || 'aluminum';
    const frameColor = specifications.frame?.color || spec.frameColor || 'white';
    const lockPosition = specifications.lockPosition || spec.lockPosition || 'center';
    const openingType = specifications.openingType || spec.openingType || 'fixed';
    const grille = specifications.grille?.enabled ? 
      `${specifications.grille.style} grille` : 
      (spec.grille || 'No grille');
    
    const specs = [
      ['Glass Type', this.formatGlassType(glassType)],
      ['Frame Material', this.formatFrameMaterial(frameMaterial)],
      ['Frame Color', String(frameColor)],
      ['Lock Position', String(lockPosition)],
      ['Opening Type', String(openingType)],
      ['Grille', String(grille)]
    ];
    
    this.pdf.setFillColor(...this.colors.lightGray);
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.setLineWidth(0.1);
    
    const rowHeight = 7;
    const col1Width = columnWidth * 0.5 - 2;
    const col2Width = columnWidth * 0.5 - 2;
    
    // Header
    this.pdf.setFillColor(...this.colors.secondary);
    this.pdf.rect(startX, this.currentY, columnWidth, 8, 'F');
    this.pdf.setTextColor(...this.colors.white);
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Specifications', startX + 3, this.currentY + 5.5);
    this.currentY += 10;
    
    // Specs in two columns
    for (let i = 0; i < specs.length; i += 2) {
      const y = this.currentY + Math.floor(i / 2) * rowHeight;
      
      // Left pair
      if (specs[i]) {
        const x1 = startX;
        this.pdf.setFillColor(245, 245, 245);
        this.pdf.rect(x1, y, col1Width, rowHeight, 'FD');
        this.pdf.setFontSize(8);
        this.pdf.setFont('helvetica', 'bold');
        this.pdf.setTextColor(60, 60, 60);
        this.pdf.text(specs[i][0], x1 + 1.5, y + 5);
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.setTextColor(40, 40, 40);
        const val1 = this.pdf.splitTextToSize(specs[i][1], col1Width * 0.45);
        this.pdf.text(val1[0], x1 + col1Width * 0.5, y + 5);
      }
      
      // Right pair
      if (specs[i + 1]) {
        const x2 = startX + col1Width + 4;
        this.pdf.setFillColor(245, 245, 245);
        this.pdf.rect(x2, y, col2Width, rowHeight, 'FD');
        this.pdf.setFontSize(8);
        this.pdf.setFont('helvetica', 'bold');
        this.pdf.setTextColor(60, 60, 60);
        this.pdf.text(specs[i + 1][0], x2 + 1.5, y + 5);
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.setTextColor(40, 40, 40);
        const val2 = this.pdf.splitTextToSize(specs[i + 1][1], col2Width * 0.45);
        this.pdf.text(val2[0], x2 + col2Width * 0.5, y + 5);
      }
    }
    
    this.currentY += Math.ceil(specs.length / 2) * rowHeight + 5;
  }

  /**
   * Add computed values (enhanced for right column placement)
   */
  addComputedValuesEnhanced(spec, startX, columnWidth, startY) {
    let localY = startY;
    
    // Header
    this.pdf.setFillColor(...this.colors.accent);
    this.pdf.rect(startX, localY, columnWidth, 8, 'F');
    this.pdf.setTextColor(...this.colors.white);
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Pricing', startX + 3, localY + 5.5);
    localY += 10;
    
    // Extract data safely from both old and new structures
    const width = spec.dimensions?.width || spec.width || 0;
    const height = spec.dimensions?.height || spec.height || 0;
    const area = (width * height) / 92903; // mm² to sq.ft.
    const sqFtPrice = spec.pricing?.sqFtPrice || spec.sqFtPrice || 450;
    const quantity = spec.pricing?.quantity || spec.quantity || 1;
    const totalPrice = spec.computedValues?.totalPrice || spec.totalPrice || (area * sqFtPrice * quantity);
    
    const values = [
      ['Area', `${this.formatNumber(area)} Sq.Ft.`],
      ['Rate/Sq.Ft.', this.formatCurrency(sqFtPrice)],
      ['Quantity', `${quantity} Pcs`],
      ['Basic Value', this.formatCurrency(totalPrice)]
    ];
    
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.setLineWidth(0.1);
    
    values.forEach((row, index) => {
      const y = localY + index * 8;
      
      // Alternating colors
      if (index % 2 === 0) {
        this.pdf.setFillColor(250, 250, 250);
      } else {
        this.pdf.setFillColor(255, 255, 255);
      }
      this.pdf.rect(startX, y, columnWidth, 8, 'FD');
      
      this.pdf.setFontSize(9);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setTextColor(60, 60, 60);
      this.pdf.text(row[0], startX + 2, y + 5.5);
      
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setTextColor(40, 40, 40);
      this.pdf.text(row[1], startX + columnWidth - 2, y + 5.5, { align: 'right' });
    });
    
    // Grand total
    localY += values.length * 8 + 2;
    this.pdf.setFillColor(...this.colors.gold);
    this.pdf.rect(startX, localY, columnWidth, 10, 'F');
    this.pdf.setTextColor(...this.colors.white);
    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Total:', startX + 2, localY + 7);
    this.pdf.text(this.formatCurrency(totalPrice), startX + columnWidth - 2, localY + 7, { align: 'right' });
  }

  /**
   * Add quotation totals
   */
  addQuoteTotals(quotationData) {
    const startY = this.currentY;
    const tableWidth = this.pageWidth - 2 * this.margin;
    
    // Title section with gold accent
    this.pdf.setFillColor(...this.colors.primary);
    this.pdf.rect(this.margin, this.currentY, tableWidth, 12, 'F');
    
    this.pdf.setFillColor(...this.colors.gold);
    this.pdf.rect(this.margin, this.currentY, 5, 12, 'F');
    
    this.pdf.setTextColor(...this.colors.white);
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('QUOTATION SUMMARY', this.margin + 10, this.currentY + 8.5);
    
    this.currentY += 17;
    
    // Calculate totals with safe fallbacks
    const totalComponents = quotationData.windowSpecs.length || 0;
    const totalArea = quotationData.windowSpecs.reduce((sum, spec) => {
      // Handle both data structures
      const width = spec.dimensions?.width || spec.width || 0;
      const height = spec.dimensions?.height || spec.height || 0;
      const area = (width * height) / 92903; // mm² to sq.ft
      return sum + area;
    }, 0);
    
    const basicValue = quotationData.windowSpecs.reduce((sum, spec) => {
      // Try multiple paths for totalPrice
      const price = spec.computedValues?.totalPrice || spec.pricing?.totalPrice || spec.totalPrice || 0;
      return sum + price;
    }, 0);
    
    const transportCost = quotationData.transportCost || 1000;
    const loadingCost = quotationData.loadingCost || 1000;
    const subtotal = basicValue + transportCost + loadingCost;
    const gstRate = quotationData.gstRate || 0.18;
    const gst = subtotal * gstRate;
    const grandTotal = subtotal + gst;
    
    // Table header
    const colWidths = [35, 25, 30, 30, 30, 30, 35]; // Component, Area, Basic, Transport, Subtotal, GST, Total
    const headerLabels = ['Component', 'Area\n(Sq.Ft.)', 'Basic Value\n(Rs.)', 'Transport\n(Rs.)', 'Subtotal\n(Rs.)', `GST\n(${gstRate * 100}%)`, 'Grand Total\n(Rs.)'];
    
    this.pdf.setFillColor(...this.colors.secondary);
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.setLineWidth(0.2);
    
    let xPos = this.margin;
    headerLabels.forEach((label, i) => {
      this.pdf.rect(xPos, this.currentY, colWidths[i], 12, 'FD');
      this.pdf.setTextColor(...this.colors.white);
      this.pdf.setFontSize(8);
      this.pdf.setFont('helvetica', 'bold');
      const lines = label.split('\n');
      const yOffset = lines.length === 1 ? 8 : 6;
      lines.forEach((line, idx) => {
        this.pdf.text(line, xPos + colWidths[i] / 2, this.currentY + yOffset + (idx * 4), { align: 'center' });
      });
      xPos += colWidths[i];
    });
    
    this.currentY += 14;
    
    // Summary row
    const summaryData = [
      `${totalComponents} Pcs`,
      this.formatNumber(totalArea),
      this.formatCurrency(basicValue),
      this.formatCurrency(transportCost),
      this.formatCurrency(subtotal),
      this.formatCurrency(gst),
      this.formatCurrency(grandTotal)
    ];
    
    this.pdf.setFillColor(250, 250, 250);
    xPos = this.margin;
    summaryData.forEach((value, i) => {
      this.pdf.rect(xPos, this.currentY, colWidths[i], 10, 'FD');
      this.pdf.setTextColor(40, 40, 40);
      this.pdf.setFontSize(9);
      this.pdf.setFont('helvetica', i === summaryData.length - 1 ? 'bold' : 'normal');
      this.pdf.text(String(value), xPos + colWidths[i] / 2, this.currentY + 7, { align: 'center' });
      xPos += colWidths[i];
    });
    
    this.currentY += 12;
    
    // Grand total highlight box
    const gtBoxWidth = 80;
    const gtBoxX = this.pageWidth - this.margin - gtBoxWidth;
    
    this.pdf.setFillColor(...this.colors.gold);
    this.pdf.roundedRect(gtBoxX, this.currentY, gtBoxWidth, 14, 2, 2, 'F');
    
    this.pdf.setTextColor(...this.colors.white);
    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('GRAND TOTAL:', gtBoxX + 4, this.currentY + 6);
    this.pdf.setFontSize(13);
    this.pdf.text(this.formatCurrency(grandTotal), gtBoxX + gtBoxWidth - 4, this.currentY + 10, { align: 'right' });
    
    this.currentY += 20;
  }

  /**
   * Add terms and conditions (enhanced with better formatting)
   */
  addTermsAndConditions() {
    this.currentY += 10;
    
    // Section header with gold accent
    this.pdf.setFillColor(...this.colors.secondary);
    this.pdf.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 9, 'F');
    
    this.pdf.setFillColor(...this.colors.gold);
    this.pdf.rect(this.margin, this.currentY, 4, 9, 'F');
    
    this.pdf.setTextColor(...this.colors.white);
    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Terms & Conditions', this.margin + 8, this.currentY + 6.5);
    
    this.currentY += 14;
    
    const terms = [
      'Payment: 50% advance, 50% on delivery',
      'Delivery: 15-20 working days from order confirmation',
      'Installation charges are separate and will be quoted upon request',
      'Warranty: 1 year on manufacturing defects',
      'Prices are subject to change without prior notice',
      'This quotation is valid for 30 days from the date of issue'
    ];
    
    this.pdf.setFontSize(10); // Increased to 10pt
    this.pdf.setTextColor(60, 60, 60);
    this.pdf.setFont('helvetica', 'normal');
    
    terms.forEach((term, index) => {
      // Draw a filled circle as bullet point
      this.pdf.setFillColor(60, 60, 60);
      this.pdf.circle(this.margin + 3.5, this.currentY - 1.5, 1, 'F');
      
      // Term text with justified alignment
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setFontSize(10);
      const maxWidth = this.pageWidth - 2 * this.margin - 12;
      const lines = this.pdf.splitTextToSize(term, maxWidth);
      
      lines.forEach((line, idx) => {
        this.pdf.text(line, this.margin + 10, this.currentY + (idx * 6));
      });
      
      // Better spacing with 1.3x line height
      this.currentY += Math.max(lines.length * 6, 8);
    });
    
    this.currentY += 10;
    
    // Signature section with improved layout
    const sigBoxWidth = 70;
    const sigBoxX = this.pageWidth - this.margin - sigBoxWidth;
    
    this.pdf.setDrawColor(...this.colors.secondary);
    this.pdf.setLineWidth(0.5);
    this.pdf.setFillColor(250, 250, 250);
    this.pdf.roundedRect(sigBoxX, this.currentY, sigBoxWidth, 25, 2, 2, 'FD');
    
    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'italic');
    this.pdf.setTextColor(80, 80, 80);
    this.pdf.text('For ADS SYSTEMS', sigBoxX + 4, this.currentY + 6);
    
    this.pdf.setDrawColor(150, 150, 150);
    this.pdf.setLineWidth(0.3);
    this.pdf.line(sigBoxX + 4, this.currentY + 18, sigBoxX + sigBoxWidth - 4, this.currentY + 18);
    
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(8);
    this.pdf.text('Authorized Signatory', sigBoxX + 4, this.currentY + 22);
  }

  /**
   * Add page numbers and footer to all pages (enhanced with tagline)
   */
  addPageNumbers() {
    const pageCount = this.pdf.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.pdf.setPage(i);
      
      // Footer separator line with gold accent
      this.pdf.setDrawColor(200, 200, 200);
      this.pdf.setLineWidth(0.3);
      this.pdf.line(this.margin, this.pageHeight - 15, this.pageWidth - this.margin, this.pageHeight - 15);
      
      this.pdf.setDrawColor(...this.colors.gold);
      this.pdf.setLineWidth(0.8);
      this.pdf.line(this.margin, this.pageHeight - 14.5, this.margin + 30, this.pageHeight - 14.5);
      
      // Company tagline (left)
      this.pdf.setFontSize(8);
      this.pdf.setFont('helvetica', 'italic');
      this.pdf.setTextColor(100, 100, 100);
      this.pdf.text('ADS Systems – Crafted for Perfection', this.margin, this.pageHeight - 8);
      
      // Page number (center)
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setTextColor(120, 120, 120);
      const pageText = `Page ${i} of ${pageCount}`;
      this.pdf.text(pageText, this.pageWidth / 2, this.pageHeight - 8, { align: 'center' });
      
      // Date (right)
      const today = new Date().toLocaleDateString('en-IN');
      this.pdf.text(today, this.pageWidth - this.margin, this.pageHeight - 8, { align: 'right' });
    }
  }

  // Helper formatting functions
  formatWindowType(type) {
    // Handle null, undefined, or object types
    if (!type) return 'N/A';
    if (typeof type === 'object') return 'Custom Window';
    
    const typeStr = String(type).toLowerCase();
    const types = {
      sliding: 'Sliding Window',
      casement: 'Casement Window',
      bay: 'Bay Window',
      fixed: 'Fixed Window',
      awning: 'Awning Window',
      picture: 'Picture Window',
      doublehung: 'Double Hung Window',
      singlehung: 'Single Hung Window',
      pivot: 'Pivot Window'
    };
    return types[typeStr] || String(type) || 'N/A';
  }

  formatGlassType(glass) {
    if (!glass) return 'N/A';
    if (typeof glass === 'object') return 'N/A';
    const glassStr = String(glass);
    return glassStr.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatFrameMaterial(material) {
    if (!material) return 'N/A';
    if (typeof material === 'object') return 'N/A';
    const materialStr = String(material);
    return materialStr.charAt(0).toUpperCase() + materialStr.slice(1);
  }

  /**
   * Add a subtle horizontal divider between sections
   */
  addSectionDivider() {
    this.currentY += 5;
    this.pdf.setDrawColor(220, 220, 220);
    this.pdf.setLineWidth(0.3);
    const lineWidth = this.pageWidth - 2 * this.margin;
    this.pdf.line(this.margin, this.currentY, this.margin + lineWidth, this.currentY);
    this.currentY += 8;
  }

  /**
   * Format currency with proper symbol and thousand separators
   * @param {number} amount - Amount to format
   * @returns {string} Formatted currency string like "Rs. 23,650.00"
   */
  formatCurrency(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return 'Rs. 0.00';
    }
    const num = parseFloat(amount);
    // Format with Indian numbering system (lakhs, crores)
    return 'Rs. ' + num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  /**
   * Format number with thousand separators
   */
  formatNumber(num) {
    if (num === null || num === undefined || isNaN(num)) {
      return '0';
    }
    return parseFloat(num).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}

// Export a singleton instance
const pdfGenerator = new QuotationPDFGenerator();

/**
 * Main export function for easy use in components
 * @param {Object} quotationData - The quotation data to generate PDF from
 * @returns {Promise<Object>} Result object with success status
 */
export const generateQuotationPDF = async (quotationData) => {
  if (!quotationData || !quotationData.windowSpecs || quotationData.windowSpecs.length === 0) {
    return {
      success: false,
      error: 'No window specifications found. Please add at least one window to generate PDF.'
    };
  }

  return await pdfGenerator.generatePDF(quotationData);
};

export default pdfGenerator;
