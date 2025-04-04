import { describe, it, expect } from 'vitest';
import { 
  Society, 
  SocietyEvent, 
  Event, 
  Student, 
  Report, 
  News, 
  ActivityLog, 
  ReportReply,
  Admin
} from '../../types';

describe('Type definitions', () => {
  // Society tests
  describe('Society', () => {
    it('should create a valid Society object', () => {
      const society: Society = {
        id: 1,
        name: 'Computer Science Society',
        societyMembers: [1, 2, 3],
        president: 1,
        description: 'A society for CS enthusiasts',
        category: 'Academic',
        social_media_links: {
          instagram: 'https://instagram.com/css',
          twitter: 'https://twitter.com/css'
        },
        timetable: 'Meets every Friday at 5pm',
        membership_requirements: 'Open to all students',
        upcoming_projects_or_plans: 'Hackathon in December',
        tags: ['technology', 'programming', 'computer science'],
        icon: 'cs-icon.png',
        leader: 'John Doe',
        roles: ['President', 'Secretary', 'Treasurer'],
        status: 'active',
        approved_by: 'admin123'
      };

      expect(society).toBeDefined();
      expect(society.id).toBe(1);
      expect(society.name).toBe('Computer Science Society');
      expect(society.societyMembers).toContain(1);
      expect(society.president).toBe(1);
      expect(society.roles).toHaveLength(3);
      expect(society.social_media_links.instagram).toBe('https://instagram.com/css');
    });
  });

  // SocietyEvent tests
  describe('SocietyEvent', () => {
    it('should create a valid SocietyEvent object', () => {
      const societyEvent: SocietyEvent = {
        id: 1,
        title: 'Coding Workshop',
        description: 'Learn to code with the CS Society',
        date: '2025-04-15',
        startTime: '17:00',
        duration: '2 hours',
        hostedBy: 1,
        location: 'CS Building, Room 101'
      };

      expect(societyEvent).toBeDefined();
      expect(societyEvent.id).toBe(1);
      expect(societyEvent.title).toBe('Coding Workshop');
      expect(societyEvent.date).toBe('2025-04-15');
      expect(societyEvent.hostedBy).toBe(1);
    });
  });

  // Event tests
  describe('Event', () => {
    it('should create a valid Event object', () => {
      const event: Event = {
        id: 1,
        title: 'Campus-wide Career Fair',
        description: 'Annual career fair for all students',
        date: '2025-05-20',
        start_time: '10:00',
        duration: '6 hours',
        hosted_by: 5,
        location: 'Student Union'
      };

      expect(event).toBeDefined();
      expect(event.id).toBe(1);
      expect(event.title).toBe('Campus-wide Career Fair');
      expect(event.date).toBe('2025-05-20');
      expect(event.hosted_by).toBe(5);
    });
  });

  // Student tests
  describe('Student', () => {
    it('should create a valid Student object', () => {
      const student: Student = {
        id: 1,
        username: 'jdoe123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@university.edu',
        isActive: true,
        role: 'Undergraduate',
        major: 'Computer Science',
        societies: ['Computer Science Society', 'Chess Club'],
        presidentOf: [1],
        isPresident: true
      };

      expect(student).toBeDefined();
      expect(student.id).toBe(1);
      expect(student.username).toBe('jdoe123');
      expect(student.firstName).toBe('John');
      expect(student.lastName).toBe('Doe');
      expect(student.isActive).toBe(true);
      expect(student.societies).toContain('Computer Science Society');
      expect(student.presidentOf).toContain(1);
      expect(student.isPresident).toBe(true);
    });
  });

  // Report tests
  describe('Report', () => {
    it('should create a valid Report object', () => {
      const report: Report = {
        id: 1,
        from_student: 'jdoe123',
        report_type: 'Complaint',
        subject: 'Issue with society membership',
        details: 'I paid my dues but have not been added to the member list.',
        created_at: '2025-03-15T14:30:00Z'
      };

      expect(report).toBeDefined();
      expect(report.id).toBe(1);
      expect(report.from_student).toBe('jdoe123');
      expect(report.report_type).toBe('Complaint');
      expect(report.subject).toBe('Issue with society membership');
      expect(report.created_at).toBe('2025-03-15T14:30:00Z');
    });
  });

  // News tests
  describe('News', () => {
    it('should create a valid News object', () => {
      const news: News = {
        id: 1,
        title: 'New Society Platform Launched',
        brief: 'Check out the new features of our society management platform.',
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...'
      };

      expect(news).toBeDefined();
      expect(news.id).toBe(1);
      expect(news.title).toBe('New Society Platform Launched');
      expect(news.brief).toBe('Check out the new features of our society management platform.');
      expect(news.content).toContain('Lorem ipsum');
    });
  });

  // ActivityLog tests
  describe('ActivityLog', () => {
    it('should create a valid ActivityLog object', () => {
      const activityLog: ActivityLog = {
        id: 1,
        action_type: 'CREATE',
        target_type: 'Society',
        target_name: 'Computer Science Society',
        performed_by: 'jdoe123',
        timestamp: '2025-03-10T09:15:00Z'
      };

      expect(activityLog).toBeDefined();
      expect(activityLog.id).toBe(1);
      expect(activityLog.action_type).toBe('CREATE');
      expect(activityLog.target_type).toBe('Society');
      expect(activityLog.target_name).toBe('Computer Science Society');
      expect(activityLog.performed_by).toBe('jdoe123');
    });

    it('should handle optional fields in ActivityLog', () => {
      const activityLog: ActivityLog = {
        id: 2,
        action_type: 'SUSPEND',
        target_type: 'Society',
        target_name: 'Computer Science Society',
        performed_by: 'admin123',
        timestamp: '2025-03-12T10:00:00Z',
        expiration_date: '2025-03-19T10:00:00Z',
        reason: 'Violation of university guidelines'
      };

      expect(activityLog).toBeDefined();
      expect(activityLog.expiration_date).toBe('2025-03-19T10:00:00Z');
      expect(activityLog.reason).toBe('Violation of university guidelines');
    });
  });

  // ReportReply tests
  describe('ReportReply', () => {
    it('should create a valid ReportReply object', () => {
      const reportReply: ReportReply = {
        id: 1,
        report_id: 1,
        report_subject: 'Issue with society membership',
        from_user: 'admin123',
        user_type: 'admin',
        content: 'We are looking into this issue and will resolve it soon.',
        created_at: '2025-03-16T10:45:00Z',
        is_new: true
      };

      expect(reportReply).toBeDefined();
      expect(reportReply.id).toBe(1);
      expect(reportReply.report_id).toBe(1);
      expect(reportReply.from_user).toBe('admin123');
      expect(reportReply.user_type).toBe('admin');
      expect(reportReply.is_new).toBe(true);
    });

    it('should validate user_type is one of the allowed values', () => {
      const adminReply: ReportReply = {
        id: 1,
        report_id: 1,
        report_subject: 'Test',
        from_user: 'admin1',
        user_type: 'admin',
        content: 'Admin reply',
        created_at: '2025-03-16T10:45:00Z',
        is_new: true
      };
      
      const studentReply: ReportReply = {
        id: 2,
        report_id: 1,
        report_subject: 'Test',
        from_user: 'student1',
        user_type: 'student',
        content: 'Student reply',
        created_at: '2025-03-16T11:00:00Z',
        is_new: false
      };
      
      const moderatorReply: ReportReply = {
        id: 3,
        report_id: 1,
        report_subject: 'Test',
        from_user: 'mod1',
        user_type: 'moderator',
        content: 'Moderator reply',
        created_at: '2025-03-16T11:15:00Z',
        is_new: true
      };

      expect(adminReply.user_type).toBe('admin');
      expect(studentReply.user_type).toBe('student');
      expect(moderatorReply.user_type).toBe('moderator');
    });
  });

  // Admin tests
  describe('Admin', () => {
    it('should create a valid Admin object', () => {
      const admin: Admin = {
        first_name: 'Admin',
        last_name: 'User',
        username: 'admin123',
        email: 'admin@university.edu'
      };

      expect(admin).toBeDefined();
      expect(admin.first_name).toBe('Admin');
      expect(admin.last_name).toBe('User');
      expect(admin.username).toBe('admin123');
      expect(admin.email).toBe('admin@university.edu');
    });
  });
});