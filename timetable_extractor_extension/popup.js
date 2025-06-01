document.addEventListener('DOMContentLoaded', function() {
  const extractBtn = document.getElementById('extractBtn');
  const timetableDataEl = document.getElementById('timetableDataContainer');
  
  // Check if elements exist to prevent null reference errors
  if (!extractBtn || !timetableDataEl) {
    console.error('Required DOM elements not found. Check your HTML structure.');
    return; // Exit early if elements don't exist
  }

  extractBtn.addEventListener('click', async () => {
    try {
      // Show loading indicator
      extractBtn.disabled = true;
      extractBtn.innerHTML = '<span class="spinner"></span> Extracting...';
      timetableDataEl.innerHTML = '<p class="info">Extracting timetable data, please wait...</p>';

      let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.url) {
        throw new Error('No active tab found or URL is undefined');
      }

      if (tab.url.includes('gstudent.gitam.edu/Home') || 
          tab.url.includes('G-Student.html') || 
          tab.url.startsWith('file:///')) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: extractTimetableDataFromPage,
        }, (injectionResults) => {
          // Reset button state
          extractBtn.disabled = false;
          extractBtn.textContent = 'Extract Timetable Data';
          
          if (chrome.runtime.lastError || !injectionResults || !injectionResults[0]) {
            timetableDataEl.innerHTML = `<p class="error">Error: ${chrome.runtime.lastError ? chrome.runtime.lastError.message : 'Could not execute script on page.'}</p>`;
            console.error(chrome.runtime.lastError || 'No results from injection');
            return;
          }
          
          const result = injectionResults[0].result;

          timetableDataEl.innerHTML = ''; // Clear previous content

          if (result && result.error) {
            timetableDataEl.innerHTML = `<p class="error">Error: ${result.error}</p>`;
          } else if (result && result.data && (result.data.detailedSchedule.length > 0 || result.data.overviewSchedule.length > 0)) {
            
            // Add a success message
            const successMsg = document.createElement('div');
            successMsg.className = 'success-message';
            successMsg.innerHTML = '<p>✅ Data extracted successfully!</p>';
            timetableDataEl.appendChild(successMsg);
            
            // Add export button
            const exportBtn = document.createElement('button');
            exportBtn.id = 'exportBtn';
            exportBtn.textContent = 'Export as JSON';
            exportBtn.onclick = function() {
              try {
                const allData = {
                  detailedSchedule: result.data.detailedSchedule,
                  overviewSchedule: result.data.overviewSchedule,
                  exportedAt: new Date().toISOString()
                };
                
                // Create a download link
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allData, null, 2));
                const downloadAnchorNode = document.createElement('a');
                downloadAnchorNode.setAttribute("href", dataStr);
                downloadAnchorNode.setAttribute("download", "gitam_timetable_data.json");
                document.body.appendChild(downloadAnchorNode);
                downloadAnchorNode.click();
                downloadAnchorNode.remove();
              } catch (e) {
                console.error('Error exporting data:', e);
                alert('Failed to export data: ' + e.message);
              }
            };
            timetableDataEl.appendChild(exportBtn);
            
            // Add tabs for the two data sections
            const tabContainer = document.createElement('div');
            tabContainer.className = 'tab-container';
            
            const detailTab = document.createElement('div');
            detailTab.className = 'tab active';
            detailTab.textContent = 'Detailed Schedule';
            detailTab.onclick = () => switchTab('detailed');
            
            const overviewTab = document.createElement('div');
            overviewTab.className = 'tab';
            overviewTab.textContent = 'Overview Grid';
            overviewTab.onclick = () => switchTab('overview');
            
            tabContainer.appendChild(detailTab);
            tabContainer.appendChild(overviewTab);
            timetableDataEl.appendChild(tabContainer);
            
            // Create content containers
            const detailedContent = document.createElement('div');
            detailedContent.id = 'detailed-content';
            detailedContent.className = 'tab-content active';
            
            const overviewContent = document.createElement('div');
            overviewContent.id = 'overview-content';
            overviewContent.className = 'tab-content';
            
            // Populate detailed content
            renderDetailedSchedule(result.data.detailedSchedule, detailedContent);
            
            // Populate overview content
            renderOverviewSchedule(result.data.overviewSchedule, overviewContent);
            
            timetableDataEl.appendChild(detailedContent);
            timetableDataEl.appendChild(overviewContent);
            
            // Tab switching function (defined in global scope to be accessible)
            window.switchTab = function(tabName) {
              document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
              document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
              
              if (tabName === 'detailed') {
                detailTab.classList.add('active');
                detailedContent.classList.add('active');
              } else {
                overviewTab.classList.add('active');
                overviewContent.classList.add('active');
              }
            };

          } else {
            timetableDataEl.innerHTML = '<p class="error">No timetable data returned or the structure is not as expected. Check console for details.</p>';
            console.log('Received from script:', result);
          }
        });
      } else {
        // Reset button state
        extractBtn.disabled = false;
        extractBtn.textContent = 'Extract Timetable Data';
        timetableDataEl.innerHTML = '<p class="error">Please ensure you are on the G-Student timetable page (gstudent.gitam.edu/Home or local G-Student.html) and the timetable is loaded.</p>';
        console.log('Current tab URL not matching criteria:', tab.url);
      }
    } catch (error) {
      // Global error handler
      console.error('Extension error:', error);
      if (extractBtn) {
        extractBtn.disabled = false;
        extractBtn.textContent = 'Extract Timetable Data';
      }
      if (timetableDataEl) {
        timetableDataEl.innerHTML = `<p class="error">An unexpected error occurred: ${error.message}</p>`;
      }
    }
  });
});

