import { describe, it, expect } from 'vitest';
import {
  Report,
  ReportFormData,
  SelectChangeEvent,
  Reply,
  ReportThread,
  FlattenedMessage
} from './report';

describe('Report Types', () => {
  it('should create a valid Report object', () => {
    const report: Report = {
      id: 1,
      from_student: 'John Doe',
      from_student_username: 'johndoe123',
      email: 'john@example.com',
      report_type: 'bug',
      subject: 'App crashes on startup',
      details: 'When I open the app, it crashes immediately',
      created_at: '2023-04-01T10:30:00Z',
      requested_at: '2023-04-01T10:00:00Z',
      latest_reply: {
        replied_by: 'admin',
        content: 'We are looking into this issue',
        created_at: '2023-04-02T09:15:00Z'
      }
    };

    expect(report).toBeDefined();
    expect(report.id).toBe(1);
    expect(report.from_student).toBe('John Doe');
    expect(report.report_type).toBe('bug');
  });

  it('should create a valid Report with null values', () => {
    const report: Report = {
      id: 2,
      from_student: null,
      email: null,
      report_type: 'feature',
      subject: 'Add dark mode',
      details: 'Please add dark mode to the app',
      created_at: '2023-04-03T14:20:00Z'
    };

    expect(report).toBeDefined();
    expect(report.from_student).toBeNull();
    expect(report.email).toBeNull();
    expect(report.latest_reply).toBeUndefined();
  });

  it('should create a valid ReportFormData object', () => {
    const formData: ReportFormData = {
      report_type: 'bug',
      subject: 'Login issue',
      details: 'Cannot log in with correct credentials'
    };

    expect(formData).toBeDefined();
    expect(formData.report_type).toBe('bug');
    expect(formData.subject).toBe('Login issue');
    expect(formData.details).toBe('Cannot log in with correct credentials');
  });

  it('should create a valid SelectChangeEvent object', () => {
    const event: SelectChangeEvent = {
      target: {
        name: 'report_type',
        value: 'feature'
      }
    };

    expect(event).toBeDefined();
    expect(event.target.name).toBe('report_type');
    expect(event.target.value).toBe('feature');
  });

  it('should create a valid Reply object', () => {
    const reply: Reply = {
      id: 1,
      report_id: 1,
      report_subject: 'App crashes on startup',
      content: 'We are investigating this issue',
      created_at: '2023-04-02T09:15:00Z',
      replied_by_username: 'admin_user',
      is_admin_reply: true,
      child_replies: [],
      user_type: 'admin',
      is_new: false
    };

    expect(reply).toBeDefined();
    expect(reply.id).toBe(1);
    expect(reply.report_id).toBe(1);
    expect(reply.is_admin_reply).toBe(true);
    expect(reply.user_type).toBe('admin');
  });

  it('should create a valid Reply with child replies', () => {
    const reply: Reply = {
      id: 1,
      report_id: 1,
      report_subject: 'App crashes on startup',
      content: 'We are investigating this issue',
      created_at: '2023-04-02T09:15:00Z',
      replied_by_username: 'admin_user',
      is_admin_reply: true,
      child_replies: [
        {
          id: 2,
          report_id: 1,
          report_subject: 'App crashes on startup',
          content: 'Thank you for looking into this',
          created_at: '2023-04-02T10:20:00Z',
          replied_by_username: 'johndoe123',
          is_admin_reply: false,
          child_replies: [],
          user_type: 'student',
          is_new: true
        }
      ],
      user_type: 'admin',
      is_new: false
    };

    expect(reply).toBeDefined();
    expect(reply.child_replies.length).toBe(1);
    expect(reply.child_replies[0].id).toBe(2);
    expect(reply.child_replies[0].user_type).toBe('student');
  });

  it('should create a valid ReportThread object', () => {
    const thread: ReportThread = {
      id: 1,
      report_type: 'bug',
      subject: 'App crashes on startup',
      details: 'When I open the app, it crashes immediately',
      requested_at: '2023-04-01T10:00:00Z',
      from_student_username: 'johndoe123',
      top_level_replies: [
        {
          id: 1,
          report_id: 1,
          report_subject: 'App crashes on startup',
          content: 'We are investigating this issue',
          created_at: '2023-04-02T09:15:00Z',
          replied_by_username: 'admin_user',
          is_admin_reply: true,
          child_replies: [],
          user_type: 'admin',
          is_new: false
        }
      ]
    };

    expect(thread).toBeDefined();
    expect(thread.id).toBe(1);
    expect(thread.report_type).toBe('bug');
    expect(thread.top_level_replies.length).toBe(1);
    expect(thread.top_level_replies[0].id).toBe(1);
  });

  it('should create a valid FlattenedMessage object', () => {
    const message: FlattenedMessage = {
      id: 1,
      subject: 'App crashes on startup',
      content: 'We are investigating this issue',
      sender: 'admin_user',
      timestamp: '2023-04-02T09:15:00Z',
      is_admin: true,
      is_original: false,
      level: 0
    };

    expect(message).toBeDefined();
    expect(message.id).toBe(1);
    expect(message.subject).toBe('App crashes on startup');
    expect(message.is_admin).toBe(true);
    expect(message.level).toBe(0);
  });
});