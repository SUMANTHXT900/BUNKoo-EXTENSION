# Gitam Timetable Extractor

A lightweight Chrome extension that allows GITAM University students to easily extract their timetable from the G-Student portal. The extracted timetable is exported as a JSON file, which can then be used in the BUNKoo mobile app* to load schedules automatically — eliminating the need for manual entry.

---

## 📌 Purpose

This tool helps students:
- Extract their timetable in seconds from the **G-Student** portal.
- Export the data in **structured JSON** format.
- Seamlessly import the file into the **BUNKoo** mobile app (your smart attendance & schedule tracker).

---

## 🚀 Features

- 📅 Extract both **Detailed Schedule** and **Timetable Grid** views.
- 📥 Export extracted data as a `.json` file.
- 🖥️ Clean and responsive UI within the extension popup.
- 🧪 Works with both **live G-Student portal** and **offline sample HTML files**.
- 🧩 Easy one-click install for developers.

---

## 🛠️ Installation (Chrome Extension)

1. **Download or Clone** this repository to your computer.

2. Open Google Chrome and go to:
   ```
   chrome://extensions/
   ```

3. Enable **Developer mode** by toggling the switch in the top-right corner.

4. Click **Load unpacked** button that appears after enabling Developer mode.

5. Navigate to where you downloaded/cloned this repository and **select the `timetable_extractor_extension` folder** (this is important - make sure you select the folder containing the manifest.json file).

6. The extension icon should now appear in your browser's toolbar.

7. To verify installation, click on the Extensions icon (puzzle piece) in Chrome toolbar and check that "Gitam Timetable Extractor" is listed and enabled.

---

## 📚 How to Use

> ⚠️ Please ensure your timetable is fully loaded on the G-Student portal before using the extension.

### Extracting Timetable

1. Go to: [https://gstudent.gitam.edu/Home](https://gstudent.gitam.edu/Home)

2. Navigate to the **Timetable section** where your registered courses and weekly timetable grid are visible.

3. Click the `Gitam Timetable Extractor` extension icon in the toolbar.

4. In the popup, click **"Extract Timetable Data"**.

5. Once extraction is complete, you will see:
   - ✅ Success message
   - Two tabs: **Detailed Schedule** & **Overview Grid**
   - An option to **Export as JSON**

6. Click **Export as JSON** — a file named `gitam_timetable_data.json` will be downloaded.

---

## 📱 Using with BUNKoo App

Once you download the `gitam_timetable_data.json` file:

1. Open your BUNKoo mobile app.
2. Go to the "Import Timetable" section.
3. Select and upload the JSON file.
4. Your timetable will now be auto-loaded into the app.

---

## 📂 Repository Structure

```
├── timetable_extractor_extension/  # Main extension folder (select this during installation)
│   ├── popup.html                  # Extension popup interface
│   ├── popup.js                    # Extraction logic and UI interaction
│   ├── manifest.json               # Chrome extension configuration
│   └── images/                     # Icon assets for the extension
├── CONTRIBUTING.md                 # Contribution guidelines
├── README.md                       # You're reading it
└── LICENSE                         # License information
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|------|----------|
| Extension not appearing after installation | Make sure you selected the correct `timetable_extractor_extension` folder containing manifest.json |
| Extension not extracting data | Make sure you're on the **Timetable page** and it's fully loaded |
| JSON export fails | Refresh the page and try extraction again |
| BUNKoo import not working | Ensure the exported file is unmodified and has a `.json` extension |

---

## 🤝 Contributing

We welcome contributions to enhance this tool.

📖 Read the [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📄 License

This project is licensed under the MIT License. See `LICENSE` for details.

---

## ⚠️ Disclaimer

This extension is **not affiliated** with GITAM University. It is a community-made tool for educational and productivity enhancement only.

---
