
interface ISysApproverPosition {
  approver_position: number;
  approver_position_name: string;
  approver_position_code: string;
}

interface IViewEmployee {
  ID: string;
  cardcode: string;
  SECCD: string;
  section_name: string;
  GRPCD: string;
  group_name: string;
  thai_name: string;
  eng_name: string;
  email : string;
  position_name: string;
  JobPositionCode: string;
  ExeOfficeCode: string;
  ExeOfficeDesc: string;
  WorkStatus: 'Active' | 'Resigned';
}
interface IRequest {
  request_id: number;
  request_system_id: ICfgRequestSystem['request_system_id'];
  request_by: IViewEmployee['ID'];
  request_by_group_code: IViewEmployee['GRPCD'];
  request_by_section_code: IViewEmployee['SECCD'];
  request_by_executive_code: IViewEmployee['ExeOfficeCode'];
  request_at: string;
  request_title: string;
  request_description: string | null;
  request_total_expenses: number | null;
  request_total_save_costs: number | null;
  request_other_expenses: number | null;
  request_other_expenses_invoice: string | null;
  request_needdate: string | null;
  request_duedate: string | null;
  request_init_approver: IViewEmployee['ID'];
  request_init_approver_position: ISysApproverPosition['approver_position'];
  request_edit_mode: boolean;
}


interface ICfgRequestProcessStatus {
  request_process_status_id: number;
  request_process_status_name: string;
  request_process_status_color: string; // hex color
}


interface ICfgRequestSystem {
  request_system_id: number;
  request_of_section_id: number;
  request_system_name: string; // size : 255
  update_at: string;
  request_system_enabled: 0 | 1;
  request_system_desc: string; // size : 255
  request_system_color: string; // size : 255
  request_system_order_in_section: number; // size : 255
}

interface ICfgRequestProcess {
  request_process_id: number;
  request_system_id: ICfgRequestSystem['request_system_id'];
  request_process_name: string; // size : 255
  request_process_color: string; // size : 255
  request_process_level: number;
}

interface IRequestProcess {
  request_process_tx_id: number;
  request_id: IRequest['request_id'];
  request_process_id: ICfgRequestProcess['request_process_id'];
  request_process_status_id: ICfgRequestProcessStatus['request_process_status_id'];
  request_process_remark: string | null; // size : 255
  request_process_notify: boolean;
  update_by: string; // size : 255
  update_at: string;
}

export type { IRequestProcess };
