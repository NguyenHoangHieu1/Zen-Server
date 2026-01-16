export const socketNameOn = {
  joinChatRoom: 'joinChatRoom',
  exitChatRoom: 'exitChatRoom',
  sendMessage: 'sendMessage',
  joinAllChatRoom: 'joinAllChatRoom',
  seeMessages: 'seeMessages',
  sendNotification: 'sendNotification',
  getNotifications:'getNotifications'
} as const;

export const socketNameEmit = {
  receiveMessage: 'receiveMessage',
} as const;
