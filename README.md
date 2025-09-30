# Smart Calendar - Student Smart Calendar App

A creative, Notion-like student smart calendar built with Expo 54 that helps students manage their academic life with AI-powered features and modern UI.

## Features

### 📅 Smart Calendar
- **Multiple Views**: Day, week, and month calendar views
- **Automatic Scheduling**: Upload your timetable and let AI populate your calendar
- **Smart Reminders**: Get notified before classes and deadlines
- **Quick Actions**: Join classes, view homework, mark attendance with one tap

### 📝 Task Management
- **Smart Task Creation**: AI generates tasks based on your classes
- **Priority System**: High, medium, and low priority tasks
- **Progress Tracking**: Visual progress indicators and completion stats
- **Deadline Alerts**: Never miss an assignment again

### 🤖 AI Study Bot
- **Personalized Tips**: Get study tips tailored to your schedule
- **Interactive Chat**: Ask questions about study strategies
- **Motivation**: Daily encouragement and study suggestions
- **Smart Insights**: AI analyzes your patterns and suggests improvements

### 📸 Timetable Upload
- **Photo Capture**: Snap a photo of your timetable
- **Gallery Import**: Select from your photo library
- **Manual Entry**: Type your schedule in natural language
- **AI Processing**: Automatically extracts class information

### 🎨 Modern UI/UX
- **Dark Mode**: Beautiful dark and light themes
- **Smooth Animations**: Polished interactions and transitions
- **Notion-like Design**: Clean, modern interface with soft rounded corners
- **Responsive**: Optimized for all screen sizes

### 🔔 Smart Notifications
- **Class Reminders**: 15 minutes before each class
- **Deadline Alerts**: 1 day before task due dates
- **Study Tips**: Daily motivational messages
- **Quick Actions**: Smart suggestions throughout the day

## Tech Stack

- **Framework**: Expo 54 with React Native
- **Language**: TypeScript
- **Navigation**: React Navigation 6
- **State Management**: React Context API
- **Storage**: AsyncStorage for local data persistence
- **Notifications**: Expo Notifications
- **Camera**: Expo Camera and Image Picker
- **Calendar**: React Native Calendars
- **UI Components**: Custom components with modern design

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SmartCalendar
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on device/simulator**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   
   # Web
   npm run web
   ```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   └── AnimatedCard.tsx
├── contexts/           # React Context providers
│   └── ThemeContext.tsx
├── navigation/         # Navigation configuration
│   └── AppNavigator.tsx
├── screens/           # Main app screens
│   ├── CalendarScreen.tsx
│   ├── TasksScreen.tsx
│   ├── StudyBotScreen.tsx
│   ├── SettingsScreen.tsx
│   └── TimetableUploadScreen.tsx
├── services/          # Business logic and API calls
│   ├── StorageService.ts
│   ├── NotificationService.ts
│   └── SmartSchedulingService.ts
├── types/             # TypeScript type definitions
│   └── index.ts
└── utils/             # Helper functions
    └── helpers.ts
```

## Key Features Implementation

### Smart Scheduling
The app uses AI to parse timetable text and automatically create classes and tasks:

```typescript
// Parse natural language timetable
const classes = SmartSchedulingService.parseTimetableText(`
  Monday: 9:00 AM - Math, 11:00 AM - Science
  Tuesday: 10:00 AM - English, 2:00 PM - History
`);

// Generate smart tasks
const tasks = SmartSchedulingService.generateSmartTasks(classes);
```

### Theme System
Complete dark/light mode support with consistent theming:

```typescript
const { theme, isDark, toggleTheme } = useTheme();

// Use theme colors
<View style={{ backgroundColor: theme.colors.background }}>
  <Text style={{ color: theme.colors.text }}>Hello World</Text>
</View>
```

### Data Persistence
All data is stored locally using AsyncStorage:

```typescript
// Save classes
await StorageService.saveClasses(classes);

// Get tasks
const tasks = await StorageService.getTasks();

// Export data
const exportData = await StorageService.exportData();
```

### Notifications
Smart notification system with different types:

```typescript
// Schedule class reminder
await NotificationService.scheduleClassReminder(classData);

// Schedule task deadline
await NotificationService.scheduleTaskDeadlineReminder(task);
```

## Customization

### Adding New Task Types
1. Update the `Task` type in `src/types/index.ts`
2. Add the new type to the `getTaskTypeIcon` function in `src/utils/helpers.ts`
3. Update the task creation UI in `TasksScreen.tsx`

### Adding New Quick Actions
1. Update the `QuickAction` type in `src/types/index.ts`
2. Add new actions to the quick actions grid in `CalendarScreen.tsx`
3. Implement the action logic in the respective service

### Customizing Themes
1. Modify the theme objects in `src/contexts/ThemeContext.tsx`
2. Add new color properties as needed
3. Update components to use new theme properties

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Expo team for the amazing development platform
- React Navigation for smooth navigation
- React Native Calendars for the calendar component
- All the open-source contributors who made this possible

---

Made with ❤️ for students everywhere. Study smart, not hard!
# vibe-code-app
