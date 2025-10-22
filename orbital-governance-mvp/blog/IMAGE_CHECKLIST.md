# 📸 Blog Images Checklist

## Screenshots to Capture (Easy - Just Run Demo)

### 1. **Dashboard Overview** 
- **What**: Main interface showing all stats
- **When**: Right after loading demo
- **Focus**: Total tracts (95,904), Active satellites (12,981), Available spaces
- **Caption**: "Real-time dashboard tracking 12,981 satellites and 95,904 orbital tracts"

### 2. **Satellite Search in Action**
- **What**: Search box with "starlink" typed, showing filtered results
- **When**: After typing in search box
- **Focus**: Search functionality working
- **Caption**: "Live search filtering through thousands of satellites"

### 3. **Tract Search Results**
- **What**: Form filled out (550km altitude, 53° inclination) with results showing
- **When**: After submitting tract search
- **Focus**: Available orbital spaces found
- **Caption**: "Finding available 'parking spaces' for new satellite missions"

### 4. **Real-Time Updates**
- **What**: Timestamp showing "Last updated: [time]" 
- **When**: After page has been running for a minute
- **Focus**: Live data freshness indicator
- **Caption**: "System updates satellite positions every 30 seconds"

### 5. **Collision Risk Indicator**
- **What**: Risk level showing (LOW/MEDIUM/HIGH)
- **When**: Dashboard loaded
- **Focus**: Risk assessment feature
- **Caption**: "Real-time collision risk assessment based on orbital density"

## Terminal Screenshots (Technical Credibility)

### 6. **Database Connection Test**
- **What**: Output from `python3 test_db.py` (if you still have it)
- **When**: Running database validation
- **Focus**: 12,981 satellites, 95,904 tracts confirmed
- **Caption**: "Database validation confirming real satellite data"

### 7. **Server Starting**
- **What**: Flask server startup messages
- **When**: Running `python3 app.py`
- **Focus**: "Demo available at localhost:3000"
- **Caption**: "Starting the Flask development server"

## Code Screenshots (Developer Appeal)

### 8. **Key Database Query**
- **What**: The satellite query from app.py
- **When**: Screenshot of code in editor
- **Focus**: PostgreSQL spatial query
- **Caption**: "Real-time satellite position queries using PostGIS"

### 9. **Real-Time JavaScript**
- **What**: The setInterval code for auto-refresh
- **When**: Screenshot of app.js
- **Focus**: 30-second update mechanism
- **Caption**: "JavaScript powering real-time dashboard updates"

## Diagrams to Create (Optional - Higher Impact)

### 10. **Orbital Tract Concept**
- **What**: Simple diagram showing orbital "parking spaces"
- **Tool**: Draw.io, Figma, or even PowerPoint
- **Elements**: Earth, orbital shells, divided sections
- **Caption**: "Orbital tracts: 3D 'parking spaces' defined by altitude, inclination, and RAAN"

### 11. **System Architecture**
- **What**: Simple boxes showing PostgreSQL → Flask → Browser
- **Tool**: Any diagramming tool
- **Elements**: Database, API, Frontend with arrows
- **Caption**: "Simple but powerful architecture: PostgreSQL + Flask + Modern JavaScript"

## Screenshot Tips

### For Best Results:
- **Use full browser window** (not just partial screenshots)
- **Clean browser** (close other tabs, use incognito mode)
- **Good lighting** if taking photos of terminal
- **Consistent sizing** (same browser zoom level)
- **Highlight key numbers** (circle important stats if needed)

### Browser Setup:
1. Open http://localhost:3000
2. Wait for data to load completely
3. Use browser's built-in screenshot tools or:
   - Mac: Cmd+Shift+4 (select area)
   - Windows: Windows+Shift+S

### Terminal Setup:
- Use a clean terminal window
- Increase font size for readability
- Dark theme looks more professional
- Copy/paste commands to avoid typos in screenshots

## Image Organization

```
blog/images/
├── dashboard-overview.png
├── satellite-search.png  
├── tract-results.png
├── real-time-updates.png
├── collision-risk.png
├── database-validation.png
├── server-startup.png
├── code-query.png
├── code-realtime.png
└── diagrams/
    ├── orbital-concept.png
    └── system-architecture.png
```

## Priority Order

### Must Have (Blog won't work without these):
1. Dashboard overview
2. Tract search results
3. Database validation terminal

### Should Have (Makes blog much better):
4. Satellite search in action
5. Real-time updates
6. Server startup

### Nice to Have (Professional polish):
7. Code screenshots
8. Collision risk indicator
9. System architecture diagram
10. Orbital concept diagram

Start with the "Must Have" screenshots - you can always add more later!