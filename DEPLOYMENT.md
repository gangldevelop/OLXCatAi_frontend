# OLXCatAI Outlook Add-In Deployment Guide

This guide covers the deployment process for the OLXCatAI Outlook Add-In, from development setup to production deployment.

## Table of Contents

1. [Development Setup](#development-setup)
2. [Testing in Outlook](#testing-in-outlook)
3. [Production Deployment](#production-deployment)
4. [Enterprise Deployment](#enterprise-deployment)
5. [Troubleshooting](#troubleshooting)

## Development Setup

### Prerequisites

- Node.js 16+ and npm
- Microsoft 365 Developer Account
- Outlook Desktop or Outlook Web
- HTTPS development server (required for Add-In testing)

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm start
```

The app will run on `https://localhost:3000` (HTTPS is required for Add-In testing).

### 3. Configure HTTPS for Development

If you encounter HTTPS issues, you can use a tool like `mkcert`:

```bash
# Install mkcert
npm install -g mkcert

# Create local CA
mkcert -install

# Create certificates for localhost
mkcert localhost 127.0.0.1 ::1
```

## Testing in Outlook

### Method 1: Outlook Desktop (Recommended)

1. **Sideload the Add-In**:
   - Open Outlook Desktop
   - Go to **Get Add-ins** > **My Add-ins**
   - Click **Add a Custom Add-in** > **Add from File**
   - Select the `public/manifest.xml` file

2. **Test the Add-In**:
   - Open any email
   - Look for the **OLXCatAI** button in the ribbon
   - Click to open the task pane

### Method 2: Outlook Web

1. **Enable Developer Mode**:
   - Go to Outlook Web
   - Click the gear icon > **View all Outlook settings**
   - Go to **Mail** > **Customize actions** > **Add-ins**
   - Enable **Developer mode**

2. **Upload Manifest**:
   - Click **Upload** and select `public/manifest.xml`
   - The Add-In will appear in your ribbon

### Method 3: Office Add-in Debugger

1. **Install Office Add-in Debugger**:
   ```bash
   npm install -g office-addin-debugging
   ```

2. **Start Debugging**:
   ```bash
   office-addin-debugging start manifest.xml
   ```

## Production Deployment

### 1. Build for Production

```bash
npm run build
```

This creates optimized files in the `build/` directory.

### 2. Deploy to Web Server

Deploy the `build/` directory to your web server (Azure, AWS, etc.):

```bash
# Example: Deploy to Azure Static Web Apps
az staticwebapp create --name olxcat-ai --source .
```

### 3. Update Manifest URLs

Update `public/manifest.xml` with production URLs:

```xml
<SourceLocation DefaultValue="https://your-domain.com" />
<IconUrl DefaultValue="https://your-domain.com/icon-32.png" />
```

### 4. Create Production Icons

Replace placeholder icon files with actual PNG icons:
- `public/icon-16.png` (16x16)
- `public/icon-32.png` (32x32)
- `public/icon-64.png` (64x64)
- `public/icon-80.png` (80x80)

### 5. Publish to AppSource (Optional)

For public distribution:

1. **Create AppSource Listing**:
   - Go to [Partner Center](https://partner.microsoft.com)
   - Create new Office Add-in listing
   - Upload manifest and provide metadata

2. **Submit for Review**:
   - Complete certification requirements
   - Submit for Microsoft review

## Enterprise Deployment

### Method 1: Centralized Deployment

1. **Prepare for Deployment**:
   ```bash
   # Build production version
   npm run build
   
   # Create deployment package
   zip -r olxcat-ai.zip build/ public/manifest.xml
   ```

2. **Deploy via Microsoft 365 Admin Center**:
   - Go to **Microsoft 365 Admin Center**
   - Navigate to **Settings** > **Integrated apps**
   - Click **Upload custom apps**
   - Upload the manifest file

3. **Assign to Users**:
   - Select target users or groups
   - Choose deployment scope (entire organization or specific groups)

### Method 2: Group Policy (On-Premises)

1. **Create Registry Keys**:
   ```reg
   [HKEY_CURRENT_USER\Software\Microsoft\Office\16.0\Wef\Developer]
   "WefAllowedAddins"="https://your-domain.com/manifest.xml"
   ```

2. **Deploy via Group Policy**:
   - Create GPO with registry settings
   - Apply to target users

### Method 3: PowerShell Deployment

```powershell
# Install Add-In for all users
$manifestPath = "https://your-domain.com/manifest.xml"
$users = Get-Mailbox -ResultSize Unlimited

foreach ($user in $users) {
    New-App -User $user.PrimarySmtpAddress -Manifest $manifestPath
}
```

## Configuration

### Environment Variables

Create `.env` files for different environments:

```bash
# .env.development
REACT_APP_API_URL=https://localhost:3000
REACT_APP_OFFICE_ENV=development

# .env.production
REACT_APP_API_URL=https://your-api-domain.com
REACT_APP_OFFICE_ENV=production
```

### Manifest Configuration

Key manifest settings to customize:

```xml
<!-- Update these in public/manifest.xml -->
<Id>YOUR-UNIQUE-GUID</Id>
<ProviderName>Your Company Name</ProviderName>
<SupportUrl>https://your-support-url.com</SupportUrl>
<AppDomains>
  <AppDomain>https://your-domain.com</AppDomain>
</AppDomains>
```

## Security Considerations

### 1. HTTPS Requirements

- All URLs in manifest must use HTTPS
- Development requires HTTPS (use mkcert or similar)

### 2. Content Security Policy

Add CSP headers to your web server:

```
Content-Security-Policy: frame-ancestors 'self' https://outlook.office.com https://outlook.office365.com
```

### 3. CORS Configuration

Configure your web server to allow Office domains:

```
Access-Control-Allow-Origin: https://outlook.office.com
Access-Control-Allow-Origin: https://outlook.office365.com
```

## Troubleshooting

### Common Issues

1. **Add-In Not Loading**:
   - Check HTTPS configuration
   - Verify manifest XML syntax
   - Check browser console for errors

2. **Office.js Not Available**:
   - Ensure running in Outlook environment
   - Check Office.js script loading

3. **Permission Errors**:
   - Verify manifest permissions
   - Check user consent requirements

### Debug Tools

1. **Office Add-in Debugger**:
   ```bash
   office-addin-debugging start manifest.xml
   ```

2. **Browser Developer Tools**:
   - Check Console for errors
   - Monitor Network requests
   - Verify Office.js loading

3. **Outlook Diagnostic Tools**:
   - Enable verbose logging
   - Check Add-in status in Outlook

### Support Resources

- [Office Add-ins Documentation](https://docs.microsoft.com/en-us/office/dev/add-ins/)
- [Outlook Add-in Samples](https://github.com/OfficeDev/Outlook-Add-in-Samples)
- [Office Add-ins Community](https://techcommunity.microsoft.com/t5/office-add-ins/bd-p/Office_General_AddIns)

## Next Steps

After successful deployment:

1. **Monitor Usage**: Track Add-In usage and performance
2. **Gather Feedback**: Collect user feedback for improvements
3. **Update Regularly**: Keep the Add-In updated with new features
4. **Scale Infrastructure**: Prepare for increased usage

---

For additional support, contact the OLXCatAI development team or refer to the project documentation. 