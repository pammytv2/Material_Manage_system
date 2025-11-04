//  ----- 📖 Library 📖 -----
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

//  ----- ⚙️ Providers & Services ⚙️ -----
import { DatabaseService } from '../../database/database.service';

//  ----- 🧩 Interfaces & Types 🧩 -----
import { IViewEmployee } from 'shared/interfaces/template-web-stack-2025/employee.interface';
// Update the import path to the correct location of JwtPayloadData
import { JwtPayloadData } from 'shared/interfaces/lsd-system-center/auth.interface';

@Injectable()
export class EmployeesService {
  constructor(private readonly databaseService: DatabaseService) {}

  // ใช้ getter function แทนการกำหนดค่าเริ่มต้น
  private get DATABASE_NAME(): string {
    return this.databaseService.getDatabaseName();
  }

  async findAll() {
    const query: string = `SELECT * FROM view_employee_active;`;
    const employees: IViewEmployee[] = await this.databaseService.query<
      IViewEmployee[]
    >(this.DATABASE_NAME, query);
    return employees;
  }

 async findMyInfo() {
    const employees: IViewEmployee[] = await this.findAll();
    console.log('Global JWT Payload:', global.jwtPayload);
    
    let jwtPayload: JwtPayloadData;

    // 🔧 Development Mode: ใช้ token จาก .env
    if (process.env.NODE_ENV === 'development' && process.env.VITE_DEV_TOKEN_PAYLOAD) {
      try {
        jwtPayload = JSON.parse(process.env.VITE_DEV_TOKEN_PAYLOAD);
        console.log('🚀 Using development token payload:', jwtPayload);
      } catch (error) {
        console.error('❌ Invalid VITE_DEV_TOKEN_PAYLOAD format:', error);
        throw new HttpException('Invalid development token format', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    } 
    // 🔒 Production Mode: ใช้ payload จาก JWT
    else if (global.jwtPayload) {
      jwtPayload = global.jwtPayload as JwtPayloadData;
      console.log('🔐 Using production JWT payload:', jwtPayload);
    } 
    // ❌ ไม่มี payload ทั้งคู่
    else {
      console.error('❌ No JWT payload found - neither development nor production');
      throw new HttpException('Authentication required: JWT payload not found', HttpStatus.UNAUTHORIZED);
    }

    const { UserID } = jwtPayload;
    
    if (!UserID) {
      throw new HttpException('UserID not found in JWT payload', HttpStatus.UNAUTHORIZED);
    }

    let viewEmployee: IViewEmployee = {
      ID: '',
      cardcode: '',
      thai_name: '',
      eng_name: '',
      email: '',
      position_name: '',
      position_level: '',
      JobPositionCode: '',
      WorkStatus: 'Active',
      ExeOfficeCode: '',
      ExeOfficeDesc: '',
      SECCD: '',
      section_name: '',
      GRPCD: '',
      group_name: '',
    };
    
    const myData = employees.filter((employee) => employee.ID === UserID);
    if (myData.length > 0) {
      viewEmployee = myData[0];
    } else {
      throw new HttpException('Not found employee, Not authorized', HttpStatus.FORBIDDEN);
    }
    return viewEmployee;
  }
}
