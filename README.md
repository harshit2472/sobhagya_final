# Sobhagya - Astrology Video Calling Platform


## New Features Added

### 1. Gift Request Listener
- **Functionality**: Astrologers can now request gifts from users during video calls
- **Implementation**: 
  - Added `onGiftRequest()` method in `SocketManager` to listen for gift requests
  - Added `requestGiftFromUser()` method for astrologers to send gift requests
  - Added gift request notification UI in `VideoCallRoom` component
  - Gift requests auto-hide after 10 seconds or when user clicks "Send Gift"

### 2. Enhanced Call End Handling
- **Functionality**: Proper socket cleanup when calls end
- **Implementation**:
  - Added `emitCallEnd()` method to notify other participants when call ends
  - Enhanced `disconnect()` method to properly clean up socket connections
  - Updated `handleLeaveCall()` in `VideoCallRoom` to emit call_end event and clean up socket
  - Improved error handling and logging for better debugging

### Socket Events
- `call_end`: Emitted when a participant ends the call
- `gift_request`: Emitted when astrologer requests a gift from user
- `request_gift_from_user`: Emitted by astrologer to request specific gift

### Usage Examples

#### For Users (in VideoCallRoom):
```typescript
// Gift request listener is automatically set up
// Users will see a notification when astrologer requests a gift
// Clicking "Send Gift" opens the gift panel
```

#### For Astrologers:
```typescript
// Request a gift from user
await socketManager.requestGiftFromUser(
  channelId, 
  giftId, 
  giftName, 
  giftIcon
);
```

#### Call End Handling:
```typescript
// When user ends call
socketManager.emitCallEnd(roomName, 'USER_ENDED');
socketManager.disconnect(); // This also emits call_end and cleans up
```

## Technical Details

### Socket Manager Enhancements
- Added proper event emission for call end
- Enhanced disconnect method with cleanup
- Added gift request functionality for astrologers
- Improved error handling and logging

### UI Components
- Gift request notification with "Send Gift" button
- Auto-hide functionality for gift requests
- Proper positioning and styling for notifications

### Error Handling
- Graceful handling of socket disconnections
- Proper cleanup of event listeners
- Error logging for debugging

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


