# Generate PDF Resume Instructions

## Method 1: Browser Print (Recommended)

1. **Open the resume file:**
   ```bash
   open resume.html
   ```

2. **In your browser:**
   - Press `Cmd+P` (Mac) or `Ctrl+P` (Windows)
   - Select "Save as PDF"
   - Choose "More settings"
   - Set margins to "Minimum"
   - Ensure "Background graphics" is checked
   - Save as `ryan-lingo-resume.pdf`

3. **Replace the old resume:**
   ```bash
   mv ryan-lingo-resume.pdf assets/documents/
   ```

## Method 2: Using Puppeteer (Advanced)

If you have Node.js installed:

```bash
# Install puppeteer
npm install puppeteer

# Create conversion script
node -e "
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('file://' + __dirname + '/resume.html');
  await page.pdf({
    path: 'assets/documents/ryan-lingo-resume.pdf',
    format: 'Letter',
    margin: { top: '0.5in', bottom: '0.5in', left: '0.5in', right: '0.5in' },
    printBackground: true
  });
  await browser.close();
})();
"
```

## Method 3: Online Converter

1. Upload `resume.html` to:
   - [HTML to PDF Converter](https://www.ilovepdf.com/html-to-pdf)
   - [PDF24](https://tools.pdf24.org/en/html-to-pdf)

2. Download and save to `assets/documents/`

## Resume Features

### ✅ Professional Design
- Clean, modern layout
- Consistent typography using Inter font
- Professional color scheme matching your website
- Print-optimized formatting

### ✅ ATS-Friendly
- Standard section headers
- Clean bullet points
- No complex graphics or tables
- Proper heading hierarchy

### ✅ Comprehensive Content
- All your professional experience
- Complete technical skills
- Education and certifications
- Publications and research
- Contact information

### ✅ Responsive Design
- Looks great on screen and print
- Mobile-friendly for viewing
- Proper page breaks for printing

## Customization Options

### Colors
To change the accent color, modify the CSS:
```css
/* Change #ff6b35 to your preferred color */
border-bottom: 2px solid #ff6b35;
color: #ff6b35;
```

### Fonts
To use a different font:
```css
font-family: 'Your-Font', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### Layout
- Adjust margins in `.resume-container`
- Modify section spacing in `.section`
- Change font sizes for different elements

## Tips for Best Results

1. **Print Preview**: Always check print preview before generating PDF
2. **Page Breaks**: Ensure sections don't break awkwardly across pages
3. **File Size**: Keep PDF under 2MB for easy email sharing
4. **Filename**: Use descriptive name like `ryan-lingo-resume-2025.pdf`

## Next Steps

1. Generate the PDF using Method 1 (browser print)
2. Replace the old resume file in `assets/documents/`
3. Test the download link on your website
4. Commit and push changes to trigger deployment

The new resume maintains your professional brand while being more comprehensive and ATS-friendly than typical PDF resumes.