// This function will be injected into the G-Student page
function extractTimetableDataFromPage() {
  try {
    const mainDiv = document.getElementById('maindiv');
    if (!mainDiv) {
      return { error: 'The main content div (id="maindiv") was not found.' };
    }

    // --- Extract from "Registered courses" table ---
    const registeredCourseEntries = [];
    const allH3s = mainDiv.querySelectorAll('h3.sub-title');
    let registeredCoursesTable = null;

    allH3s.forEach(h3 => {
      if (h3.innerText.trim().toLowerCase() === 'registered courses') {
        let container = h3.nextElementSibling;
        if (container && container.classList.contains('box-inner')) {
          const responsiveDiv = container.querySelector('div.table-responsive');
          if (responsiveDiv) {
            registeredCoursesTable = responsiveDiv.querySelector('table.table.table-bordered');
          }
        }
      }
    });

    if (registeredCoursesTable) {
      const rows = registeredCoursesTable.querySelectorAll('tbody > tr');
      const COL_COURSE_CODE = 0;
      const COL_COURSE_TITLE = 1;
      const COL_ROOM = 2;
      const COL_CREDITS = 3;
      const COL_TYPE = 4;
      const COL_CATEGORY = 5;
      const COL_INSTRUCTOR = 6;
      const COL_SCHEDULE = 7;

      for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].querySelectorAll('td');
        if (cells.length < Math.max(COL_COURSE_CODE, COL_COURSE_TITLE, COL_ROOM, COL_CREDITS, COL_TYPE, COL_CATEGORY, COL_INSTRUCTOR, COL_SCHEDULE) + 1) {
          console.warn('Skipping row due to insufficient cells:', rows[i].innerText);
          continue;
        }

        const courseCode = cells[COL_COURSE_CODE] ? cells[COL_COURSE_CODE].innerText.trim() : 'N/A';
        const courseTitle = cells[COL_COURSE_TITLE] ? cells[COL_COURSE_TITLE].innerText.trim() : 'N/A';
        const room = cells[COL_ROOM] ? cells[COL_ROOM].innerText.trim() : 'N/A';
        const credits = cells[COL_CREDITS] ? cells[COL_CREDITS].innerText.trim() : 'N/A';
        const type = cells[COL_TYPE] ? cells[COL_TYPE].innerText.trim() : 'N/A';
        const category = cells[COL_CATEGORY] ? cells[COL_CATEGORY].innerText.trim() : 'N/A';
        const instructor = cells[COL_INSTRUCTOR] ? cells[COL_INSTRUCTOR].innerText.trim() : 'N/A';
        const scheduleCell = cells[COL_SCHEDULE];

        if (scheduleCell) {
          const scheduleDivs = scheduleCell.querySelectorAll('div');
          scheduleDivs.forEach(div => {
            const scheduleText = div.innerText.trim();
            const parts = scheduleText.match(/(\w+):\s*([\d:]+)\s*-\s*([\d:]+)/);
            if (parts && parts.length === 4) {
              registeredCourseEntries.push({
                day: parts[1],
                time: `${parts[2]} - ${parts[3]}`,
                courseCode: courseCode,
                courseTitle: courseTitle,
                room: room,
                credits: credits,
                type: type,
                category: category,
                instructor: instructor,
                dataSource: 'Registered Courses List'
              });
            }
          });
        }
      }
    } else {
      console.warn('The "Registered courses" table was not found.');
    }

    // --- Extract from the visual "Time table" grid ---
    const visualTimetableEntries = [];
    // Find the h5 with "Time table" and then the table
    const allH5s = mainDiv.querySelectorAll('h5.page-title');
    let visualTableContainer = null;
    allH5s.forEach(h5 => {
        if(h5.innerText.trim().toLowerCase() === 'time table') {
            visualTableContainer = h5.closest('.contentContainer');
        }
    });
    
    let visualTable = null;
    if(visualTableContainer){
        // The visual timetable is usually the first table within the box-inner of its container
        const boxInner = visualTableContainer.querySelector('div.box-inner');
        if (boxInner) {
          const responsiveDiv = boxInner.querySelector('div.table-responsive');
          if(responsiveDiv){
              visualTable = responsiveDiv.querySelector('table.table.table-bordered');
          }
        }
    }

    // If we still don't have the visual table, try a more direct approach
    if (!visualTable) {
      // Try to find any table that looks like a timetable (has days of the week)
      const allTables = mainDiv.querySelectorAll('table');
      for (const table of allTables) {
        const tableText = table.innerText.toLowerCase();
        if (tableText.includes('monday') && tableText.includes('tuesday')) {
          visualTable = table;
          break;
        }
      }
    }

    if (visualTable) {
      const visualRows = visualTable.querySelectorAll('thead > tr, tbody > tr');
      let timeHeaders = [];

      if (visualRows[0]) {
        const headerCells = visualRows[0].querySelectorAll('th');
        for (let i = 1; i < headerCells.length; i++) { // Skip first 'WEEKDAY'
          timeHeaders.push(headerCells[i].innerText.trim());
        }
      }

      for (let i = 1; i < visualRows.length; i++) { // Start from data rows
        const dataCells = visualRows[i].querySelectorAll('td');
        if (dataCells.length === 0 || !dataCells[0]) continue;

        const day = dataCells[0].innerText.trim();
        for (let j = 1; j < dataCells.length; j++) {
          const courseCodeText = dataCells[j].innerText.trim();
          if (courseCodeText) {
            const timeSlot = timeHeaders[j - 1] || 'N/A';
            visualTimetableEntries.push({
              day: day,
              time: timeSlot,
              courseCode: courseCodeText,
              dataSource: 'Visual Timetable Grid'
            });
          }
        }
      }
    } else {
      console.warn('Visual timetable table not found.');
    }

    const finalError = (registeredCourseEntries.length === 0 && visualTimetableEntries.length === 0) ? 'No data extracted from any table. Ensure timetable page is fully loaded.' : null;

    return {
      error: finalError,
      data: {
          detailedSchedule: registeredCourseEntries, // From "Registered Courses"
          overviewSchedule: visualTimetableEntries // From the top visual grid
      }
    };
  } catch (error) {
    console.error('Error in extractTimetableDataFromPage:', error);
    return { 
      error: `Error extracting data: ${error.message} Make sure you are on the G-Student page and the timetable is visible.`,
      errorDetails: error.toString()
    };
  }
}

