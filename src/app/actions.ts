'use server';

import * as userActions from './actions/user.actions';
import * as bookingActions from './actions/booking.actions';
import * as campaignActions from './actions/campaign.actions';
import * as adminActions from './actions/admin.actions';

// --- User Actions ---
export async function getActiveUserAction(...args: Parameters<typeof userActions.getActiveUserAction>) {
  return await userActions.getActiveUserAction(...args);
}
export async function getAllUsersAction(...args: Parameters<typeof userActions.getAllUsersAction>) {
  return await userActions.getAllUsersAction(...args);
}
export async function switchUserAction(...args: Parameters<typeof userActions.switchUserAction>) {
  return await userActions.switchUserAction(...args);
}
export async function bindLineAccountAction(...args: Parameters<typeof userActions.bindLineAccountAction>) {
  return await userActions.bindLineAccountAction(...args);
}
export async function unbindLineAccountAction(...args: Parameters<typeof userActions.unbindLineAccountAction>) {
  return await userActions.unbindLineAccountAction(...args);
}
export async function loginWithHospitalCredentialsAction(...args: Parameters<typeof userActions.loginWithHospitalCredentialsAction>) {
  return await userActions.loginWithHospitalCredentialsAction(...args);
}
export async function loginWithLineAction(...args: Parameters<typeof userActions.loginWithLineAction>) {
  return await userActions.loginWithLineAction(...args);
}
export async function logoutAction(...args: Parameters<typeof userActions.logoutAction>) {
  return await userActions.logoutAction(...args);
}
export async function updateUserRoleAction(...args: Parameters<typeof userActions.updateUserRoleAction>) {
  return await userActions.updateUserRoleAction(...args);
}

// --- Booking Actions ---
export async function getSlotsAction(...args: Parameters<typeof bookingActions.getSlotsAction>) {
  return await bookingActions.getSlotsAction(...args);
}
export async function getBookingsAction(...args: Parameters<typeof bookingActions.getBookingsAction>) {
  return await bookingActions.getBookingsAction(...args);
}
export async function getUserBookingAction(...args: Parameters<typeof bookingActions.getUserBookingAction>) {
  return await bookingActions.getUserBookingAction(...args);
}
export async function bookSlotAction(...args: Parameters<typeof bookingActions.bookSlotAction>) {
  return await bookingActions.bookSlotAction(...args);
}
export async function cancelBookingAction(...args: Parameters<typeof bookingActions.cancelBookingAction>) {
  return await bookingActions.cancelBookingAction(...args);
}
export async function rescheduleBookingAction(...args: Parameters<typeof bookingActions.rescheduleBookingAction>) {
  return await bookingActions.rescheduleBookingAction(...args);
}
export async function updateDailySlotAction(...args: Parameters<typeof bookingActions.updateDailySlotAction>) {
  return await bookingActions.updateDailySlotAction(...args);
}
export async function batchUpdateSlotsAction(...args: Parameters<typeof bookingActions.batchUpdateSlotsAction>) {
  return await bookingActions.batchUpdateSlotsAction(...args);
}

