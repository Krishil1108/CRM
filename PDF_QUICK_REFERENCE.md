# PDF Generation - Quick Reference Card

## 🎯 Quick Access

**Location**: Windows CRM → Quotation Page → "📄 Download PDF" button

---

## 📋 Before Generating PDF - Checklist

- [ ] Client name entered
- [ ] Client address filled
- [ ] At least one window added
- [ ] All window specifications complete
- [ ] Pricing verified
- [ ] Project name entered (optional)

---

## 🔘 How to Generate PDF

```
1. Fill client details
   ↓
2. Add window specifications
   ↓
3. Click "📄 Download PDF"
   ↓
4. PDF automatically downloads
```

---

## 📄 What's in the PDF?

| Section | Content |
|---------|---------|
| **Header** | Company name, contact info, GSTIN |
| **Quote Info** | Quote #, Project, Date |
| **Client** | Name, Address |
| **Introduction** | Professional greeting & overview |
| **Windows** | Each window on separate page with diagram |
| **Specifications** | Glass, frame, color, size, etc. |
| **Pricing** | Per-window and total pricing |
| **Summary** | Components, area, costs, GST, total |
| **Terms** | Payment, delivery, warranty |
| **Footer** | Page numbers, date, company |

---

## 🎨 PDF Layout

```
Page 1: Introduction + First Window
Page 2-N: Additional Windows (one per page)
Final Page: Summary + Terms & Conditions
```

---

## 💾 File Naming Format

```
Quotation_[QuoteNumber]_[Date].pdf

Example:
Quotation_QT-1729434567890_2025-10-20.pdf
```

---

## ⚠️ Common Alerts

| Alert | Meaning | Solution |
|-------|---------|----------|
| "Please add at least one window..." | No windows in quotation | Add a window specification |
| "Please select a client..." | No client details | Fill in client name |
| "PDF generated successfully..." | ✅ Success | PDF downloaded |
| "Error generating PDF..." | ❌ Error occurred | Try again or check console |

---

## 🛠️ Developer Reference

### Import
```javascript
import { generateQuotationPDF } from './utils/pdfGenerator';
```

### Usage
```javascript
const result = await generateQuotationPDF(quotationData);
```

### Response
```javascript
{
  success: true/false,
  fileName: "Quotation_xxx.pdf",
  error: "error message" (if failed)
}
```

---

## 📊 Data Structure Expected

```javascript
quotationData = {
  quotationNumber: "QT-123",
  project: "Project Name",
  date: "20/10/2025",
  companyDetails: {
    name: "ADS SYSTEMS",
    phone: "9574544012",
    email: "support@adssystem.co.in",
    website: "adssystem.co.in",
    gstin: "24APJPP8011N1ZK"
  },
  clientDetails: {
    name: "Client Name",
    address: "Full Address"
  },
  windowSpecs: [
    {
      id: "W1",
      type: "sliding",
      name: "Living Room Window",
      location: "Living Room",
      dimensions: {
        width: 1200,
        height: 1000
      },
      specifications: {
        glass: "clear-5mm",
        frame: {
          material: "aluminum",
          color: "white"
        },
        panels: 2,
        tracks: 1,
        // ... more specs
      },
      pricing: {
        basePrice: 5000,
        sqFtPrice: 450,
        quantity: 1
      },
      computedValues: {
        sqFtPerWindow: 10.764,
        totalPrice: 9843.80,
        weight: 161.46
      }
    }
    // ... more windows
  ]
}
```

---

## 🎨 Color Codes

| Element | Color | RGB |
|---------|-------|-----|
| Header | Blue | 41, 128, 185 |
| Titles | Dark Gray | 52, 73, 94 |
| Highlight | Red | 231, 76, 60 |
| Text | Dark | 44, 62, 80 |
| Background | Light Gray | 236, 240, 241 |

---

## 📐 Technical Specs

- **Format**: PDF (A4)
- **Size**: 210mm × 297mm
- **Margins**: 15mm all sides
- **Font**: Helvetica
- **Resolution**: High (2x scale)
- **Encoding**: UTF-8
- **Libraries**: jsPDF, html2canvas

---

## 🔧 Troubleshooting

### PDF not downloading?
1. Check browser download settings
2. Disable pop-up blocker
3. Try different browser
4. Check disk space

### Missing data in PDF?
- Fill all fields in form
- "N/A" appears for empty fields
- Verify client details

### Error generating PDF?
1. Check console (F12)
2. Verify data structure
3. Refresh page
4. Contact support

---

## ✅ Features

- ✅ Multi-page support
- ✅ Professional layout
- ✅ Auto page numbers
- ✅ Company branding
- ✅ Window diagrams
- ✅ Complete pricing
- ✅ Terms & conditions
- ✅ Auto-naming
- ✅ Error handling
- ✅ Data validation

---

## 📞 Support

**Documentation**:
- `PDF_GENERATION_DOCUMENTATION.md` - Full technical docs
- `PDF_USER_GUIDE.md` - Detailed user guide
- `IMPLEMENTATION_SUMMARY.md` - Complete implementation details

**Need Help?**
Check browser console (F12) for error details

---

## 🎉 Quick Win

**Fastest Way to Generate PDF**:
1. Select existing client
2. Add one window
3. Click "📄 Download PDF"
4. Done! ✅

---

**Version**: 1.0.0  
**Date**: October 20, 2025  
**Status**: Production Ready ✅