// --- New helper functions for rendering ---

function renderDetailedSchedule(scheduleData, container) {
  container.innerHTML = ''; // Clear previous content

  if (!scheduleData || scheduleData.length === 0) {
    container.innerHTML = '<p class="info">No detailed schedule data found.</p>';
    return;
  }

  const header = document.createElement('h4');
  header.textContent = 'Registered Courses (Detailed)';
  container.appendChild(header);

  scheduleData.forEach(item => {
    const card = document.createElement('div');
    card.className = 'course-card';

    // Helper to create and append detail elements
    const addDetail = (label, value) => {
      if (value && value !== 'N/A') {
        const p = document.createElement('p');
        p.innerHTML = `<strong>${label}:</strong> ${value}`;
        card.appendChild(p);
      }
    };

    addDetail('Course', `${item.courseTitle} (${item.courseCode})`);
    addDetail('Day', item.day);
    addDetail('Time', item.time);
    addDetail('Room', item.room);
    addDetail('Instructor', item.instructor);
    addDetail('Credits', item.credits);
    addDetail('Type', item.type);
    addDetail('Category', item.category);
    
    // Add a copy button to the card
    const copyButton = document.createElement('button');
    copyButton.className = 'copy-card-btn';
    copyButton.textContent = 'Copy Details';
    copyButton.title = 'Copy course details to clipboard';
    copyButton.onclick = (e) => {
      e.stopPropagation(); // Prevent any parent click listeners
      let textToCopy = `Course: ${item.courseTitle} (${item.courseCode})\n`;
      if (item.day && item.day !== 'N/A') textToCopy += `Day: ${item.day}\n`;
      if (item.time && item.time !== 'N/A') textToCopy += `Time: ${item.time}\n`;
      if (item.room && item.room !== 'N/A') textToCopy += `Room: ${item.room}\n`;
      if (item.instructor && item.instructor !== 'N/A') textToCopy += `Instructor: ${item.instructor}\n`;
      if (item.credits && item.credits !== 'N/A') textToCopy += `Credits: ${item.credits}\n`;
      if (item.type && item.type !== 'N/A') textToCopy += `Type: ${item.type}\n`;
      if (item.category && item.category !== 'N/A') textToCopy += `Category: ${item.category}\n`;
      
      navigator.clipboard.writeText(textToCopy.trim()).then(() => {
        const originalText = copyButton.textContent;
        copyButton.textContent = 'Copied!';
        copyButton.disabled = true;
        setTimeout(() => {
          copyButton.textContent = originalText;
          copyButton.disabled = false;
        }, 1500);
      }).catch(err => {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy details. See console for error.');
      });
    };
    card.appendChild(copyButton);

    container.appendChild(card);
  });
}