// --- Campaign & Package Actions ---
export async function getCampaignAction(...args: Parameters<typeof campaignActions.getCampaignAction>) {
  return await campaignActions.getCampaignAction(...args);
}
export async function getCampaignsAction(...args: Parameters<typeof campaignActions.getCampaignsAction>) {
  return await campaignActions.getCampaignsAction(...args);
}
export async function createCampaignAction(...args: Parameters<typeof campaignActions.createCampaignAction>) {
  return await campaignActions.createCampaignAction(...args);
}
export async function toggleCampaignActiveAction(...args: Parameters<typeof campaignActions.toggleCampaignActiveAction>) {
  return await campaignActions.toggleCampaignActiveAction(...args);
}
export async function updateCampaignByIdAction(...args: Parameters<typeof campaignActions.updateCampaignByIdAction>) {
  return await campaignActions.updateCampaignByIdAction(...args);
}
export async function deleteCampaignAction(...args: Parameters<typeof campaignActions.deleteCampaignAction>) {
  return await campaignActions.deleteCampaignAction(...args);
}
export async function getPackagesAction(...args: Parameters<typeof campaignActions.getPackagesAction>) {
  return await campaignActions.getPackagesAction(...args);
}
export async function createPackageAction(...args: Parameters<typeof campaignActions.createPackageAction>) {
  return await campaignActions.createPackageAction(...args);
}
export async function updatePackageAction(...args: Parameters<typeof campaignActions.updatePackageAction>) {
  return await campaignActions.updatePackageAction(...args);
}
export async function deletePackageAction(...args: Parameters<typeof campaignActions.deletePackageAction>) {
  return await campaignActions.deletePackageAction(...args);
}
export async function getAllMasterItemsAction(...args: Parameters<typeof campaignActions.getAllMasterItemsAction>) {
  return await campaignActions.getAllMasterItemsAction(...args);
}
export async function createMasterItemAction(...args: Parameters<typeof campaignActions.createMasterItemAction>) {
  return await campaignActions.createMasterItemAction(...args);
}
export async function updateMasterItemAction(...args: Parameters<typeof campaignActions.updateMasterItemAction>) {
  return await campaignActions.updateMasterItemAction(...args);
}
export async function deleteMasterItemAction(...args: Parameters<typeof campaignActions.deleteMasterItemAction>) {
  return await campaignActions.deleteMasterItemAction(...args);
}
export async function getEntitlementsAction(...args: Parameters<typeof campaignActions.getEntitlementsAction>) {
  return await campaignActions.getEntitlementsAction(...args);
}
export async function createEntitlementAction(...args: Parameters<typeof campaignActions.createEntitlementAction>) {
  return await campaignActions.createEntitlementAction(...args);
}
export async function updateEntitlementAction(...args: Parameters<typeof campaignActions.updateEntitlementAction>) {
  return await campaignActions.updateEntitlementAction(...args);
}
export async function deleteEntitlementAction(...args: Parameters<typeof campaignActions.deleteEntitlementAction>) {
  return await campaignActions.deleteEntitlementAction(...args);
}
export async function calculateBookingPriceAction(...args: Parameters<typeof campaignActions.calculateBookingPriceAction>) {
  return await campaignActions.calculateBookingPriceAction(...args);
}

// --- Admin Actions ---
export async function getOrganizationsAction(...args: Parameters<typeof adminActions.getOrganizationsAction>) {
  return await adminActions.getOrganizationsAction(...args);
}
export async function createOrganizationAction(...args: Parameters<typeof adminActions.createOrganizationAction>) {
  return await adminActions.createOrganizationAction(...args);
}
export async function updateOrganizationAction(...args: Parameters<typeof adminActions.updateOrganizationAction>) {
  return await adminActions.updateOrganizationAction(...args);
}
export async function deleteOrganizationAction(...args: Parameters<typeof adminActions.deleteOrganizationAction>) {
  return await adminActions.deleteOrganizationAction(...args);
}
export async function importOrganizationUsersAction(...args: Parameters<typeof adminActions.importOrganizationUsersAction>) {
  return await adminActions.importOrganizationUsersAction(...args);
}
export async function syncHospitalStaffDataAction(...args: Parameters<typeof adminActions.syncHospitalStaffDataAction>) {
  return await adminActions.syncHospitalStaffDataAction(...args);
}
export async function getAuditLogsAction(...args: Parameters<typeof adminActions.getAuditLogsAction>) {
  return await adminActions.getAuditLogsAction(...args);
}
export async function sendLineReminderAction(...args: Parameters<typeof adminActions.sendLineReminderAction>) {
  return await adminActions.sendLineReminderAction(...args);
}
export async function sendTelegramBookingNotificationAction(...args: Parameters<typeof adminActions.sendTelegramBookingNotificationAction>) {
  return await adminActions.sendTelegramBookingNotificationAction(...args);
}
export async function processBookingRemindersAction(...args: Parameters<typeof adminActions.processBookingRemindersAction>) {
  return await adminActions.processBookingRemindersAction(...args);
}
export async function sendTelegramUnbookedReminderAction(...args: Parameters<typeof adminActions.sendTelegramUnbookedReminderAction>) {
  return await adminActions.sendTelegramUnbookedReminderAction(...args);
}
export async function toggleMaintenanceModeAction(...args: Parameters<typeof adminActions.toggleMaintenanceModeAction>) {
  return await adminActions.toggleMaintenanceModeAction(...args);
}
export async function getMaintenanceModeAction(...args: Parameters<typeof adminActions.getMaintenanceModeAction>) {
  return await adminActions.getMaintenanceModeAction(...args);
}
