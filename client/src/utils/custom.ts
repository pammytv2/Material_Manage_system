import type { IRequestProcess } from '@/shared/interfaces/lsd-request';

const imageUrl = (path?: string): string => {
  const host = import.meta.env.VITE_APP_EMPLOYEE_IMAGE_URL;
  if (path) {
    return host.concat(path);
  } else {
    return host.concat('no-image');
  }
};

const checkBeExternalRepair = (
  request_process_id: IRequestProcess['request_process_id'],
): boolean => {
  const beExternalRepair: IRequestProcess['request_process_id'][] = [17, 22];
  const displayStatus: boolean = beExternalRepair.includes(request_process_id);
  return displayStatus;
};

export { imageUrl, checkBeExternalRepair };