function renderOverviewSchedule(scheduleData, container) {
  container.innerHTML = ''; // Clear previous content

  if (!scheduleData || scheduleData.length === 0) {
    container.innerHTML = '<p class="info">No overview grid data found.</p>';
    return;
  }
  
  const header = document.createElement('h4');
  header.textContent = 'Timetable Grid (Visual Overview)';
  container.appendChild(header);

  // Helper function to normalize time strings (e.g., "9:00 AM - 10:00 AM" to "09:00 - 10:00")
  const normalizeTimeSlot = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return 'N/A';
    const parts = timeStr.split('-').map(p => p.trim());
    if (parts.length !== 2) return timeStr; // Return original if not a clear range

    const formatTime = (timePart) => {
      let [time, modifier] = timePart.split(/\s+/); // split by space to separate AM/PM
      let [hours, minutes] = time.split(':').map(Number);

      if (isNaN(hours) || isNaN(minutes)) return null; // Invalid time components

      if (modifier) {
        modifier = modifier.toUpperCase();
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0; // Midnight case
      }
      // Assuming 24h format if no modifier and hours > 12, or if modifier implies it.
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    };

    const startTime = formatTime(parts[0]);
    const endTime = formatTime(parts[1]);

    if (!startTime || !endTime) return timeStr; // Return original if parsing failed

    return `${startTime} - ${endTime}`;
  };

  // 1. Get unique days and time slots, and sort them
  const daysOrder = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
  
  // Normalize time slots in the data first
  const normalizedScheduleData = scheduleData.map(item => ({
    ...item,
    normalizedTime: normalizeTimeSlot(item.time)
  }));

  const uniqueDays = [...new Set(normalizedScheduleData.map(item => item.day.toUpperCase()))]
    .sort((a, b) => daysOrder.indexOf(a) - daysOrder.indexOf(b));

  const uniqueTimeSlots = [...new Set(normalizedScheduleData.map(item => item.normalizedTime))]
    .sort((a, b) => {
      const timeAStart = a.split('-')[0].trim();
      const timeBStart = b.split('-')[0].trim();
      return timeAStart.localeCompare(timeBStart);
    });

  if (uniqueDays.length === 0 || uniqueTimeSlots.length === 0) {
    container.innerHTML += '<p class="info">Not enough data to render a grid.</p>';
    return;
  }

  // 2. Create table structure
  const table = document.createElement('table');
  table.className = 'timetable-grid';

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  const thDay = document.createElement('th');
  thDay.textContent = 'Day';
  headerRow.appendChild(thDay);

  uniqueTimeSlots.forEach(slot => {
    const thTime = document.createElement('th');
    thTime.textContent = slot;
    headerRow.appendChild(thTime);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  uniqueDays.forEach(day => {
    const tr = document.createElement('tr');
    const tdDay = document.createElement('td');
    tdDay.textContent = day.charAt(0) + day.slice(1).toLowerCase();
    tdDay.className = 'day-cell';
    tr.appendChild(tdDay);

    uniqueTimeSlots.forEach(slot => {
      const tdSlot = document.createElement('td');
      // Use normalizedTime for filtering
      const coursesInSlot = normalizedScheduleData.filter(item => item.day.toUpperCase() === day && item.normalizedTime === slot);
      
      if (coursesInSlot.length > 0) {
        tdSlot.innerHTML = coursesInSlot.map(course => {
            // Try to find more details from detailedSchedule if available (assuming it's passed or accessible)
            // For now, just use courseCode and add a class for styling
            return `<div class="course-slot-item">${course.courseCode}</div>`;
        }).join('');
        // Add a class if there's any course, for styling non-empty cells
        tdSlot.classList.add('has-course'); 
      } else {
        tdSlot.innerHTML = '&nbsp;'; // Non-breaking space for empty cells
      }
      tr.appendChild(tdSlot);
    });
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  
  const tableContainer = document.createElement('div');
  tableContainer.className = 'timetable-grid-container';
  tableContainer.appendChild(table);
  container.appendChild(tableContainer);
} 