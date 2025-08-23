/**
 * StoreFlow TypeScript SDK
 * Minimal TypeScript SDK for the StoreFlow frontend with typed endpoints
 * and a single polymorphic Comments/Approvals client.
 */

export interface Id extends String {}

export interface User {
  _id: Id;
  email: string;
  name?: string;
  globalRole: 'superadmin' | 'user';
  memberships: Membership[];
  status: 'active' | 'suspended';
  lastLoginAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Membership {
  scope: 'store' | 'project';
  scopeId: Id;
  role: 'admin' | 'member';
}

export interface Store {
  _id: Id;
  name: string;
  code?: string;
  address?: string;
  status: 'planning' | 'active' | 'closed';
  createdBy: Id;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  _id: Id;
  storeId: Id;
  name: string;
  type: 'setup' | 'renovation' | 'other';
  status: 'not_started' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  startDate?: Date;
  endDate?: Date;
  createdBy: Id;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  _id: Id;
  projectId: Id;
  title: string;
  description?: string;
  assigneeId?: Id;
  status: 'todo' | 'in_progress' | 'blocked' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  tags: string[];
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Milestone {
  _id: Id;
  projectId: Id;
  title: string;
  dueDate?: Date;
  status: 'not_started' | 'in_progress' | 'completed';
  sequence: number;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Blocker {
  _id: Id;
  projectId: Id;
  taskId?: Id;
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'resolved' | 'dismissed';
  raisedBy: Id;
  resolvedBy?: Id;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  _id: Id;
  subjectModel: 'Store' | 'Project' | 'Task' | 'Milestone' | 'Blocker' | 'File' | 'ApprovalRequest';
  subjectId: Id;
  parentCommentId?: Id;
  body: string;
  mentionedUserIds: Id[];
  attachments: { fileId: Id; name: string }[];
  createdBy: Id;
  editedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovalRequest {
  _id: Id;
  subjectModel: 'Store' | 'Project' | 'Task' | 'Milestone' | 'Blocker' | 'File';
  subjectId: Id;
  requestedBy: Id;
  approverIds: Id[];
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  decisions: Decision[];
  dueDate?: Date;
  note?: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Decision {
  userId: Id;
  action: 'approve' | 'reject' | 'request_changes';
  comment?: string;
  decidedAt: Date;
}

export interface File {
  _id: Id;
  subjectModel: 'Store' | 'Project' | 'Task' | 'Milestone' | 'Blocker' | 'ApprovalRequest';
  subjectId: Id;
  name?: string;
  versions: FileVersion[];
  currentVersionIndex: number;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FileVersion {
  key?: string;
  url?: string;
  size?: number;
  mimeType?: string;
  uploadedAt: Date;
  uploadedBy?: Id;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
  };
  links?: Record<string, string>;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export type SubjectType = 'store' | 'project' | 'task' | 'milestone' | 'blocker' | 'file' | 'approval';

export class StoreFlowClient {
  private baseUrl: string;
  private token?: string;

  constructor(baseUrl: string, token?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.token = token;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(method: string, path: string, body?: any): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.error.message || 'API request failed');
    }

    return response.json();
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<{ token: string }> {
    const response = await this.request<{ token: string }>('POST', '/auth/login', { email, password });
    return response.data;
  }

  async logout(): Promise<void> {
    await this.request('POST', '/auth/logout');
  }

  // User endpoints
  async getCurrentUser(): Promise<User> {
    const response = await this.request<User>('GET', '/users/me');
    return response.data;
  }

  async getUser(id: Id): Promise<User> {
    const response = await this.request<User>('GET', `/users/${id}`);
    return response.data;
  }

  // Store endpoints
  async getStores(): Promise<Store[]> {
    const response = await this.request<Store[]>('GET', '/stores');
    return response.data;
  }

  async createStore(data: Partial<Store>): Promise<Store> {
    const response = await this.request<Store>('POST', '/stores', data);
    return response.data;
  }

  async getStore(storeId: Id): Promise<Store> {
    const response = await this.request<Store>('GET', `/stores/${storeId}`);
    return response.data;
  }

  async updateStore(storeId: Id, data: Partial<Store>): Promise<Store> {
    const response = await this.request<Store>('PATCH', `/stores/${storeId}`, data);
    return response.data;
  }

  // Project endpoints
  async getProjects(storeId: Id): Promise<Project[]> {
    const response = await this.request<Project[]>('GET', `/stores/${storeId}/projects`);
    return response.data;
  }

  async createProject(storeId: Id, data: Partial<Project>): Promise<Project> {
    const response = await this.request<Project>('POST', `/stores/${storeId}/projects`, data);
    return response.data;
  }

  async getProject(storeId: Id, projectId: Id): Promise<Project> {
    const response = await this.request<Project>('GET', `/stores/${storeId}/projects/${projectId}`);
    return response.data;
  }

  async updateProject(storeId: Id, projectId: Id, data: Partial<Project>): Promise<Project> {
    const response = await this.request<Project>('PATCH', `/stores/${storeId}/projects/${projectId}`, data);
    return response.data;
  }

  // Task endpoints
  async getTasks(storeId: Id, projectId: Id): Promise<Task[]> {
    const response = await this.request<Task[]>('GET', `/stores/${storeId}/projects/${projectId}/tasks`);
    return response.data;
  }

  async createTask(storeId: Id, projectId: Id, data: Partial<Task>): Promise<Task> {
    const response = await this.request<Task>('POST', `/stores/${storeId}/projects/${projectId}/tasks`, data);
    return response.data;
  }

  async getTask(storeId: Id, projectId: Id, taskId: Id): Promise<Task> {
    const response = await this.request<Task>('GET', `/stores/${storeId}/projects/${projectId}/tasks/${taskId}`);
    return response.data;
  }

  async updateTask(storeId: Id, projectId: Id, taskId: Id, data: Partial<Task>): Promise<Task> {
    const response = await this.request<Task>('PATCH', `/stores/${storeId}/projects/${projectId}/tasks/${taskId}`, data);
    return response.data;
  }

  // Milestone endpoints
  async getMilestones(storeId: Id, projectId: Id): Promise<Milestone[]> {
    const response = await this.request<Milestone[]>('GET', `/stores/${storeId}/projects/${projectId}/milestones`);
    return response.data;
  }

  async createMilestone(storeId: Id, projectId: Id, data: Partial<Milestone>): Promise<Milestone> {
    const response = await this.request<Milestone>('POST', `/stores/${storeId}/projects/${projectId}/milestones`, data);
    return response.data;
  }

  async getMilestone(storeId: Id, projectId: Id, milestoneId: Id): Promise<Milestone> {
    const response = await this.request<Milestone>('GET', `/stores/${storeId}/projects/${projectId}/milestones/${milestoneId}`);
    return response.data;
  }

  async updateMilestone(storeId: Id, projectId: Id, milestoneId: Id, data: Partial<Milestone>): Promise<Milestone> {
    const response = await this.request<Milestone>('PATCH', `/stores/${storeId}/projects/${projectId}/milestones/${milestoneId}`, data);
    return response.data;
  }

  // Blocker endpoints
  async getBlockers(storeId: Id, projectId: Id): Promise<Blocker[]> {
    const response = await this.request<Blocker[]>('GET', `/stores/${storeId}/projects/${projectId}/blockers`);
    return response.data;
  }

  async createBlocker(storeId: Id, projectId: Id, data: Partial<Blocker>): Promise<Blocker> {
    const response = await this.request<Blocker>('POST', `/stores/${storeId}/projects/${projectId}/blockers`, data);
    return response.data;
  }

  async getBlocker(storeId: Id, projectId: Id, blockerId: Id): Promise<Blocker> {
    const response = await this.request<Blocker>('GET', `/stores/${storeId}/projects/${projectId}/blockers/${blockerId}`);
    return response.data;
  }

  async updateBlocker(storeId: Id, projectId: Id, blockerId: Id, data: Partial<Blocker>): Promise<Blocker> {
    const response = await this.request<Blocker>('PATCH', `/stores/${storeId}/projects/${projectId}/blockers/${blockerId}`, data);
    return response.data;
  }

  // Polymorphic Comments client
  async getComments(params?: {
    subjectType?: SubjectType;
    subjectId?: Id;
    parentCommentId?: Id;
    page?: number;
    pageSize?: number;
  }): Promise<Comment[]> {
    const query = new URLSearchParams();
    if (params?.subjectType) query.set('subjectType', params.subjectType);
    if (params?.subjectId) query.set('subjectId', params.subjectId);
    if (params?.parentCommentId) query.set('parentCommentId', params.parentCommentId);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.pageSize) query.set('pageSize', params.pageSize.toString());
    
    const response = await this.request<Comment[]>('GET', `/comments?${query}`);
    return response.data;
  }

  async createComment(data: {
    subjectType: SubjectType;
    subjectId: Id;
    body: string;
    parentCommentId?: Id;
    mentionedUserIds?: Id[];
    attachments?: { fileId: Id; name: string }[];
  }): Promise<Comment> {
    const response = await this.request<Comment>('POST', '/comments', data);
    return response.data;
  }

  async createReply(commentId: Id, data: {
    body: string;
    mentionedUserIds?: Id[];
    attachments?: { fileId: Id; name: string }[];
  }): Promise<Comment> {
    const response = await this.request<Comment>('POST', `/comments/${commentId}/replies`, data);
    return response.data;
  }

  // Polymorphic Approvals client
  async getApprovals(params?: {
    subjectType?: SubjectType;
    subjectId?: Id;
    status?: 'pending' | 'approved' | 'rejected' | 'changes_requested';
    page?: number;
    pageSize?: number;
  }): Promise<ApprovalRequest[]> {
    const query = new URLSearchParams();
    if (params?.subjectType) query.set('subjectType', params.subjectType);
    if (params?.subjectId) query.set('subjectId', params.subjectId);
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.pageSize) query.set('pageSize', params.pageSize.toString());
    
    const response = await this.request<ApprovalRequest[]>('GET', `/approvals?${query}`);
    return response.data;
  }

  async createApproval(data: {
    subjectType: SubjectType;
    subjectId: Id;
    approverIds: Id[];
    dueDate?: Date;
    note?: string;
  }): Promise<ApprovalRequest> {
    const response = await this.request<ApprovalRequest>('POST', '/approvals', data);
    return response.data;
  }

  async makeDecision(approvalId: Id, data: {
    action: 'approve' | 'reject' | 'request_changes';
    comment?: string;
  }): Promise<ApprovalRequest> {
    const response = await this.request<ApprovalRequest>('POST', `/approvals/${approvalId}/decisions`, data);
    return response.data;
  }

  // File endpoints
  async getFiles(params?: {
    subjectType?: SubjectType;
    subjectId?: Id;
  }): Promise<File[]> {
    const query = new URLSearchParams();
    if (params?.subjectType) query.set('subjectType', params.subjectType);
    if (params?.subjectId) query.set('subjectId', params.subjectId);
    
    const response = await this.request<File[]>('GET', `/files?${query}`);
    return response.data;
  }

  async createFile(data: {
    subjectType: SubjectType;
    subjectId: Id;
    name: string;
    versions?: FileVersion[];
  }): Promise<File> {
    const response = await this.request<File>('POST', '/files', data);
    return response.data;
  }
}

export default StoreFlowClient;