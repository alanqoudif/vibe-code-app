# Smart Calendar Demo Guide

## Getting Started

1. **Launch the App**
   ```bash
   cd SmartCalendar
   npm start
   ```

2. **Choose Your Platform**
   - Press `w` for web browser
   - Press `i` for iOS simulator
   - Press `a` for Android emulator

## Demo Flow

### 1. First Launch
- The app opens to the Calendar screen
- You'll see sample classes already populated
- Notice the modern, Notion-like design with soft rounded corners

### 2. Upload Your Timetable
- Tap the camera icon in the top-right corner
- Choose "Take Photo" to capture your timetable
- Or select "Gallery" to pick from photos
- Or choose "Manual Entry" to type your schedule

**Sample Timetable Text:**
```
Monday: 9:00 AM - Mathematics, 11:00 AM - Physics
Tuesday: 10:00 AM - Chemistry, 2:00 PM - Biology
Wednesday: 9:00 AM - English, 11:00 AM - History
Thursday: 10:00 AM - Geography, 2:00 PM - Computer Science
Friday: 9:00 AM - Physical Education, 11:00 AM - Art
```

### 3. Explore Calendar Features
- **View Modes**: Switch between Day, Week, and Month views
- **Today's Classes**: See your classes for the current day
- **Quick Actions**: Try the action buttons (Join Class, View Homework, etc.)
- **Class Details**: Tap on classes to see more information

### 4. Manage Tasks
- Navigate to the "Tasks" tab
- See automatically generated homework and study tasks
- **Add New Task**: Tap the "+" button to add custom tasks
- **Mark Complete**: Tap the checkbox to mark tasks as done
- **Priority Levels**: Notice the color-coded priority indicators

### 5. Chat with AI Study Bot
- Go to the "Study Bot" tab
- **Quick Tips**: Browse the study tip cards
- **Ask Questions**: Type questions like:
  - "How can I improve my memory?"
  - "What's the best way to study for exams?"
  - "I'm feeling stressed about my studies"
  - "How can I manage my time better?"

### 6. Customize Settings
- Navigate to the "Settings" tab
- **Dark Mode**: Toggle between light and dark themes
- **Notifications**: Configure reminder preferences
- **Data Management**: Export/import your data
- **About**: Learn more about the app

## Key Features to Test

### Smart Scheduling
1. Upload a timetable with the sample text above
2. Watch as classes are automatically parsed and added
3. Notice how tasks are generated for each class

### Notifications
1. Go to Settings and enable notifications
2. The app will schedule reminders for classes and tasks
3. Check your device's notification settings

### Dark Mode
1. Toggle dark mode in Settings
2. Notice how all screens adapt to the new theme
3. The setting is automatically saved

### Quick Actions
1. On the Calendar screen, try the quick action buttons
2. Each button represents a common student action
3. In a real app, these would integrate with external services

### Data Persistence
1. Add some classes and tasks
2. Close and reopen the app
3. Your data should still be there

## Sample Data

The app comes with sample data to demonstrate features:

**Sample Classes:**
- Mathematics (Monday, 9:00 AM)
- Physics (Monday, 11:00 AM)
- Chemistry (Wednesday, 2:00 PM)

**Sample Tasks:**
- Complete Calculus Assignment (High Priority)
- Physics Lab Report (Medium Priority)
- Chemistry Quiz Preparation (High Priority, Completed)

## Troubleshooting

### Common Issues

1. **App won't start**
   - Make sure you're in the SmartCalendar directory
   - Run `npm install` to install dependencies
   - Check that Node.js is installed

2. **Camera not working**
   - Make sure you've granted camera permissions
   - Try using the gallery option instead

3. **Notifications not showing**
   - Check device notification settings
   - Make sure notifications are enabled in app settings

4. **Data not saving**
   - This is normal for web version
   - Data persists in mobile versions

### Performance Tips

- The app is optimized for mobile devices
- Web version may be slower than native
- For best experience, use on iOS or Android

## Next Steps

After trying the demo:

1. **Customize**: Add your real timetable and tasks
2. **Explore**: Try all the features and settings
3. **Integrate**: In a real app, you'd connect to external services
4. **Extend**: Add more features like grade tracking, study groups, etc.

## Support

If you encounter any issues:
1. Check the console for error messages
2. Try refreshing the app
3. Restart the development server
4. Check the README.md for more details

---

Enjoy exploring your new Smart Calendar! 🎓📚
