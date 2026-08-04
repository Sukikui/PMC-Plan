export interface AdminApplicationSettings {
  automaticUserApproval: boolean;
}

export const DEFAULT_APPLICATION_SETTINGS: AdminApplicationSettings = {
  automaticUserApproval: false,
};
