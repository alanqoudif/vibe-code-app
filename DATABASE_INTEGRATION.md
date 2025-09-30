# Database Integration Documentation

## Overview
This app has been successfully integrated with Supabase for real-time database operations. The integration includes user authentication, profile management, and calendar/class data storage.

## Database Schema

### Tables Used
1. **events** - Stores calendar/class data
2. **profiles** - Stores user profile information
3. **notifications** - Stores notification data
4. **auth.users** - Supabase's built-in user authentication

### Key Features
- **User Authentication**: Real Supabase authentication with email/password
- **Profile Management**: User profiles with additional fields (university, major, etc.)
- **Class/Event Management**: Calendar events stored in Supabase with fallback to local storage
- **Offline Support**: Graceful fallback to AsyncStorage when offline

## Files Modified

### New Files
- `src/lib/supabase.ts` - Supabase client configuration
- `src/services/DatabaseService.ts` - Database operations service
- `src/screens/DatabaseTestScreen.tsx` - Test screen for database operations

### Modified Files
- `src/contexts/AuthContext.tsx` - Updated to use Supabase authentication
- `src/services/StorageService.ts` - Updated to use Supabase with local fallback
- `src/types/index.ts` - Updated User interface with additional fields
- `src/navigation/AppNavigator.tsx` - Added database test screen
- `src/screens/SettingsScreen.tsx` - Added database test option

## Configuration

### Environment Variables
The app uses the following Supabase configuration:
- **Project URL**: `https://ymkatahxzfwiyhpzvxts.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Dependencies Added
- `@supabase/supabase-js` - Supabase JavaScript client

## Testing

### Database Test Screen
Access the database test screen through:
1. Go to Settings tab
2. Tap "اختبار الاتصال" (Test Connection)
3. Run various tests to verify database functionality

### Test Functions
- **Test Database Connection**: Verifies Supabase connection and user authentication
- **Test Create Class**: Creates a test class and verifies it's stored in the database
- **Clear Results**: Clears test results

## Usage

### Authentication
```typescript
// Login
const success = await login(email, password);

// Signup
const success = await signup(name, email, password);

// Logout
await logout();
```

### Class Management
```typescript
// Get classes (automatically uses Supabase with local fallback)
const classes = await StorageService.getClasses();

// Add class
await StorageService.addClass(newClass);

// Update class
await StorageService.updateClass(classId, updates);

// Delete class
await StorageService.deleteClass(classId);
```

### Profile Management
```typescript
// Get profile
const profile = await DatabaseService.getProfile(userId);

// Update profile
await DatabaseService.updateProfile(userId, updates);
```

## Error Handling

The integration includes comprehensive error handling:
- **Network Errors**: Graceful fallback to local storage
- **Authentication Errors**: Clear error messages to users
- **Database Errors**: Logged for debugging, fallback to local storage

## Offline Support

The app maintains full functionality when offline:
- Classes are cached locally using AsyncStorage
- Changes are queued and synced when connection is restored
- User authentication state is preserved

## Security

- Row Level Security (RLS) is enforced on all tables
- User data is isolated by user_id
- Sensitive operations require authentication
- API keys are properly configured for client-side use

## Next Steps

1. **Test the integration** using the Database Test screen
2. **Create user accounts** through the signup flow
3. **Add classes** and verify they're stored in Supabase
4. **Test offline functionality** by disconnecting from internet
5. **Monitor database** through Supabase dashboard

## Troubleshooting

### Common Issues
1. **Authentication fails**: Check Supabase project settings and RLS policies
2. **Classes not saving**: Verify user is authenticated and database permissions
3. **Test screen errors**: Check network connection and Supabase status

### Debug Information
- All database operations are logged to console
- Test screen provides detailed error messages
- Supabase dashboard shows real-time database activity
