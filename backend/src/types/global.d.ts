import { Server } from 'socket.io';
import { ProjectMember, Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
  
  var io: Server;
}

export interface ProjectMemberWithUser extends ProjectMember {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}

export interface Member extends ProjectMember {
  userId: string;
  projectId: string;
  role: Role;
} 