// SMS Service has been disabled
// Only email authentication is supported

console.log('SMS service disabled - using email authentication only')

// All SMS functionality has been removed
// Only email authentication is supported

export const sendSMSOTP = async (phoneNumber, otp) => {
  throw new Error('SMS authentication has been disabled. Please use email authentication.')
}

export const formatPhoneNumber = (phoneNumber) => {
  throw new Error('Phone number formatting is no longer supported. Please use email authentication.')
}