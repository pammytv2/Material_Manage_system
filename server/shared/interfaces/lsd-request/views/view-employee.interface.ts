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

export type { IViewEmployee };
