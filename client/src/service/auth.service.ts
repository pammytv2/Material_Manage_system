import { ApiService } from '@/service/api.service';

// ----- interface & types -----
import type { LoadingOptions } from '@/interfaces/api.interfaces';
import type { BooleanStatus } from '@/shared/interfaces/lsd-system-center/auth.interface';
import type { IViewEmployee } from '@/shared/interfaces/template-web-stack-2025/employee.interface';

export class AuthService {
  async userInfo(): Promise<IViewEmployee> {
    const url: string = '/auth/user-info';
    const config = undefined;
    const loadingOptions: LoadingOptions = {
      message: 'Loading user information...',
      delay: 300,
    };
    return await ApiService.get<IViewEmployee>(url, config, loadingOptions);
  }

  async checkAdmin(): Promise<BooleanStatus> {
    const url: string = '/auth/check-admin';
    const config = undefined;
    const loadingOptions: LoadingOptions = {
        message: 'Checking admin status...',
        delay: 300,
    };
    return await ApiService.get<BooleanStatus>(url, config, loadingOptions);
  }
}

export default AuthService;
