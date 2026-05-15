export type UserRole = 'student' | 'cr' | 'acr' | 'teacher' | 'super_admin';
export type UserStatus = 'pending' | 'approved' | 'rejected' | 'banned';
export type RequestStatus = 'pending' | 'accepted' | 'rejected';
export type SectionRequestStatus = 'pending' | 'approved' | 'rejected';
export type PriorityLevel = 'normal' | 'high' | 'urgent';

export interface UserProfile {
  id: string;
  student_id: string | null;
  full_name: string;
  email: string;
  role: UserRole;
  department: string | null;
  semester: number | null;
  section: string | null;
  whatsapp_number: string | null;
  address: string | null;
  status: UserStatus;
  created_at: string;
}

export interface Department {
  id: number;
  name: string;
  created_at: string;
}

export interface ActivityLog {
  id: number;
  user_id: string | null;
  action: string;
  details: string | null;
  ip_address: string | null;
  created_at: string;
  full_name?: string;
  role?: UserRole;
  department?: string;
}

export interface ConversationRequest {
  id: number;
  user_a: string;
  user_b: string;
  status: RequestStatus;
  initiated_by: string;
  created_at: string;
}

export interface CrAcrChatPost {
  id: number;
  user_id: string;
  content: string;
  parent_id: number | null;
  created_at: string;
  full_name?: string;
  role?: UserRole;
  section?: string;
  department?: string;
  parent_content?: string;
  parent_name?: string;
  parent_role?: UserRole;
  parent_section?: string;
}

export interface Deadline {
  id: number;
  title: string;
  description: string | null;
  subject: string | null;
  due_date: string;
  priority: PriorityLevel;
  target_department: string | null;
  target_semester: number | null;
  target_section: string | null;
  created_by: string;
  created_at: string;
  creator_name?: string;
  creator_role?: UserRole;
  creator_department?: string;
  links?: DeadlineLink[];
}

export interface DeadlineLink {
  id: number;
  deadline_id: number;
  url: string;
  button_text: string;
  sort_order: number;
  created_at: string;
}

export interface DeadlineRead {
  id: number;
  deadline_id: number;
  user_id: string;
  is_acknowledged: boolean;
  created_at: string;
  updated_at: string;
}

export interface DiscussionPost {
  id: number;
  section: string;
  department: string;
  user_id: string;
  content: string;
  parent_id: number | null;
  created_at: string;
  full_name?: string;
  role?: UserRole;
  parent_content?: string;
  parent_name?: string;
}

export interface Message {
  id: number;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  status: RequestStatus;
  created_at: string;
  sender_name?: string;
}

export interface Notice {
  id: number;
  sender_id: string;
  title: string;
  content: string;
  target_department: string | null;
  target_semester: number | null;
  target_section: string | null;
  external_link: string | null;
  is_global: boolean;
  created_at: string;
  sender_name?: string;
  sender_role?: UserRole;
  sender_department?: string;
  links?: NoticeLink[];
}

export interface NoticeLink {
  id: number;
  notice_id: number;
  url: string;
  button_text: string;
  sort_order: number;
  created_at: string;
}

export interface NoticeRead {
  id: number;
  notice_id: number;
  user_id: string;
  is_acknowledged: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: number;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface SectionRequest {
  id: number;
  user_id: string;
  from_department: string | null;
  from_semester: number | null;
  from_section: string | null;
  to_department: string | null;
  to_semester: number | null;
  to_section: string | null;
  requested_by: string | null;
  status: SectionRequestStatus;
  created_at: string;
  student_name?: string;
  student_id_number?: string;
  student_role?: UserRole;
  requester_name?: string;
  requester_role?: UserRole;
}

export interface InboxConversation {
  id: number;
  user_a: string;
  user_b: string;
  status: RequestStatus;
  initiated_by: string;
  created_at: string;
  other_name: string;
  other_id: string;
  last_message: string | null;
  unread_count: number;
}

export interface ReceiptStats {
  total_target: number;
  read_count: number;
  ack_count: number;
  details: {
    full_name: string;
    student_id: string | null;
    role: UserRole;
    is_acknowledged: boolean;
    read_at: string;
    ack_at: string;
  }[];
}
