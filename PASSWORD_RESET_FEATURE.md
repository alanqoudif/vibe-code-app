# Password Reset Feature Documentation

## Overview
This document describes the password reset functionality that has been implemented in the learnz app. The feature allows users to reset their passwords through email verification using Supabase authentication.

## Features Implemented

### 1. Authentication Context Updates
- **File**: `src/contexts/AuthContext.tsx`
- **New Functions**:
  - `resetPassword(email: string)`: Sends password reset email to user
  - `updatePassword(newPassword: string)`: Updates user's password (for authenticated users)

### 2. Forgot Password Screen
- **File**: `src/screens/ForgotPasswordScreen.tsx`
- **Features**:
  - Email input validation
  - Password reset email sending
  - Success confirmation screen
  - Arabic UI with RTL support
  - Navigation back to login

### 3. Reset Password Screen
- **File**: `src/screens/ResetPasswordScreen.tsx`
- **Features**:
  - New password input with confirmation
  - Password strength validation
  - Password visibility toggle
  - Success confirmation
  - Navigation to login after successful reset

### 4. Updated Login Screen
- **File**: `src/screens/LoginScreen.tsx`
- **Changes**:
  - "Forgot Password" button now navigates to ForgotPasswordScreen
  - Functional password reset flow

### 5. Updated Settings Screen
- **File**: `src/screens/SettingsScreen.tsx`
- **Changes**:
  - "Change Password" option now uses real password reset functionality
  - Sends reset email to user's registered email address

### 6. Navigation Updates
- **File**: `src/navigation/AppNavigator.tsx`
- **Changes**:
  - Added ForgotPasswordScreen to AuthStack
  - Added ResetPasswordScreen to AuthStack

## How It Works

### Password Reset Flow

1. **User Initiates Reset**:
   - User clicks "Forgot Password" on login screen OR
   - User clicks "Change Password" in settings

2. **Email Input**:
   - User enters their email address
   - System validates email format
   - Supabase sends password reset email

3. **Email Verification**:
   - User receives email with reset link
   - Link contains deep link: `learnz://reset-password`

4. **Password Update**:
   - User clicks link and is taken to ResetPasswordScreen
   - User enters new password with confirmation
   - System validates password strength
   - Password is updated in Supabase

5. **Completion**:
   - User is redirected to login screen
   - User can now login with new password

### Password Requirements
- Minimum 6 characters
- At least one letter
- At least one number

## Technical Implementation

### Supabase Integration
- Uses `supabase.auth.resetPasswordForEmail()` for sending reset emails
- Uses `supabase.auth.updateUser()` for updating passwords
- Deep link configuration: `learnz://reset-password`

### Error Handling
- Email validation
- Password strength validation
- Network error handling
- User-friendly Arabic error messages

### UI/UX Features
- Consistent Arabic RTL design
- Loading states during operations
- Success/error feedback
- Password visibility toggles
- Responsive design

## Configuration Required

### Supabase Setup
1. **Email Templates**: Configure password reset email template in Supabase dashboard
2. **Site URL**: Set site URL to handle redirects
3. **Deep Links**: Configure deep link handling for mobile app

### Deep Link Configuration
The app uses the deep link `learnz://reset-password` for password reset. You may need to:
1. Configure this in your app.json
2. Set up URL scheme handling in your mobile app
3. Update Supabase redirect URLs

## Testing

### Test Scenarios
1. **Valid Email Reset**:
   - Enter valid email
   - Check email for reset link
   - Click link and set new password

2. **Invalid Email**:
   - Enter invalid email format
   - Verify error message

3. **Password Validation**:
   - Test weak passwords
   - Test password confirmation mismatch

4. **Settings Password Change**:
   - Go to Settings > Change Password
   - Verify email is sent to correct address

## Security Considerations

1. **Email Verification**: Only registered emails can reset passwords
2. **Token Expiration**: Reset links expire after a set time
3. **Password Strength**: Enforced minimum requirements
4. **Rate Limiting**: Supabase handles rate limiting for reset requests

## Future Enhancements

1. **SMS Reset**: Add SMS-based password reset option
2. **Security Questions**: Add security questions for additional verification
3. **Password History**: Prevent reuse of recent passwords
4. **Two-Factor Authentication**: Add 2FA for enhanced security

## Troubleshooting

### Common Issues
1. **Email Not Received**: Check spam folder, verify email address
2. **Link Not Working**: Ensure deep link is properly configured
3. **Password Update Fails**: Check password requirements
4. **Navigation Issues**: Verify screen names in navigation

### Debug Information
- Check console logs for detailed error messages
- Verify Supabase configuration
- Test with different email providers

## Files Modified/Created

### New Files
- `src/screens/ForgotPasswordScreen.tsx`
- `src/screens/ResetPasswordScreen.tsx`
- `PASSWORD_RESET_FEATURE.md`

### Modified Files
- `src/contexts/AuthContext.tsx`
- `src/screens/LoginScreen.tsx`
- `src/screens/SettingsScreen.tsx`
- `src/navigation/AppNavigator.tsx`

## Conclusion

The password reset feature is now fully functional and integrated with Supabase authentication. Users can reset their passwords through email verification, and the feature includes proper validation, error handling, and a user-friendly Arabic interface.
