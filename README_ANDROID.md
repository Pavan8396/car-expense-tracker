# Standalone Offline Android App - Documentation

Welcome to the standalone offline Android version of the **Car Expense Tracker**! This document provides all the details regarding the offline architecture, database, backup/restore mechanics, installation instructions, and guides on how to build the APK again.

---

## 📱 1. Installation Instructions

An installable Android APK has been pre-compiled for you and placed at the root of the repository as:
📂 **`CarExpenseTracker.apk`**

### To Install on your Android Phone:
1. **Transfer the APK**: Copy `CarExpenseTracker.apk` to your phone's storage (via USB, Google Drive, Email, or WhatsApp).
2. **Enable Unknown Sources** (if not already enabled):
   - Go to your Android device's **Settings** -> **Security** (or **Apps**).
   - Enable "Install unknown apps" or "Allow installation of apps from unknown sources" for the file manager or browser you are using.
3. **Install**: Open the file manager on your phone, navigate to `CarExpenseTracker.apk`, tap on it, and select **Install**.
4. **Launch**: Locate the **Car Expense Tracker** icon on your home screen or app drawer and tap to open! No internet connection or login is required.

---

## 💾 2. Offline Database & Architecture

The app has been converted into a Standalone Android App using **Ionic Capacitor** wrapping the React frontend. To achieve 100% offline functionality without losing any existing feature, calculations, or charts, we replaced the REST API communication with a highly optimized client-side **local database adapter** in the frontend:

- **Technology**: The local storage engine utilizes the Android System WebView's **`localStorage`**.
- **Data Safety**: Standard `localStorage` in modern Android WebViews is persistent, surviving app restarts, app updates, and device reboots.
- **Capacity**: It provides up to **5MB** of persistent space, which easily accommodates **25,000+** expense records (each record is ~150-200 bytes).
- **Default Database Seeding**: On the very first launch, the app automatically initializes with standard default categories (`EMI`, `Fuel`, `Insurance`, `Maintenance`, `Parking`, `Accessories`).
- **Original Mongoose Preservation**: The original Express & MongoDB codebase in the `backend/` directory is 100% untouched and preserved. The offline adapter activates automatically during compilation via the `REACT_APP_OFFLINE=true` environment variable.

---

## 📤 3. Backup and Restore System

Because your data is saved strictly on your local phone, the app includes robust features to protect your data:

### Export Backup
- **How it works**: Tap **Export Backup** in the Filters & Search panel. It serializes all expenses and categories into a readable JSON file named `car-expense-backup-YYYY-MM-DD.json` and saves it to your phone's downloads folder.
- **Portability**: You can copy this JSON backup to your laptop, Google Drive, or USB drive.

### Import / Restore Backup
- **How it works**: Tap **Import Backup** in the Filters & Search panel and select a previously exported `.json` file.
- **Safety Pre-backup Point**: Before any restore is executed, the app automatically saves a copy of your current database into a secondary storage key (`car_expenses_backup_pre_import`). If you ever restore a file by mistake, your previous data can still be recovered from memory!
- **Data Validation & Merging**: The restore process fully validates the JSON structure. If you restore an offline backup, it updates both custom categories and expenses.
- **MongoDB Data Migration**: The import system is extremely smart—if you select a raw MongoDB export JSON array (for example, containing a list of your old database expenses), it automatically detects it as a migration format, assigns local unique IDs, and imports them seamlessly!

---

## 🛠️ 4. Android Back-Button Behavior

We implemented a native-like experience for the Android physical back button:
- **Dismissing UI Modals**: If any modal is active (such as the *Category Manager*, *Edit Expense Form*, *Delete Confirmation Dialog*, or the *Confirm Restore Modal*), pressing the Android back button will safely close/dismiss the modal.
- **Graceful Exit**: If no modal is open on the screen, pressing the back button safely minimizes and exits the application.

---

## 🏗️ 5. How to Compile/Build the APK Again

Should you make any changes to the React source code and wish to compile a new APK, follow these steps:

### Prerequisites:
Make sure you have Java 21, Gradle, and Android SDK command line tools installed.

### Build Steps:
1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Build the optimized React static assets:
   ```bash
   npm run build
   ```
3. Sync the compiled assets with the Capacitor Android project:
   ```bash
   npx cap sync
   ```
4. Navigate to the `android/` project folder:
   ```bash
   cd android
   ```
5. Compile a new debug installable APK:
   ```bash
   ./gradlew assembleDebug
   ```
6. Your newly generated APK will be available under:
   `app/build/outputs/apk/debug/app-debug.apk`

---

## 🛡️ Security & Privacy
- **No Internet Required**: The application requested 0 network permissions; no communication with external servers is ever performed.
- **Zero Tracking**: No advertisements, analytics, or third-party services are integrated. Your financial data stays exclusively on your phone.
