// ----- lib -----
import { defineStore } from 'pinia'
// import { PrimeIcons } from 'primevue/api'

// ----- Service -----
import { ApiService } from '@/service/api.service'
import API from '@/apis/index.api'

// ----- interface & types -----
import type { LoadingOptions } from '@/interfaces/api.interfaces'
import type { IMenuItem } from '@/interfaces/menu.interfaces'
import type { ISysApproverPosition, IUserAuth } from '@/shared/interfaces/lsd-request';
import type {
  IViewEmployee,
} from '@/shared/interfaces/lsd-request/views'
import type { BooleanStatus } from '@/shared/interfaces/lsd-system-center/auth.interface'
import type { AxiosRequestConfig } from 'axios'

interface IMainStoreState {
  userInfo: IViewEmployee
  userAuth: IUserAuth
  userApproverPosition: ISysApproverPosition[]
  isLoading: boolean
  loadingText: string
  isSilder: boolean
  adminStatus: boolean
  loading: boolean
  loadingMessage: string
  menuItems: IMenuItem[]

  assignmentMenuItems: IMenuItem
  confirmAssignmentMenuItems: IMenuItem
  processMenuItems: IMenuItem

  reportForIT: IMenuItem[]
  reportForFE: IMenuItem[]


}

//  ===== default state =====
const default_state: IMainStoreState = {
  userInfo: {
    ID: '',
    cardcode: '',
    SECCD: '',
    section_name: '',
    GRPCD: '',
    group_name: '',
    thai_name: '',
    eng_name: '',
    email: '',
    position_name: '',
    JobPositionCode: '',
    ExeOfficeCode: '',
    ExeOfficeDesc: '',
    WorkStatus: 'Active',
  },
  userAuth: {
    assignment: false,
    confirm_assignment: false,
    process: false,
  },
  userApproverPosition: [],
  isLoading: false,
  loadingText: '',
  isSilder: false,
  adminStatus: false, // Admin System Status
  loading: false,
  loadingMessage: 'Loading...',
  menuItems: [],
  assignmentMenuItems: {} as IMenuItem,
  confirmAssignmentMenuItems: {} as IMenuItem,
  processMenuItems: {} as IMenuItem,
  reportForIT: [],
  reportForFE: []
}


export const useMainStore = defineStore('main', {
  state: (): IMainStoreState => ({ ...default_state }),
  getters: {
    _loading: (state) => state.loading,
    _loadingMessage: (state) => state.loadingMessage,
    _isSilder: (state) => state.isSilder,
    _userInfo: (state) => state.userInfo,
    _userAuth: (state) => state.userAuth,
    _userApproverPosition: (state) => state.userApproverPosition,
    _adminStatus: (state) => state.adminStatus,
    _menuItems: (state) => {
      const menuItems = state.menuItems
      if (state.userAuth.assignment) menuItems.push(state.assignmentMenuItems)
      if (state.userAuth.process) menuItems.push(state.processMenuItems)
      if (state.userAuth.confirm_assignment) menuItems.push(state.confirmAssignmentMenuItems)
      if ((state.userAuth.assignment || state.userAuth.process) && state.userInfo.SECCD == '2130') {
        menuItems.push(...state.reportForIT)
      }
      if ((state.userAuth.assignment || state.userAuth.process) && state.userInfo.SECCD == '3230') {
        menuItems.push(...state.reportForFE)
      }
      return menuItems
    },
  },
  actions: {
    async setLoading(status: boolean, message?: string) {
      this.loading = status
      if (message) {
        this.loadingMessage = message
      }
    },
    async setSlider(status: boolean) {
      this.isSilder = status
    },

    async getUserData() {
      const response = await API.get<IViewEmployee>('/auth/info')
      this.setUserData(response.data)
    },
    async setUserData(data: IViewEmployee) {
      this.userInfo = data
    },

    async getUserAuth() {
      const response = await ApiService.get<IUserAuth>('/employee/my-auth')
      this.setUserAuth(response)
    },
    async setUserAuth(data: IUserAuth) {
      this.userAuth = data
    },

    async getUserApproverPosition() {
      const url: string = `/employee/find-all-approver-position`
      const config: AxiosRequestConfig = {}
      const options: LoadingOptions = { message: `Loading Approver Position...` }
      const response = await ApiService.get<ISysApproverPosition[]>(url, config, options)
      this.setUserApproverPosition(response)
    },
    async setUserApproverPosition(data: ISysApproverPosition[]) {
      this.userApproverPosition = data
    },
    async checkAdminStatus() {
      const url: string = `/auth/check-admin`
      const config: AxiosRequestConfig = {}
      const options: LoadingOptions = { message: `Checking Admin...` }
      const response = await ApiService.get<BooleanStatus>(url, config, options)
      this.setAdminStatus(response.status)
    },
    async setAdminStatus(status: boolean) {
      this.adminStatus = status
    },
  },
})
