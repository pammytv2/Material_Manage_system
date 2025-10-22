
import type { ISysApproverPosition } from './sys-approver-position.interface';
import type { IRequestProcess } from './request-process.interface';


interface IUserAuth {
  assignment: boolean;
  confirm_assignment: boolean;
  process: boolean;
}

export type {

  ISysApproverPosition,
  IUserAuth,
  IRequestProcess,

};
