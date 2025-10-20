# PDF Generation System - Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                              │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │              QuotationPage.js Component                       │ │
│  │                                                               │ │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐    │ │
│  │  │ Client      │  │ Window Form  │  │  Action Buttons  │    │ │
│  │  │ Selection   │  │ - Type       │  │  ┌────────────┐  │    │ │
│  │  │ - Name      │  │ - Dimensions │  │  │ 📄 Download│  │    │ │
│  │  │ - Address   │  │ - Glass      │  │  │    PDF     │  │    │ │
│  │  └─────────────┘  │ - Frame      │  │  └────────────┘  │    │ │
│  │                   │ - Pricing    │  │  ┌────────────┐  │    │ │
│  │                   └──────────────┘  │  │ 💾 Save    │  │    │ │
│  │                                     │  │ Quotation  │  │    │ │
│  │  ┌──────────────────────────────┐  │  └────────────┘  │    │ │
│  │  │  Added Windows List          │  │                   │    │ │
│  │  │  - W1: Living Room [Edit]    │  └──────────────────┘    │ │
│  │  │  - W2: Bedroom [Edit]        │                          │ │
│  │  └──────────────────────────────┘                          │ │
│  │                                                             │ │
│  │  STATE: quotationData {                                    │ │
│  │    quotationNumber, project, date,                         │ │
│  │    companyDetails, clientDetails,                          │ │
│  │    windowSpecs: [ {...}, {...}, ... ]                      │ │
│  │  }                                                          │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ onClick="handleDownloadPDF()"
                              │ Passes: quotationData
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      PDF GENERATOR UTILITY                          │
│                   (utils/pdfGenerator.js)                           │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  generateQuotationPDF(quotationData)                          │ │
│  │  ├─ Validates input data                                      │ │
│  │  ├─ Creates new jsPDF instance                                │ │
│  │  └─ Returns: { success, fileName, error }                     │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                              │                                      │
│                              ▼                                      │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  QuotationPDFGenerator Class                                  │ │
│  │                                                               │ │
│  │  Properties:                                                  │ │
│  │  ├─ pdf: jsPDF instance                                       │ │
│  │  ├─ pageWidth: 210mm (A4)                                     │ │
│  │  ├─ pageHeight: 297mm (A4)                                    │ │
│  │  ├─ margin: 15mm                                              │ │
│  │  ├─ currentY: current vertical position                       │ │
│  │  └─ colors: { primary, secondary, accent, ... }               │ │
│  │                                                               │ │
│  │  Methods (in execution order):                                │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │ 1. generatePDF(quotationData)                           │ │ │
│  │  │    ├─ Initialize PDF document                           │ │ │
│  │  │    ├─ Add page 1 content                                │ │ │
│  │  │    ├─ Loop through windows                              │ │ │
│  │  │    ├─ Add summary page                                  │ │ │
│  │  │    ├─ Add page numbers                                  │ │ │
│  │  │    └─ Save PDF file                                     │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  │                                                               │ │
│  │  Page Building Methods:                                       │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │ 2. addHeader(quotationData)                             │ │ │
│  │  │    └─ Company name, contact info (blue header)          │ │ │
│  │  ├─────────────────────────────────────────────────────────┤ │ │
│  │  │ 3. addQuoteInfo(quotationData)                          │ │ │
│  │  │    └─ Quote #, project, date (gray bar)                 │ │ │
│  │  ├─────────────────────────────────────────────────────────┤ │ │
│  │  │ 4. addClientDetails(quotationData)                      │ │ │
│  │  │    └─ To: [Client name & address]                       │ │ │
│  │  ├─────────────────────────────────────────────────────────┤ │ │
│  │  │ 5. addIntroduction()                                    │ │ │
│  │  │    └─ Professional greeting & overview                  │ │ │
│  │  ├─────────────────────────────────────────────────────────┤ │ │
│  │  │ 6. addWindowSpecification(spec, index) [LOOP]           │ │ │
│  │  │    ├─ addBasicInfoTable(spec)                           │ │ │
│  │  │    ├─ addWindowDiagram(spec) ← uses html2canvas         │ │ │
│  │  │    ├─ addSpecificationsTable(spec)                      │ │ │
│  │  │    └─ addComputedValues(spec)                           │ │ │
│  │  ├─────────────────────────────────────────────────────────┤ │ │
│  │  │ 7. addQuoteTotals(quotationData)                        │ │ │
│  │  │    └─ Components, area, costs, GST, grand total         │ │ │
│  │  ├─────────────────────────────────────────────────────────┤ │ │
│  │  │ 8. addTermsAndConditions()                              │ │ │
│  │  │    └─ Payment, delivery, warranty terms                 │ │ │
│  │  ├─────────────────────────────────────────────────────────┤ │ │
│  │  │ 9. addPageNumbers()                                     │ │ │
│  │  │    └─ Footer on all pages (Page X of Y)                 │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  │                                                               │ │
│  │  Helper Methods:                                              │ │
│  │  ├─ generateWindowSVG(spec) → SVG string                      │ │
│  │  ├─ formatWindowType(type) → "Sliding Window"                │ │
│  │  ├─ formatGlassType(glass) → "Clear 5mm"                      │ │
│  │  └─ formatFrameMaterial(material) → "Aluminum"               │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ Uses Libraries
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL LIBRARIES                             │
│                                                                     │
│  ┌──────────────────────┐        ┌──────────────────────┐          │
│  │       jsPDF          │        │    html2canvas       │          │
│  │  ┌────────────────┐  │        │  ┌────────────────┐  │          │
│  │  │ PDF Creation   │  │        │  │ SVG to Image   │  │          │
│  │  │ Text Drawing   │  │        │  │ Canvas Render  │  │          │
│  │  │ Tables         │  │        │  │ High Quality   │  │          │
│  │  │ Shapes         │  │        │  │ 2x Scale       │  │          │
│  │  │ Colors         │  │        │  └────────────────┘  │          │
│  │  │ Multi-page     │  │        │                      │          │
│  │  │ Save/Download  │  │        │                      │          │
│  │  └────────────────┘  │        └──────────────────────┘          │
│  └──────────────────────┘                                          │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ Generates & Downloads
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         OUTPUT (PDF FILE)                           │
│                                                                     │
│  📄 Quotation_QT-1729434567890_2025-10-20.pdf                      │
│                                                                     │
│  Size: ~500KB - 5MB (depending on # of windows)                    │
│  Format: PDF/A4                                                    │
│  Pages: 3-50+ (varies with window count)                           │
│  Quality: Print-ready, Client-ready                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
┌────────────┐
│    USER    │
└─────┬──────┘
      │ 1. Fills form
      │ 2. Clicks "Download PDF"
      ▼
┌─────────────────────┐
│  QuotationPage.js   │
│  ┌────────────────┐ │
│  │ quotationData  │ │ ← State with all form data
│  └────────────────┘ │
└─────────┬───────────┘
          │ 3. handleDownloadPDF()
          │    calls generateQuotationPDF(quotationData)
          ▼
┌──────────────────────────┐
│  pdfGenerator.js         │
│  ┌─────────────────────┐ │
│  │ Validation          │ │ ← Check windows exist, client filled
│  │ ├─ Has windows?     │ │
│  │ └─ Has client?      │ │
│  └─────────────────────┘ │
│           │               │
│           ▼               │
│  ┌─────────────────────┐ │
│  │ Create PDF          │ │
│  │ ├─ Initialize       │ │
│  │ ├─ Add header       │ │ ← Company branding
│  │ ├─ Add quote info   │ │ ← Quote #, date, project
│  │ ├─ Add client       │ │ ← Client details
│  │ ├─ Add intro        │ │ ← Professional text
│  │ └─ Loop windows     │ │─┐
│  └─────────────────────┘ │ │
│           │               │ │
│           │ For each      │ │
│           │ window:       │ │
│           ▼               │ │
│  ┌─────────────────────┐ │◄┘
│  │ Add Window Page     │ │
│  │ ├─ Basic info table │ │ ← ID, type, size
│  │ ├─ Diagram (SVG)    │ │ ← Visual representation
│  │ ├─ Specifications   │ │ ← Glass, frame, etc.
│  │ └─ Pricing table    │ │ ← Costs, sq.ft., total
│  └─────────────────────┘ │
│           │               │
│           ▼               │
│  ┌─────────────────────┐ │
│  │ Add Summary Page    │ │
│  │ ├─ Total components │ │
│  │ ├─ Total area       │ │
│  │ ├─ Costs breakdown  │ │
│  │ ├─ GST calculation  │ │
│  │ └─ Grand total      │ │ ← Highlighted
│  └─────────────────────┘ │
│           │               │
│           ▼               │
│  ┌─────────────────────┐ │
│  │ Add Terms & Sign    │ │
│  │ ├─ T&C list         │ │
│  │ └─ Signature space  │ │
│  └─────────────────────┘ │
│           │               │
│           ▼               │
│  ┌─────────────────────┐ │
│  │ Finalize            │ │
│  │ ├─ Add page numbers │ │ ← All pages
│  │ ├─ Add footers      │ │ ← Date, company
│  │ └─ Save file        │ │
│  └─────────────────────┘ │
└───────────┬──────────────┘
            │ 4. Returns { success, fileName }
            ▼
┌──────────────────────┐
│  QuotationPage.js    │
│  ┌────────────────┐  │
│  │ handleResponse │  │
│  │ ├─ Success?    │  │
│  │ │  └─ Alert ✓  │  │
│  │ └─ Error?      │  │
│  │    └─ Alert ✗  │  │
│  └────────────────┘  │
└──────────┬───────────┘
           │ 5. PDF downloaded
           ▼
┌─────────────────────┐
│  USER'S DOWNLOADS   │
│  📄 Quotation_....  │
│     .pdf            │
└─────────────────────┘
```

---

## Component Interaction

```
┌──────────────────────────────────────────────────────────┐
│                   QuotationPage.js                       │
│                                                          │
│  State Management:                                       │
│  ├─ [quotationData, setQuotationData]                   │
│  ├─ [currentWindow, setCurrentWindow]                   │
│  ├─ [clients, setClients]                               │
│  └─ [inventory, setInventory]                           │
│                                                          │
│  Event Handlers:                                         │
│  ├─ handleDownloadPDF() ← NEW ✨                         │
│  ├─ saveQuotation()                                      │
│  ├─ addWindowToQuote()                                   │
│  ├─ editWindow()                                         │
│  └─ removeWindow()                                       │
│                                                          │
│  Imports:                                                │
│  ├─ ClientService                                        │
│  ├─ InventoryService                                     │
│  └─ generateQuotationPDF ← NEW ✨                        │
└───────────────────────┬──────────────────────────────────┘
                        │
                        │ Independent, no coupling
                        │
┌───────────────────────▼──────────────────────────────────┐
│              utils/pdfGenerator.js                       │
│                                                          │
│  Exports:                                                │
│  ├─ generateQuotationPDF(quotationData) ← Main function │
│  └─ pdfGenerator ← Singleton instance                    │
│                                                          │
│  Internal Class:                                         │
│  └─ QuotationPDFGenerator                                │
│     ├─ No external dependencies                          │
│     ├─ Pure PDF logic                                    │
│     └─ Self-contained                                    │
│                                                          │
│  Libraries Used:                                         │
│  ├─ jsPDF (npm package)                                  │
│  └─ html2canvas (npm package)                            │
└──────────────────────────────────────────────────────────┘
```

---

## File Structure Tree

```
CRM/
├── frontend/
│   ├── src/
│   │   ├── QuotationPage.js ⚙️ (Modified)
│   │   │   └── Imports: generateQuotationPDF
│   │   │   └── Added: handleDownloadPDF()
│   │   │   └── Added: "Download PDF" button
│   │   │
│   │   ├── utils/
│   │   │   └── pdfGenerator.js ✨ (NEW)
│   │   │       └── Class: QuotationPDFGenerator
│   │   │       └── Export: generateQuotationPDF()
│   │   │
│   │   ├── services/
│   │   │   ├── ClientService.js
│   │   │   └── InventoryService.js
│   │   │
│   │   └── QuotationPage.css
│   │
│   ├── package.json ⚙️ (Modified)
│   │   └── Added: jspdf, html2canvas
│   │
│   └── node_modules/
│       ├── jspdf/
│       └── html2canvas/
│
├── PDF_GENERATION_DOCUMENTATION.md ✨ (NEW)
├── PDF_USER_GUIDE.md ✨ (NEW)
├── PDF_QUICK_REFERENCE.md ✨ (NEW)
├── IMPLEMENTATION_SUMMARY.md ✨ (NEW)
└── PDF_ARCHITECTURE.md ✨ (THIS FILE)

Legend:
✨ = New file created
⚙️ = Existing file modified
```

---

## Execution Flow Timeline

```
Time →
│
├─ User clicks "Download PDF"
│  └─ Event: onClick
│     └─ Calls: handleDownloadPDF()
│
├─ Validation checks
│  ├─ Has windows? ✓
│  └─ Has client? ✓
│
├─ Call PDF generator
│  └─ await generateQuotationPDF(quotationData)
│
├─ PDF Generation starts (in pdfGenerator.js)
│  │
│  ├─ Initialize: new jsPDF()
│  │  └─ Time: ~5ms
│  │
│  ├─ Page 1: Introduction
│  │  ├─ Add header (50ms)
│  │  ├─ Add quote info (20ms)
│  │  ├─ Add client (30ms)
│  │  └─ Add intro text (40ms)
│  │
│  ├─ Window Pages (loop)
│  │  ├─ Window 1
│  │  │  ├─ New page (10ms)
│  │  │  ├─ Header (50ms)
│  │  │  ├─ Basic table (60ms)
│  │  │  ├─ Diagram rendering (200ms) ← html2canvas
│  │  │  ├─ Specs table (80ms)
│  │  │  └─ Values table (70ms)
│  │  │
│  │  ├─ Window 2
│  │  │  └─ ... (same)
│  │  │
│  │  └─ Window N
│  │     └─ ... (same)
│  │
│  ├─ Summary Page
│  │  ├─ New page (10ms)
│  │  ├─ Header (50ms)
│  │  ├─ Totals table (100ms)
│  │  └─ Terms (60ms)
│  │
│  ├─ Add page numbers to all pages (30ms)
│  │
│  └─ Save PDF (100ms)
│     └─ Triggers browser download
│
├─ Return result
│  └─ { success: true, fileName: "..." }
│
├─ Show alert
│  └─ "PDF generated successfully"
│
└─ PDF downloaded to user's computer
   └─ Total time: ~1-3 seconds (depending on # of windows)
```

---

## Error Handling Flow

```
User Action
    │
    ├─────────────────────────────────────┐
    │                                     │
    ▼                                     ▼
No Windows?                          No Client?
    │                                     │
    └─► Alert: "Add windows"              └─► Alert: "Select client"
         ↓                                     ↓
       STOP                                 STOP

    ▼
All Valid
    │
    ├─ Try PDF Generation
    │
    ├─────────────────────────────────────┐
    │                                     │
    ▼                                     ▼
Success?                             Error?
    │                                     │
    ├─► Return { success: true }          ├─► Catch error
    │   Alert: "PDF generated"            │   Console.error()
    │   ↓                                 │   Return { success: false, error }
    │   Download PDF                      │   Alert: "Error occurred"
    │                                     │   ↓
    │                                     │   User can retry
    │                                     │
    └─────────────────────────────────────┘
```

---

**Document Version**: 1.0  
**Date**: October 20, 2025  
**Status**: Complete ✅
